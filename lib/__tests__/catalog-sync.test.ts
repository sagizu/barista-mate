import { describe, test, expect, vi, beforeEach } from 'vitest';

const {
  mockGetGlobalRoasters,
  mockAddGlobalRoaster,
  mockGetGlobalBeans,
  mockAddGlobalBean,
  mockGetPending,
} = vi.hoisted(() => ({
  mockGetGlobalRoasters: vi.fn(),
  mockAddGlobalRoaster: vi.fn().mockResolvedValue({ id: 'new-roaster-id' }),
  mockGetGlobalBeans: vi.fn(),
  mockAddGlobalBean: vi.fn().mockResolvedValue({ id: 'new-bean-id' }),
  mockGetPending: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn((name: string) => {
      if (name === 'global_roasters') {
        return {
          get: mockGetGlobalRoasters,
          add: mockAddGlobalRoaster,
        };
      }
      if (name === 'global_beans') {
        return {
          get: mockGetGlobalBeans,
          add: mockAddGlobalBean,
        };
      }
      if (name === 'pending_verification') {
        return {
          get: mockGetPending,
        };
      }
      return {};
    }),
  },
}));

import { syncCatalogAndPendingVerification } from '@/lib/catalog-sync';

describe('Catalog Sync & Pending Verification Automation (lib/catalog-sync)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('promotes pending non-test roasters and beans, normalizes existing global beans, and deletes processed pending docs', async () => {
    const mockUpdateExistingBean = vi.fn().mockResolvedValue(undefined);
    const mockDeletePending1 = vi.fn().mockResolvedValue(undefined);
    const mockDeletePending2 = vi.fn().mockResolvedValue(undefined);
    const mockDeletePendingTest = vi.fn().mockResolvedValue(undefined);

    mockGetGlobalRoasters.mockResolvedValue({
      docs: [
        {
          id: 'r1',
          data: () => ({ name: 'Uru' }),
          ref: { update: vi.fn() },
        },
      ],
    });

    mockGetGlobalBeans.mockResolvedValue({
      docs: [
        {
          id: 'b1',
          data: () => ({
            roasterName: 'Uru',
            beanName: 'Swara – קניה\n',
            roastLevel: '2',
          }),
          ref: { update: mockUpdateExistingBean },
        },
      ],
    });

    mockGetPending.mockResolvedValue({
      docs: [
        {
          id: 'p1',
          data: () => ({
            type: 'roaster',
            name: 'קפה עולה',
            isTestData: false,
          }),
          ref: { delete: mockDeletePending1 },
        },
        {
          id: 'p2',
          data: () => ({
            type: 'bean',
            roasterName: 'קפה עולה',
            beanName: 'אתיופיה ירגשף',
            roastLevel: '3',
            flavorTags: ['פירותי', 'פרחוני'],
            isTestData: false,
          }),
          ref: { delete: mockDeletePending2 },
        },
        {
          id: 'p3',
          data: () => ({
            type: 'bean',
            roasterName: 'טסט קלייה',
            beanName: 'טסט פול',
            isTestData: true,
          }),
          ref: { delete: mockDeletePendingTest },
        },
      ],
    });

    const result = await syncCatalogAndPendingVerification();

    expect(result).toEqual({
      success: true,
      promotedRoasters: ['קפה עולה'],
      promotedBeans: [{ roasterName: 'קפה עולה', beanName: 'אתיופיה ירגשף' }],
      normalizedGlobalDocs: 1,
      skippedTestDocs: 1,
      deletedPendingDocs: 3,
    });

    // Normalized trailing newline and string roastLevel in existing global_beans doc
    expect(mockUpdateExistingBean).toHaveBeenCalledWith({
      beanName: 'Swara – קניה',
      roastLevel: 2,
    });

    // Added new roaster once (deduplicated between p1 and p2)
    expect(mockAddGlobalRoaster).toHaveBeenCalledTimes(1);
    expect(mockAddGlobalRoaster).toHaveBeenCalledWith({ name: 'קפה עולה' });

    // Added new bean with numeric roastLevel
    expect(mockAddGlobalBean).toHaveBeenCalledTimes(1);
    expect(mockAddGlobalBean).toHaveBeenCalledWith({
      roasterName: 'קפה עולה',
      beanName: 'אתיופיה ירגשף',
      roastLevel: 3,
      flavorTags: ['פירותי', 'פרחוני'],
    });

    // Deleted all 3 pending_verification docs (including test doc)
    expect(mockDeletePending1).toHaveBeenCalledTimes(1);
    expect(mockDeletePending2).toHaveBeenCalledTimes(1);
    expect(mockDeletePendingTest).toHaveBeenCalledTimes(1);
  });
});
