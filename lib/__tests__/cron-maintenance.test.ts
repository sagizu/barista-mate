import { describe, test, expect, vi, beforeEach } from 'vitest';

const { mockGetUsers, mockGetMaintenance, mockUpdateUser, mockSend } = vi.hoisted(() => ({
  mockGetUsers: vi.fn(),
  mockGetMaintenance: vi.fn(),
  mockUpdateUser: vi.fn().mockResolvedValue(undefined),
  mockSend: vi.fn().mockResolvedValue('message-id'),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      get: mockGetUsers,
      doc: vi.fn(() => ({
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
}));

import { GET } from '@/app/api/cron/maintenance/route';

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
});
