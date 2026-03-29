import { NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'No userId provided' }, { status: 400 });

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const pushToken = userDoc.data()?.pushToken;

    if (!pushToken) {
      return NextResponse.json({ error: 'User has no registered push token' }, { status: 404 });
    }

    await adminMessaging.send({
      token: pushToken,
      notification: {
        title: "Test Notification ☕",
        body: "Your Barista Mate Push Notifications are working perfectly!"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test Push Error: ", error);
    return NextResponse.json({ error: 'Failed to send test push' }, { status: 500 });
  }
}
