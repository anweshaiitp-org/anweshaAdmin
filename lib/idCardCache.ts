// Simple in-memory cache for user ID Card status on the Next.js API server
const cache = new Map<string, { status: string; expires: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedIdStatus(identifier: string): string | undefined {
  if (!identifier) return undefined;
  const entry = cache.get(identifier.trim().toUpperCase());
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(identifier.trim().toUpperCase());
    return undefined;
  }
  return entry.status;
}

export function setCachedIdStatus(identifier: string, status: string | null | undefined): void {
  if (!identifier || !status) return;
  const key = identifier.trim().toUpperCase();
  cache.set(key, { status, expires: Date.now() + TTL });
}
