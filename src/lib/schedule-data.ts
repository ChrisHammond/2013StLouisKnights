import store from '../../data/schedule.json';
import { teams } from './data';
import { validateSchedule, sortGames } from './schedule';
export const schedule = validateSchedule(
  store.snapshots.at(-1),
  teams.map((t) => t.id),
);
export const games = sortGames(schedule.games);
export const scheduleStatus = store;
