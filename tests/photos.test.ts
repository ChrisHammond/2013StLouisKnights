import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameGalleries, photos } from '../src/lib/photos';
import { games } from '../src/lib/schedule-data';

test('gallery links require an explicit matching game and a past start', () => {
  const game = games.find((g) => g.id === '2951469')!;
  const gallery = { ...photos.galleries[0], gameId: game.id, date: game.date };
  const before = new Date(Date.parse(game.startsAt!) - 1);
  const after = new Date(Date.parse(game.startsAt!) + 1);
  assert.equal(gameGalleries(game, [gallery], before).length, 0);
  assert.equal(gameGalleries(game, [gallery], after).length, 1);
  assert.equal(gameGalleries({ ...game, id: '2951488' }, [gallery], after).length, 0);
  assert.equal(gameGalleries({ ...game, status: 'cancelled' }, [gallery], after).length, 0);
  assert.equal(gameGalleries(game, [{ ...gallery, gameId: null }], after).length, 0);
});
