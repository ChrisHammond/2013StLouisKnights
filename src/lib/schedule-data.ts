import store from '../../data/schedule.json';
import crossbarStore from '../../data/crossbar.json';
import { mergeCrossbar, crossbarSnapshotSchema } from './crossbar';
import { teams } from './data';
import { validateSchedule } from './schedule';
export const schedule = validateSchedule(
  store.snapshots.at(-1),
  teams.map((t) => t.id),
);
export const crossbar = crossbarSnapshotSchema.parse(crossbarStore.snapshots.at(-1));
export const crossbarStatus = crossbarStore;
export const games = mergeCrossbar(schedule.games, crossbar);
export const scheduleStatus = store;
