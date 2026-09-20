import type { Game } from './schedule';
import venueData from '../../data/venue-directions.json';

// Published Crossbar map destinations, with aliases from matching GameSheet games.
const venueNames: Record<string, string> = venueData.destinations;
export function rinkDirections(game: Game) {
  if (game.crossbar?.placeholder || /^(tbd|unknown|to be determined)$/i.test(game.venue.trim())) return null;
  const destination = venueNames[game.venue] ?? game.venue;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
