import { results } from './results';
import { games } from './schedule-data';
import { standings } from './data';

export function teamRecord(teamId: string) {
  const official = standings?.rows.find((row) => row.teamId === teamId);
  const finals = [...results.values()].filter(
    (r) =>
      r.status === 'final' &&
      [r.homeTeamId, r.awayTeamId].includes(teamId) &&
      games.find((g) => g.id === r.gameId)?.kind === 'league',
  );
  const pending = finals.length > (official?.gp ?? 0);
  let w = 0,
    l = 0,
    t = 0;
  for (const r of finals) {
    const ours = r.homeTeamId === teamId ? r.homeScore : r.awayScore;
    const theirs = r.homeTeamId === teamId ? r.awayScore : r.homeScore;
    if (ours > theirs) w++;
    else if (ours < theirs) l++;
    else t++;
  }
  return {
    pending,
    text: pending
      ? `${w}–${l}–${t}`
      : official
        ? `${official.w + official.otw}–${official.l + official.otl}–${official.t}`
        : '—',
    gp: pending ? finals.length : (official?.gp ?? 0),
    note: pending
      ? 'Confirmed results · official standings update pending'
      : 'Wins–losses–ties · includes OT',
  };
}
