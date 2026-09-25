// The details of a game, with the field names of the course's mock data
// (`game-tukoni-forest-keepers.json`). The hero image is the imported file
// instead of the mock's server path.
export interface GameDetails {
  readonly slug: string;
  readonly name: string;
  readonly heroImage: string;
}

export interface GameDetailsContent {
  readonly closeLabel: string;
}

export interface GameDetailsDialog {
  readonly element: HTMLDialogElement;
  readonly open: () => void;
}
