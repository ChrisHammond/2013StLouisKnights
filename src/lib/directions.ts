import type { Game } from './schedule';
import venueData from '../../data/venue-directions.json';

// Published Crossbar map destinations, with aliases from matching GameSheet games.
const venueNames: Record<string, string> = venueData.destinations;
export function rinkDirections(game: Game) {
  if (game.crossbar?.placeholder || /^(tbd|unknown|to be determined)$/i.test(game.venue.trim())) return null;
  const tournamentVenues: Record<string, string> = {
    Oakton: 'Oakton Ice Arena 2800 Oakton St Park Ridge IL 60068',
    'Edge John': 'Edge John Street 545 John Street Bensenville IL 60106',
    'Elk Grove / West': 'Elk Grove Ice Arena 610 Meacham Rd Elk Grove Village IL 60007',
  };
  const destination =
    (game.tournament && tournamentVenues[game.venue]) || venueNames[game.venue] || game.venue;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
