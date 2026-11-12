import { describe, test, expect, vi, beforeEach } from 'vitest';

const { mockGetUsers, mockGetMaintenance, mockUpdateUser, mockSend, mockVerifyIdToken } = vi.hoisted(() => ({
  mockGetUsers: vi.fn(),
  mockGetMaintenance: vi.fn(),
  mockUpdateUser: vi.fn().mockResolvedValue(undefined),
  mockSend: vi.fn().mockResolvedValue('message-id'),
  mockVerifyIdToken: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      get: mockGetUsers,
      doc: vi.fn(() => ({
        get: mockGetUsers,
        update: mockUpdateUser,
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: mockGetMaintenance,
          })),
        })),
      })),
    })),
  },
  adminMessaging: {
    send: mockSend,
  },
  adminAuth: {
    verifyIdToken: mockVerifyIdToken,
  },
}));

vi.mock('@/lib/catalog-sync', () => ({
  syncCatalogAndPendingVerification: vi.fn().mockResolvedValue({
    success: true,
    promotedRoasters: [],
    promotedBeans: [],
    normalizedGlobalDocs: 0,
    skippedTestDocs: 0,
    deletedPendingDocs: 0,
  }),
}));

import { GET } from '@/app/api/cron/maintenance/route';
import { POST as testPushPOST } from '@/app/api/test-push/route';

describe('Maintenance Cron Route (/api/cron/maintenance)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-cron-secret';
  });

  test('sends overdue alert using default frequencies even when preferences.maintenanceFrequencies is missing', async () => {
    mockGetUsers.mockResolvedValue({
      docs: [
        {
          id: 'user-1',
          data: () => ({
            pushToken: 'desktop-token',
            pushTokens: ['desktop-token', 'android-token'],
            // preferences.maintenanceFrequencies intentionally omitted!
          }),
          ref: { update: mockUpdateUser },
        },
      ],
    });

    mockGetMaintenance.mockResolvedValue({
      data: () => ({
        lastBackflush: '2020-01-01', // Overdue (> 60 days default)
      }),
    });

    const req = new Request('https://barista-mate.vercel.app/api/cron/maintenance', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true, count: 2 });
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'android-token',
        webpush: expect.objectContaining({
          headers: { Urgency: 'high' },
        }),
      })
    );
  });

  test('cleans up unregistered tokens from Firestore when FCM returns registration-token-not-registered', async () => {
    mockGetUsers.mockResolvedValue({
      docs: [
        {
          id: 'user-2',
          data: () => ({
            pushToken: 'stale-token',
            pushTokens: ['stale-token', 'valid-android-token'],
          }),
          ref: { update: mockUpdateUser },
        },
      ],
    });

    mockGetMaintenance.mockResolvedValue({
      data: () => ({
        waterFilterLastChanged: '2020-01-01',
      }),
    });

    mockSend.mockImplementation(async (msg: any) => {
      if (msg.token === 'stale-token') {
        const err: any = new Error('Token not registered');
        err.code = 'messaging/registration-token-not-registered';
        throw err;
      }
      return 'msg-ok';
    });

    const req = new Request('https://barista-mate.vercel.app/api/cron/maintenance', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true, count: 1 });
    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        pushToken: 'valid-android-token',
      })
    );
  });

  test('rejects ?localhost=1 query string spoofing without valid CRON_SECRET', async () => {
    const req = new Request('https://barista-mate.vercel.app/api/cron/maintenance?localhost=1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  test('requires valid Firebase ID token on /api/test-push', async () => {
    const unauthReq = new Request('https://barista-mate.vercel.app/api/test-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-1', token: 'tok-1' }),
    });
    const unauthRes = await testPushPOST(unauthReq);
    expect(unauthRes.status).toBe(401);

    mockVerifyIdToken.mockResolvedValue({ uid: 'user-1' });
    mockGetUsers.mockResolvedValue({
      data: () => ({ pushToken: 'tok-1' }),
    });

    const authReq = new Request('https://barista-mate.vercel.app/api/test-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-id-token',
      },
      body: JSON.stringify({ userId: 'user-1', token: 'tok-1' }),
    });
    const authRes = await testPushPOST(authReq);
    expect(authRes.status).toBe(200);
  });
});
