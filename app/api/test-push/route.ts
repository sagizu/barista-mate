import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, token } = await request.json();
    if (!userId && !token) {
      return NextResponse.json({ error: 'No userId or token provided' }, { status: 400 });
    }

    const tokensSet = new Set<string>();
    if (typeof token === 'string' && token) {
      tokensSet.add(token);
    }

    let userData: Record<string, any> = {};
    if (userId) {
      try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        userData = userDoc.data() || {};
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
      } catch (dbErr) {
        console.error('Failed to read user tokens from Firestore in test-push:', dbErr);
      }
    }

    const tokens = Array.from(tokensSet);
    if (tokens.length === 0) {
      return NextResponse.json({ error: 'User has no registered push token' }, { status: 404 });
    }

    const title = "התראת בדיקה ☕ | Barista Mate";
    const body = "התראות התחזוקה שלך ב-Barista Mate פועלות בהצלחה!";

    let sentCount = 0;
    const invalidTokens: string[] = [];
    let lastError: string | undefined;

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
      } catch (err: any) {
        console.error("Failed to send test push to token:", err);
        lastError = err?.code || err?.message || 'FCM send error';
        const errorCode = err?.code || err?.errorInfo?.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(targetToken);
        }
      }
    }

    if (userId && invalidTokens.length > 0) {
      try {
        const updatePayload: Record<string, any> = {
          pushTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
        };
        if (userData.pushToken && invalidTokens.includes(userData.pushToken)) {
          updatePayload.pushToken = admin.firestore.FieldValue.delete();
        }
        await adminDb.collection('users').doc(userId).update(updatePayload);
      } catch (cleanupErr) {
        console.error('Failed to clean up invalid tokens in test-push:', cleanupErr);
      }
    }

    if (sentCount === 0) {
      return NextResponse.json(
        { error: 'Failed to deliver test notification to registered devices', details: lastError },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: sentCount });
  } catch (error: any) {
    console.error("Test Push Error: ", error);
    return NextResponse.json(
      { error: 'Failed to send test push', details: error?.message },
      { status: 500 }
    );
  }
}
