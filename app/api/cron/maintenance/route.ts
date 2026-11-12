import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';
import { syncCatalogAndPendingVerification } from '@/lib/catalog-sync';

const DEFAULT_MAINTENANCE_FREQUENCIES = {
  lastDescaling: 180,
  waterFilterLastChanged: 60,
  lastBackflush: 60,
};

export async function GET(request: Request) {
  // Only allow Vercel Cron OR localhost testing to trigger this
  const authHeader = request.headers.get('authorization');
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isLocalHost = request.url.includes("localhost");

  if (!isVercelCron && !isLocalHost) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Automatically drain any pending_verification roasters/beans into global collections
    await syncCatalogAndPendingVerification().catch((syncErr) => {
      console.error('Catalog sync during cron failed:', syncErr);
    });

    const usersSnapshot = await adminDb.collection('users').get();
    
    let notificationsSent = 0;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const tokensSet = new Set<string>();
      if (typeof userData.pushToken === 'string' && userData.pushToken) {
        tokensSet.add(userData.pushToken);
      }
      if (Array.isArray(userData.pushTokens)) {
        for (const token of userData.pushTokens) {
          if (typeof token === 'string' && token) {
            tokensSet.add(token);
          }
        }
      }

      const tokens = Array.from(tokensSet);
      if (tokens.length === 0) continue;

      const frequencies = {
        ...DEFAULT_MAINTENANCE_FREQUENCIES,
        ...(userData.preferences?.maintenanceFrequencies || {}),
      };

      console.log("User:", doc.id, "frequencies:", frequencies, "tokenCount:", tokens.length);
      // Get maintenance dates
      const maintenanceDoc = await adminDb.collection('users').doc(doc.id).collection('maintenance').doc('log').get();
      const maintenanceDates = maintenanceDoc.data() || {};
      console.log("Dates for", doc.id, ":", maintenanceDates);

      let needsBackflush = false;
      let needsDeepClean = false;
      let needsFilterChange = false;

      const now = new Date();

      const checkOverdue = (key: string, frequency: number) => {
        const lastDateStr = maintenanceDates[key];
        if (!lastDateStr) return false; // User requested not to alert if no date is set
        
        // Parse YYYY-MM-DD as UTC midnight to avoid timezone off-by-one errors.
        const [year, month, day] = (lastDateStr as string).split('-').map(Number);
        const lastDateUTC = Date.UTC(year, month - 1, day);
        const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const daysSince = (nowUTC - lastDateUTC) / (1000 * 3600 * 24);
        return daysSince >= frequency;
      };

      // Check Backflush
      if (frequencies.lastBackflush) {
        if (checkOverdue('lastBackflush', Number(frequencies.lastBackflush))) needsBackflush = true;
      }
      
      // Check Deep clean
      if (frequencies.lastDescaling) {
        if (checkOverdue('lastDescaling', Number(frequencies.lastDescaling))) needsDeepClean = true;
      }
      
      // Check Water filter
      if (frequencies.waterFilterLastChanged) {
        if (checkOverdue('waterFilterLastChanged', Number(frequencies.waterFilterLastChanged))) needsFilterChange = true;
      }

      if (needsBackflush || needsDeepClean || needsFilterChange) {
        // Construct the payload
        let bodyText = "נדרש לבצע פעולת תחזוקה למכונה: ";
        const tasks = [];
        if (needsBackflush) tasks.push("ניקוי (Backflush)");
        if (needsDeepClean) tasks.push("ניקוי אבנית");
        if (needsFilterChange) tasks.push("החלפת פילטר");
        bodyText += tasks.join(", ") + ".";

        const titleText = 'תזכורת תחזוקה | Barista Mate';
        const invalidTokens: string[] = [];

        for (const token of tokens) {
          const message: admin.messaging.Message = {
            token,
            notification: {
              title: titleText,
              body: bodyText,
            },
            data: {
              title: titleText,
              body: bodyText,
              url: '/',
            },
            webpush: {
              headers: {
                Urgency: 'high',
              },
              notification: {
                title: titleText,
                body: bodyText,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                dir: 'rtl',
                lang: 'he',
              },
              fcmOptions: {
                link: '/',
              },
            },
          };

          try {
            await adminMessaging.send(message);
            notificationsSent++;
          } catch (msgErr: any) {
            console.error(`Failed to send to user ${doc.id} token:`, msgErr);
            const errorCode = msgErr?.code || msgErr?.errorInfo?.code;
            if (
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(token);
            }
          }
        }

        if (invalidTokens.length > 0) {
          const updates: Record<string, any> = {
            pushTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
          };
          if (userData.pushToken && invalidTokens.includes(userData.pushToken)) {
            const remaining = tokens.filter((t) => !invalidTokens.includes(t));
            updates.pushToken = remaining.length > 0 ? remaining[0] : admin.firestore.FieldValue.delete();
          }
          await doc.ref.update(updates).catch((err) => {
            console.error(`Failed to clean up invalid tokens for user ${doc.id}:`, err);
          });
        }
      }
    }

    return NextResponse.json({ success: true, count: notificationsSent });
  } catch (error) {
    console.error("Cron Error: ", error);
    return NextResponse.json({ error: 'Failed to process maintenance cron' }, { status: 500 });
  }
}
