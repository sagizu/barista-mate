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

      // Ensure we have logs to check against
      const logsSnapshot = await adminDb.collection('users').doc(doc.id).collection('maintenanceLogs').orderBy('date', 'desc').limit(20).get();
      const logs = logsSnapshot.docs.map(l => l.data());

      let needsBackflush = false;
      let needsDeepClean = false;
      let needsFilterChange = false;

      const now = new Date();

      // Check Backflush
      if (frequencies.backflush) {
        const lastBackflush = logs.find(l => l.task === 'backflush')?.date?.toDate() || new Date(0);
        const daysSince = (now.getTime() - lastBackflush.getTime()) / (1000 * 3600 * 24);
        if (daysSince >= frequencies.backflush) needsBackflush = true;
      }
      
      // Check Deep clean
      if (frequencies.deepClean) {
        const lastDeepClean = logs.find(l => l.task === 'deepClean')?.date?.toDate() || new Date(0);
        const daysSinceContext = (now.getTime() - lastDeepClean.getTime()) / (1000 * 3600 * 24);
        if (daysSinceContext >= frequencies.deepClean) needsDeepClean = true;
      }
      
      // Check Water filter
      if (frequencies.waterFilter) {
        const lastFilter = logs.find(l => l.task === 'waterFilter')?.date?.toDate() || new Date(0);
        const daysSinceContextFilter = (now.getTime() - lastFilter.getTime()) / (1000 * 3600 * 24);
        if (daysSinceContextFilter >= frequencies.waterFilter) needsFilterChange = true;
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
