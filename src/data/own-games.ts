import type { OwnGame } from '../types/game.ts';
import { FREE_PRICE } from './games.ts';

// The pictures ship in public/assets next to the API's, so they are read from
// the app's own base ("/" or "/minigames/")
const IMAGE_FOLDER = `${import.meta.env.BASE_URL}assets/images/games/`;

// The difficulties of Alchemist's Cauldron, as its records name them, with
// the names the records show
export const RECORD_DETAILS: Readonly<Record<string, string>> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

// The games made for MiniGames itself, shown before the API's games. Nobody
// has rated them yet. Their likes are counted in Firestore: the number here
// only shows until the count arrives, or when it cannot load.
export const OWN_GAMES: readonly OwnGame[] = [
  {
    slug: 'alchemists-cauldron',
    name: "Alchemist's Cauldron",
    category: 'puzzle',
    price: FREE_PRICE,
    shortDescription:
      'Mix ingredients, match three target ranges and brew potions before the time or your lives run out.',
    rating: 0,
    likesCount: 0,
    cardImage: `${IMAGE_FOLDER}alchemists-cauldron-card.jpg`,
    heroImage: `${IMAGE_FOLDER}alchemists-cauldron-hero.jpg`,
    fullDescription:
      "Alchemist's Cauldron is a potion brewing game made for MiniGames. Every recipe asks for a temperature, a density and a magic power within a narrow range: drop up to five ingredients into the cauldron, watch out for the reactions they set off, and brew before the clock runs out. Three difficulties, a life lost with every failed brew, a Top 10 for each difficulty, and a game that carries on after a reload.",
    specs: { genre: 'Puzzle', players: 'Solo', duration: '3-10 min', price: FREE_PRICE },
    playUrl: 'https://besika40k.github.io/alchemists-cauldron/',
  },
];
