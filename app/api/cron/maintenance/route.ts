import { NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  // Only allow Vercel Cron OR localhost testing to trigger this
  const authHeader = request.headers.get('authorization');
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isLocalHost = request.url.includes("localhost");

  if (!isVercelCron && !isLocalHost) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usersSnapshot = await adminDb.collection('users').get();
    
    let notificationsSent = 0;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const pushToken = userData.pushToken;
      const frequencies = userData.preferences?.maintenanceFrequencies;
      if (!pushToken || !frequencies) continue;

      console.log("User:", doc.id, "frequencies:", frequencies, "hasPushToken:", !!pushToken);
      // Get maintenance dates
      const maintenanceDoc = await adminDb.collection('users').doc(doc.id).collection('maintenance').doc('log').get();
      const maintenanceDates = maintenanceDoc.data() || {};

      let needsBackflush = false;
      let needsDeepClean = false;
      let needsFilterChange = false;

      const now = new Date();

      const checkOverdue = (key: string, frequency: number) => {
        const lastDateStr = maintenanceDates[key];
        if (!lastDateStr) return false; // User requested not to alert if no date is set
        
        // Frontend saves as YYYY-MM-DD string
        const lastDate = new Date(lastDateStr);
        const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        return daysSince >= frequency;
      };

      // Check Backflush
      if (frequencies.lastBackflush) {
        if (checkOverdue('lastBackflush', frequencies.lastBackflush)) needsBackflush = true;
      }
      
      // Check Deep clean
      if (frequencies.lastDescaling) {
        if (checkOverdue('lastDescaling', frequencies.lastDescaling)) needsDeepClean = true;
      }
      
      // Check Water filter
      if (frequencies.waterFilterLastChanged) {
        if (checkOverdue('waterFilterLastChanged', frequencies.waterFilterLastChanged)) needsFilterChange = true;
      }

      if (needsBackflush || needsDeepClean || needsFilterChange) {
        // Construct the payload
        let bodyText = "נדרש לבצע פעולת תחזוקה למכונה: ";
        const tasks = [];
        if (needsBackflush) tasks.push("ניקוי (Backflush)");
        if (needsDeepClean) tasks.push("ניקוי אבנית");
        if (needsFilterChange) tasks.push("החלפת פילטר");
        bodyText += tasks.join(", ") + ".";

        const message = {
          notification: {
            title: 'תזכורת תחזוקה | Barista Mate',
            body: bodyText,
          },
          token: pushToken
        };

        try {
          await adminMessaging.send(message);
          notificationsSent++;
        } catch (msgErr) {
          console.error(`Failed to send to user ${doc.id}:`, msgErr);
          // Token might be invalid, we could mark it as invalid here
        }
      }
    }

    return NextResponse.json({ success: true, count: notificationsSent });
  } catch (error) {
    console.error("Cron Error: ", error);
    return NextResponse.json({ error: 'Failed to process maintenance cron' }, { status: 500 });
  }
}
