export interface GameDevelopersContent {
  readonly title: string;
  // The mockup breaks the description into three lines by hand, so it is kept
  // as lines and the component puts a line break between them.
  readonly descriptionLines: readonly string[];
  readonly buttonText: string;
  readonly contact: string;
}
