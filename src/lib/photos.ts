import { z } from 'zod';
import photoData from '../../data/photos.json';
import { games } from './schedule-data';
import { centralDate, type Game } from './schedule';
const collectionUrl = 'https://photos.rainbowmarks.com/2026/Hockey/2013-St-Louis-Knights';
const gallerySchema = z
  .object({
    title: z.string().min(1),
    date: z.iso.date(),
    gameId: z.string().regex(/^\d+$/).nullable(),
    url: z
      .url()
      .refine(
        (value) =>
          value.startsWith(collectionUrl + '/') &&
          new URL(value).origin === 'https://photos.rainbowmarks.com',
      ),
  })
  .strict();
export type Gallery = z.infer<typeof gallerySchema>;
export const photos = z
  .object({
    collectionUrl: z.literal(collectionUrl),
    photographer: z.literal('RainbowMarks Photography'),
    verifiedAt: z.iso.date(),
    galleries: z.array(gallerySchema),
  })
  .strict()
  .parse(photoData);
if (new Set(photos.galleries.map((g) => g.url)).size !== photos.galleries.length)
  throw new Error('Duplicate photo gallery');
for (const gallery of photos.galleries) {
  if (!gallery.gameId) continue;
  const game = games.find((g) => g.id === gallery.gameId);
  if (!game || game.date !== gallery.date || ![game.homeTeamId, game.awayTeamId].includes('st-louis-knights'))
    throw new Error('Gallery must match a Knights game on the same date');
}
export function gameGalleries(game: Game, galleries: Gallery[] = photos.galleries, now = new Date()) {
  // Published, explicitly matched galleries only. Never guess a URL or match a doubleheader by date alone.
  const past = game.startsAt ? Date.parse(game.startsAt) < now.getTime() : game.date < centralDate(now);
  return past && !['cancelled', 'postponed'].includes(game.status)
    ? galleries.filter((g) => g.gameId === game.id && g.date === game.date)
    : [];
}
