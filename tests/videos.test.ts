import { test } from 'node:test';
import assert from 'node:assert/strict';
import data from '../data/videos.json';
import { validateVideos, gameVideos } from '../src/lib/videos';
import { games } from '../src/lib/schedule-data';
test('videos distinguish two games on the same date', () => {
  assert.equal(gameVideos(games.find((g) => g.id === '2951469')!)[0].videoId, 'G2y7maxb8o0');
  assert.equal(gameVideos(games.find((g) => g.id === '2951488')!)[0].videoId, 'lIZEI8XQJZs');
});
test('reject duplicate videos and incorrect date mappings', () => {
  const video = data.videos.find((v) => v.gameId === '2951469')!;
  assert.throws(() => validateVideos({ ...data, videos: [video, video] }));
  assert.throws(() => validateVideos({ ...data, videos: [{ ...video, date: '2026-09-20' }] }));
});
