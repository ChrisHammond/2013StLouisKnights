import { z } from 'zod';
import { centralInstant, centralDate, sortGames, type Game } from './schedule';
export const crossbarUrl = 'https://www.stlknightshockey.com/team/244514/games';
const knights = 'st-louis-knights';
const aliases: Record<string, string> = {
  Express: 'northern-express',
  Blues: 'chicago-blues',
  'Ice Dogs': 'vernon-hills-ice-dogs',
  Sabres: 'naperville-sabres',
  Falcons: 'highland-park-falcons',
  Hawks: 'chicago-hawks',
  '13U AA St. Louis Eagles': 'st-louis-eagles',
  Eagles: 'st-louis-eagles',
  'Sting 13U - Tier 2': 'st-louis-sting',
  Sting: 'st-louis-sting',
  Chargers: 'northwest-chargers',
  Wilmette: 'wilmette-jr-trevians',
  Vipers: 'lake-county-vipers',
  Winnetka: 'winnetka-warriors',
};
export const crossbarSnapshotSchema = z
  .object({
    season: z.literal('2026-27'),
    sourceUrl: z.literal(crossbarUrl),
    sourcePublishedAt: z.null(),
    collectedAt: z.iso.datetime(),
    entries: z
      .array(
        z
          .object({
            id: z.string().startsWith('crossbar-'),
            date: z.iso.date(),
            startsAt: z.iso.datetime().nullable(),
            opponent: z.string().min(1),
            side: z.enum(['home', 'away']),
            label: z.string().min(1),
            venue: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (new Set(s.entries.map((e) => e.id)).size !== s.entries.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate Crossbar entries' });
    for (const e of s.entries)
      if (
        e.date < '2026-07-01' ||
        e.date > '2027-07-31' ||
        (e.startsAt && centralDate(new Date(e.startsAt)) !== e.date)
      )
        ctx.addIssue({ code: 'custom', message: 'Invalid Crossbar date' });
  });
export type CrossbarSnapshot = z.infer<typeof crossbarSnapshotSchema>;
const clean = (s: string) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export function parseCrossbar(html: string, collectedAt: string): CrossbarSnapshot {
  if (!html.includes('2026-CS-REGULAR SEASON') || !html.includes('2013 Knights'))
    throw new Error('Unexpected Crossbar season or team');
  const boxes = html.split('<div class="box" style="margin-top:10px;">').slice(1);
  const entries = boxes.map((box) => {
    const headings = [...box.matchAll(/<h1[^>]*>(.*?)<\/h1>/gs)].slice(0, 2).map((m) => clean(m[1]));
    const month =
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(
        headings[0],
      ) + 1;
    if (!month || !/^\d{1,2}$/.test(headings[1])) throw new Error('Unknown Crossbar date');
    const date = `${month >= 7 ? 2026 : 2027}-${String(month).padStart(2, '0')}-${headings[1].padStart(2, '0')}`;
    const matchup = clean(box.match(/<h2[^>]*>(.*?)<\/h2>/s)?.[1] ?? '');
    const match = matchup.match(/^(@|vs\.)\s+(.+)$/);
    if (!match) throw new Error('Unknown Crossbar matchup');
    const label = box.match(/<span class="small">\(([^<]+)\)<br><\/span>/)?.[1] ?? 'Other game';
    const time = clean(box.match(/<h3[^>]*>(.*?)<\/h3>/s)?.[1] ?? '');
    const clock = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
    if (!clock && time !== 'TBD') throw new Error('Unknown Crossbar time');
    const startsAt = clock
      ? centralInstant(date, (Number(clock[1]) % 12) + (clock[3] === 'PM' ? 12 : 0), Number(clock[2]))
      : null;
    const opponent = match[2];
    const side = match[1] === '@' ? ('away' as const) : ('home' as const);
    const id = `crossbar-${date}-${side}-${opponent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-$/, '')}`;
    return {
      id,
      date,
      startsAt,
      opponent,
      side,
      label,
      venue: clean(box.match(/<p><a[^>]*>(.*?)<\/a>/s)?.[1] ?? ''),
    };
  });
  return crossbarSnapshotSchema.parse({
    season: '2026-27',
    sourceUrl: crossbarUrl,
    sourcePublishedAt: null,
    collectedAt,
    entries,
  });
}
export function mergeCrossbar(official: Game[], input: unknown): Game[] {
  const snapshot = crossbarSnapshotSchema.parse(input);
  const merged = official.map((g) => ({ ...g }));
  const matched = new Set<string>();
  for (const entry of snapshot.entries) {
    const opponentId = aliases[entry.opponent];
    const candidates = official.filter(
      (g) =>
        opponentId &&
        g.date === entry.date &&
        g.homeTeamId === (entry.side === 'home' ? knights : opponentId) &&
        g.awayTeamId === (entry.side === 'away' ? knights : opponentId),
    );
    const exact = candidates.filter((g) => g.startsAt === entry.startsAt);
    const match = exact.length === 1 ? exact[0] : candidates.length === 1 ? candidates[0] : undefined;
    if (candidates.length && !match)
      throw new Error('Ambiguous Crossbar doubleheader; explicit mapping required');
    if (match) {
      if (matched.has(match.id)) throw new Error('Multiple Crossbar entries match one official game');
      matched.add(match.id);
      if (match.startsAt !== entry.startsAt) {
        const game = merged.find((g) => g.id === match.id)!;
        game.crossbar = {
          opponent: entry.opponent,
          label: entry.label,
          placeholder: false,
          note: `Crossbar lists ${entry.startsAt ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(entry.startsAt)) : 'Time TBD'}. GameSheet time shown; confirm with team staff.`,
        };
      }
      continue;
    }
    // Unmatched Crossbar "League" does not establish CSDHL eligibility.
    const placeholder = entry.label === 'Tournament';
    merged.push({
      id: entry.id,
      date: entry.date,
      startsAt: entry.startsAt,
      homeTeamId: entry.side === 'home' ? knights : 'crossbar-opponent',
      awayTeamId: entry.side === 'away' ? knights : 'crossbar-opponent',
      gameNumber: '',
      venue: entry.venue,
      kind: placeholder ? 'tournament' : 'other',
      status: 'scheduled',
      crossbar: { opponent: entry.opponent, label: entry.label, placeholder },
    });
  }
  return sortGames(merged);
}
