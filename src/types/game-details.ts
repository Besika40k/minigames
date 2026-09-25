// The facts shown in the four boxes under the description
export interface GameSpecs {
  readonly genre: string;
  readonly players: string;
  readonly duration: string;
  readonly price: string;
}

export interface TopRecord {
  readonly position: number;
  readonly playerName: string;
  readonly score: number;
  // An ISO date, such as "2026-08-28T14:30:00Z"
  readonly achievedAt: string;
}

// The details of a game, with the field names of the course's mock data
// (`game-tukoni-forest-keepers.json`). The hero image is the imported file
// instead of the mock's server path.
export interface GameDetails {
  readonly slug: string;
  readonly name: string;
  readonly heroImage: string;
  readonly rating: number;
  readonly likesCount: number;
  readonly fullDescription: string;
  readonly specs: GameSpecs;
  readonly topRecords: readonly TopRecord[];
}

export interface GameDetailsContent {
  readonly closeLabel: string;
  // Read out before the numbers, which show only an icon on the screen
  readonly ratingLabel: string;
  readonly likesLabel: string;
  readonly specLabels: Readonly<Record<keyof GameSpecs, string>>;
  readonly playLabel: string;
  // The Favorites button says what a click will do
  readonly addFavoriteLabel: string;
  readonly removeFavoriteLabel: string;
  readonly recordsTitle: string;
  readonly recordsIcon: string;
  // The medals of the first, second and third places
  readonly medals: readonly string[];
  readonly pointsSuffix: string;
}

// A part of the dialog. `reset` puts it back the way it looks when the dialog
// opens, because nothing the visitor changes inside is kept at this stage.
export interface GameDetailsSection {
  readonly element: HTMLElement;
  readonly reset: () => void;
}

export interface GameDetailsDialog {
  readonly element: HTMLDialogElement;
  readonly open: () => void;
}
