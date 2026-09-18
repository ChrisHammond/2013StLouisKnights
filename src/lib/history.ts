import type { RatingsSnapshot, Snapshot, Store } from './schema';

export function effectiveTime(snapshot: Snapshot): string {
  return snapshot.source === 'myhockeyrankings' ? snapshot.releaseDate : snapshot.sourcePublishedAt ?? snapshot.observedAt;
}
// Compare source content, not fetch timestamps. Corrections remain separate observations.
export function contentKey(snapshot: Snapshot): string {
  const { collectedAt: _collected, observedAt: _observed, ...content } = snapshot;
  return JSON.stringify(content);
}
export function appendSnapshot<T extends Snapshot>(store: Store<T>, snapshot: T): { store: Store<T>; changed: boolean } {
  // Only compare the latest revision for a source date: a reverted correction is meaningful.
  const prior = [...store.snapshots].reverse().find(s => snapshot.source === 'myhockeyrankings'
    ? s.source === 'myhockeyrankings' && s.releaseDate === snapshot.releaseDate
    : effectiveTime(s).slice(0,10) === effectiveTime(snapshot).slice(0,10));
  if (prior && contentKey(prior) === contentKey(snapshot)) return { store, changed: false };
  return { store: { snapshots: [...store.snapshots, snapshot] }, changed: true };
}
export function currentSnapshot<T extends Snapshot>(snapshots: T[]): T | undefined {
  return snapshots.reduce<T | undefined>((latest, item) => !latest || effectiveTime(item) >= effectiveTime(latest) ? item : latest, undefined);
}
export function ratingReleases(snapshots: RatingsSnapshot[]): RatingsSnapshot[] {
  const byDate = new Map<string, RatingsSnapshot>();
  for (const snapshot of snapshots) byDate.set(snapshot.releaseDate, snapshot);
  return [...byDate.values()].sort((a,b) => a.releaseDate.localeCompare(b.releaseDate));
}
export function weeklyChange(releases: RatingsSnapshot[], teamId: string, index = releases.length - 1): number | null {
  if (index < 1) return null;
  const current = releases[index];
  const previous = releases[index - 1];
  // Do not call a multi-week change a weekly change, or compare different ranking categories.
  if (Date.parse(current.releaseDate) - Date.parse(previous.releaseDate) !== 7 * 86400000 || current.category !== previous.category) return null;
  const value = current.rows.find(row => row.teamId === teamId)?.rating;
  const before = previous.rows.find(row => row.teamId === teamId)?.rating;
  return value == null || before == null ? null : Math.round((value - before) * 100) / 100;
}
export function freshness(lastSuccess: string | null, maxHours: number, now = new Date()): 'missing' | 'fresh' | 'stale' {
  if (!lastSuccess) return 'missing';
  return now.getTime() - Date.parse(lastSuccess) > maxHours * 3600000 ? 'stale' : 'fresh';
}
export function formatDate(value: string | null): string {
  if (!value) return 'Not yet available';
  // Date-only release dates must not shift to the prior date in Central time.
  return new Intl.DateTimeFormat('en-US', { month:'short',day:'numeric',year:'numeric',timeZone:value.length === 10 ? 'UTC' : 'America/Chicago' }).format(new Date(value));
}
export function formatTimestamp(value: string | null): string {
  if (!value) return 'Not yet available';
  return new Intl.DateTimeFormat('en-US', { month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Chicago',timeZoneName:'short' }).format(new Date(value));
}
