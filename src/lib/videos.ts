import { z } from 'zod';
import data from '../../data/videos.json';
import { games } from './schedule-data';
import type { Game } from './schedule';
export const videoUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export function validateVideos(input: unknown) {
  const store = z
    .object({
      verifiedAt: z.iso.date(),
      videos: z.array(
        z
          .object({
            title: z.string().min(1),
            date: z.iso.date(),
            gameId: z
              .string()
              .regex(/^(?:\d+|crossbar-[a-z0-9-]+)$/)
              .nullable(),
            videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
          })
          .strict(),
      ),
    })
    .strict()
    .parse(input);
  if (new Set(store.videos.map((v) => v.videoId)).size !== store.videos.length)
    throw new Error('Duplicate video');
  for (const video of store.videos) {
    if (!video.gameId) continue;
    const game = games.find((g) => g.id === video.gameId);
    if (!game || game.date !== video.date || ![game.homeTeamId, game.awayTeamId].includes('st-louis-knights'))
      throw new Error('Video must match a Knights game on the same date');
  }
  return store;
}
export const videos = validateVideos(data);
export function gameVideos(game: Game) {
  return videos.videos.filter((video) => video.gameId === game.id && video.date === game.date);
}
