export interface NotFoundContent {
  // The big number above the title. It is decoration: the title says the same.
  readonly code: string;
  readonly title: string;
  // The sentence around the address that has no page
  readonly messageStart: string;
  readonly messageEnd: string;
  readonly homeLinkText: string;
}
