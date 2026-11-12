import { adminDb } from '@/lib/firebase-admin';
import roasteries from '@/roasteries.json';

export interface DirectCatalogSubmission {
  type: 'roaster' | 'bean';
  data: {
    name?: string;
    roasterName?: string;
    beanName?: string;
    roastLevel?: number | string | null;
    flavorTags?: string[];
    isTestData?: boolean;
  };
}

export interface CatalogSyncResult {
  success: boolean;
  promotedRoasters: string[];
  promotedBeans: { roasterName: string; beanName: string }[];
  normalizedGlobalDocs: number;
  skippedTestDocs: number;
  deletedPendingDocs: number;
}

export async function syncCatalogAndPendingVerification(
  directSubmission?: DirectCatalogSubmission
): Promise<CatalogSyncResult> {
  const promotedRoasters: string[] = [];
  const promotedBeans: { roasterName: string; beanName: string }[] = [];
  let normalizedGlobalDocs = 0;
  let skippedTestDocs = 0;
  let deletedPendingDocs = 0;

  // 1. Build case-insensitive lookup of static + global roasters
  const knownRoasters = new Map<string, string>();
  for (const r of roasteries) {
    const trimmed = r.trim();
    if (trimmed) {
      knownRoasters.set(trimmed.toLowerCase(), trimmed);
    }
  }

  const globalRoastersSnap = await adminDb.collection('global_roasters').get();
  for (const doc of globalRoastersSnap.docs) {
    const data = doc.data() || {};
    const rawName = typeof data.name === 'string' ? data.name : '';
    const trimmed = rawName.trim();
    if (!trimmed) continue;

    if (rawName !== trimmed) {
      await doc.ref.update({ name: trimmed });
      normalizedGlobalDocs++;
    }
    knownRoasters.set(trimmed.toLowerCase(), trimmed);
  }

  // 2. Build case-insensitive lookup of global beans & normalize existing data
  const knownBeans = new Set<string>();
  const globalBeansSnap = await adminDb.collection('global_beans').get();
  for (const doc of globalBeansSnap.docs) {
    const data = doc.data() || {};
    const rawRoaster = typeof data.roasterName === 'string' ? data.roasterName : '';
    const rawBean = typeof data.beanName === 'string' ? data.beanName : '';
    const roasterName = rawRoaster.trim();
    const beanName = rawBean.trim();
    if (!roasterName || !beanName) continue;

    const updates: Record<string, any> = {};
    if (rawRoaster !== roasterName) updates.roasterName = roasterName;
    if (rawBean !== beanName) updates.beanName = beanName;

    if (data.roastLevel !== undefined && data.roastLevel !== null && typeof data.roastLevel !== 'number') {
      const numericRoast = Number(data.roastLevel);
      if (!Number.isNaN(numericRoast) && numericRoast >= 1 && numericRoast <= 5) {
        updates.roastLevel = numericRoast;
      }
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      normalizedGlobalDocs++;
    }

    knownBeans.add(`${roasterName.toLowerCase()}::${beanName.toLowerCase()}`);
  }

  const promoteRoaster = async (rawName?: string, isTestData?: boolean): Promise<string | null> => {
    if (isTestData) {
      skippedTestDocs++;
      return null;
    }
    const trimmed = (rawName || '').trim();
    if (!trimmed) return null;

    const key = trimmed.toLowerCase();
    const existing = knownRoasters.get(key);
    if (existing) {
      return existing;
    }

    await adminDb.collection('global_roasters').add({ name: trimmed });
    knownRoasters.set(key, trimmed);
    promotedRoasters.push(trimmed);
    return trimmed;
  };

  const promoteBean = async (item: {
    roasterName?: string;
    beanName?: string;
    roastLevel?: number | string | null;
    flavorTags?: string[];
    isTestData?: boolean;
  }): Promise<boolean> => {
    if (item.isTestData) {
      skippedTestDocs++;
      return false;
    }
    const rawRoaster = (item.roasterName || '').trim();
    const beanName = (item.beanName || '').trim();
    if (!rawRoaster || !beanName) return false;

    // Ensure the roaster is also in global_roasters (or roasteries.json)
    const canonicalRoaster = (await promoteRoaster(rawRoaster, false)) || rawRoaster;
    const beanKey = `${canonicalRoaster.toLowerCase()}::${beanName.toLowerCase()}`;

    if (knownBeans.has(beanKey)) {
      return false;
    }

    const newBeanPayload: Record<string, any> = {
      roasterName: canonicalRoaster,
      beanName,
    };

    if (item.roastLevel !== undefined && item.roastLevel !== null && item.roastLevel !== '') {
      const numericRoast = Number(item.roastLevel);
      if (!Number.isNaN(numericRoast) && numericRoast >= 1 && numericRoast <= 5) {
        newBeanPayload.roastLevel = numericRoast;
      }
    }

    if (Array.isArray(item.flavorTags) && item.flavorTags.length > 0) {
      const cleanTags = item.flavorTags.map((t) => String(t).trim()).filter(Boolean);
      if (cleanTags.length > 0) {
        newBeanPayload.flavorTags = cleanTags;
      }
    }

    await adminDb.collection('global_beans').add(newBeanPayload);
    knownBeans.add(beanKey);
    promotedBeans.push({ roasterName: canonicalRoaster, beanName });
    return true;
  };

  // 3. Process direct submission if provided
  if (directSubmission) {
    if (directSubmission.type === 'roaster') {
      await promoteRoaster(directSubmission.data?.name, directSubmission.data?.isTestData);
    } else if (directSubmission.type === 'bean') {
      await promoteBean(directSubmission.data || {});
    }
  }

  // 4. Drain all documents in pending_verification
  const pendingSnap = await adminDb.collection('pending_verification').get();
  for (const doc of pendingSnap.docs) {
    const data = doc.data() || {};
    const isTest = Boolean(data.isTestData);

    if (isTest) {
      skippedTestDocs++;
      await doc.ref.delete();
      deletedPendingDocs++;
      continue;
    }

    if (data.type === 'roaster' || (!data.type && data.name && !data.beanName)) {
      await promoteRoaster(data.name, false);
      await doc.ref.delete();
      deletedPendingDocs++;
    } else if (data.type === 'bean' || (!data.type && data.beanName && data.roasterName)) {
      await promoteBean({
        roasterName: data.roasterName,
        beanName: data.beanName,
        roastLevel: data.roastLevel,
        flavorTags: data.flavorTags,
        isTestData: false,
      });
      await doc.ref.delete();
      deletedPendingDocs++;
    }
  }

  return {
    success: true,
    promotedRoasters,
    promotedBeans,
    normalizedGlobalDocs,
    skippedTestDocs,
    deletedPendingDocs,
  };
}
