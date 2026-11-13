import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import roasteriesStatic from '@/roasteries.json';
import { ExploreClient, type PublicGlobalBean } from './explore-client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'מאגר בתי קלייה ופולי קפה בישראל | Barista Mate',
  description: 'גלה בתי קלייה מקומיים ופולי קפה מומלצים לאספרסו ביתי, עם דרגות קלייה ופרופילי טעם.',
};

async function getPublicCatalog(): Promise<{ roasters: string[]; beans: PublicGlobalBean[] }> {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      return { roasters: roasteriesStatic, beans: [] };
    }

    const [roastersSnap, beansSnap] = await Promise.all([
      adminDb.collection('global_roasters').get(),
      adminDb.collection('global_beans').get(),
    ]);

    const roasterSet = new Set<string>(roasteriesStatic);
    roastersSnap.docs.forEach((d) => {
      const name = String(d.data().name || '').trim();
      if (name) roasterSet.add(name);
    });

    const beans: PublicGlobalBean[] = beansSnap.docs
      .map((d) => {
        const data = d.data();
        const rawRoast = data.roastLevel;
        const parsedRoast = rawRoast !== undefined && rawRoast !== null ? Number(rawRoast) : undefined;
        return {
          id: d.id,
          roasterName: String(data.roasterName || '').trim(),
          beanName: String(data.beanName || '').trim(),
          roastLevel: parsedRoast && !Number.isNaN(parsedRoast) ? parsedRoast : undefined,
          flavorTags: Array.isArray(data.flavorTags) ? data.flavorTags : [],
        };
      })
      .filter((b) => Boolean(b.roasterName && b.beanName))
      .sort((a, b) => a.roasterName.localeCompare(b.roasterName, 'he'));

    beans.forEach((b) => roasterSet.add(b.roasterName));

    return {
      roasters: Array.from(roasterSet).sort((a, b) => a.localeCompare(b, 'he')),
      beans,
    };
  } catch {
    return { roasters: roasteriesStatic, beans: [] };
  }
}

export default async function ExplorePage() {
  const { roasters, beans } = await getPublicCatalog();
  return <ExploreClient roasters={roasters} beans={beans} />;
}
