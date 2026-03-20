import type { SavedBean } from "@/lib/types";

class CommunityCache {
  private beans: (SavedBean & { userId: string })[] = [];
  private lastFetched: number = 0;
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  isValid(): boolean {
    return this.beans.length > 0 && (Date.now() - this.lastFetched) < this.CACHE_DURATION;
  }

  getBeans() {
    return [...this.beans];
  }

  setBeans(beans: (SavedBean & { userId: string })[]) {
    this.beans = [...beans];
    this.lastFetched = Date.now();
  }

  invalidate() {
    this.beans = [];
    this.lastFetched = 0;
  }
}

export const communityCache = new CommunityCache();
