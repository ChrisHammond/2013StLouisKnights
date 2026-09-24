import { statLabels, type PlayerGame } from '../../src/lib/player-stats';

type Cell = string | number | null;
export function parseHudlRows(rows: Cell[][], source: PlayerGame['source']): PlayerGame[] {
  const headers = rows[0];
  const required = ['Date', 'Opponent', 'Score', ...statLabels];
  if (!headers || required.some((h) => headers.filter((v) => v === h).length !== 1))
    throw new Error(
      'Missing or duplicate Hudl Box score columns. Export Games → Game total with the default box score columns.',
    );
  const index = (label: string) => headers.indexOf(label);
  const games: PlayerGame[] = [];
  for (const row of rows.slice(1)) {
    if (row.every((v) => v === null || v === '')) continue;
    if (row[index('Opponent')] === 'Average per game' && !row[index('Date')]) continue;
    const rawDate = String(row[index('Date')] ?? '');
    const match = /^(\d{2})\/(\d{2})$/.exec(rawDate);
    if (!match) throw new Error(`Invalid game date: ${rawDate}`);
    const day = Number(match[1]),
      month = Number(match[2]);
    // This pilot is explicitly scoped to the 2026–27 season (July–June).
    const year = month >= 7 ? 2026 : 2027;
    const date = `${year}-${match[2]}-${match[1]}`;
    const parsed = new Date(`${date}T00:00:00Z`);
    if (
      Number.isNaN(parsed.valueOf()) ||
      parsed.getUTCDate() !== day ||
      parsed.getUTCMonth() + 1 !== month ||
      date > source.asOf
    )
      throw new Error(`Invalid or future date: ${date}`);
    const rawOpponent = String(row[index('Opponent')] ?? '').trim();
    const venue = rawOpponent.startsWith('@') ? 'away' : 'home';
    const opponent = rawOpponent.replace(/^@\s*/, '').trim();
    if (!opponent || /^[=+]/.test(opponent)) throw new Error('Invalid opponent');
    const score = /^(\d+):(\d+)$/.exec(String(row[index('Score')] ?? ''));
    if (!score) throw new Error('Invalid score');
    const stats: PlayerGame['stats'] = {};
    for (const label of statLabels) {
      const value = row[index(label)];
      if (value === '-' || value === '—' || value === null || value === '') {
        stats[label] = null;
        continue;
      }
      if (label === 'Time on ice' || label === 'Penalty time') {
        if (typeof value !== 'string' || !/^\d+:[0-5]\d$/.test(value)) throw new Error(`Invalid ${label}`);
      } else if (label.endsWith('%')) {
        if (typeof value !== 'string' || !/^\d+(\.\d+)?%$/.test(value) || Number(value.slice(0, -1)) > 100)
          throw new Error(`Invalid ${label}`);
      } else if (typeof value !== 'number' || !Number.isInteger(value) || (label !== '+/-' && value < 0))
        throw new Error(`Invalid ${label}: expected a per-game count`);
      stats[label] = value;
    }
    if (
      stats.Points !== null &&
      stats.Goals !== null &&
      stats.Assists !== null &&
      stats.Points !== Number(stats.Goals) + Number(stats.Assists)
    )
      throw new Error('Points do not match goals + assists');
    const key = `${date}|${venue}|${opponent.toLowerCase()}`;
    if (games.some((g) => g.key === key))
      throw new Error('Ambiguous same-day opponent: review both games before importing');
    games.push({
      key,
      date,
      opponent,
      venue,
      goalsFor: Number(score[1]),
      goalsAgainst: Number(score[2]),
      stats,
      source,
    });
  }
  if (!games.length) throw new Error('No game rows found');
  return games;
}

export function mergeGames(existing: PlayerGame[], incoming: PlayerGame[]): PlayerGame[] {
  const merged = new Map(existing.map((g) => [g.key, g]));
  for (const game of incoming) {
    const previous = merged.get(game.key);
    if (previous && previous.source.asOf > game.source.asOf)
      throw new Error('An older export cannot overwrite a newer game');
    merged.set(game.key, game);
  }
  return [...merged.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.opponent.localeCompare(b.opponent),
  );
}
