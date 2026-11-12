import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, token } = await request.json();
    if (!userId) return NextResponse.json({ error: 'No userId provided' }, { status: 400 });

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};

    const tokensSet = new Set<string>();
    if (typeof token === 'string' && token) {
      tokensSet.add(token);
    }
    if (typeof userData.pushToken === 'string' && userData.pushToken) {
      tokensSet.add(userData.pushToken);
    }
    if (Array.isArray(userData.pushTokens)) {
      for (const t of userData.pushTokens) {
        if (typeof t === 'string' && t) {
          tokensSet.add(t);
        }
      }
    }

    const tokens = Array.from(tokensSet);
    if (tokens.length === 0) {
      return NextResponse.json({ error: 'User has no registered push token' }, { status: 404 });
    }

    const title = "התראת בדיקה ☕ | Barista Mate";
    const body = "התראות התחזוקה שלך ב-Barista Mate פועלות בהצלחה!";

    let sentCount = 0;
    for (const targetToken of tokens) {
      try {
        await adminMessaging.send({
          token: targetToken,
          notification: {
            title,
            body,
          },
          data: {
            title,
            body,
            url: '/',
          },
          webpush: {
            headers: {
              Urgency: 'high',
            },
            notification: {
              title,
              body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              dir: 'rtl',
              lang: 'he',
            },
            fcmOptions: {
              link: '/',
            },
          },
        });
        sentCount++;
      } catch (err) {
        console.error("Failed to send test push to token:", err);
      }
    }

    if (sentCount === 0) {
      return NextResponse.json({ error: 'Failed to deliver test notification to registered devices' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: sentCount });
  } catch (error) {
    console.error("Test Push Error: ", error);
    return NextResponse.json({ error: 'Failed to send test push' }, { status: 500 });
  }
}
