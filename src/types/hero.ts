export interface HeroContent {
  readonly title: string;
  // The mockup words the description differently on mobile, so both versions
  // are kept and the stylesheet shows one of them.
  readonly description: string;
  readonly shortDescription: string;
  readonly buttonText: string;
}
