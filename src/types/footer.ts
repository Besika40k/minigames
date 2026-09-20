import type { IconName } from '../utils/create-icon.ts';
import type { Route } from './route.ts';

export interface FooterLink {
  readonly label: string;
  readonly route: Route;
}

export interface FooterColumn {
  readonly title: string;
  readonly links: readonly FooterLink[];
}

export interface SocialLink {
  readonly label: string;
  readonly icon: IconName;
  readonly route: Route;
}

export interface ExternalLink {
  readonly label: string;
  readonly url: string;
}

export interface FooterContent {
  readonly tagline: string;
  readonly columns: readonly FooterColumn[];
  readonly communityTitle: string;
  readonly socialLinks: readonly SocialLink[];
  readonly courseLink: ExternalLink;
  readonly developerLink: ExternalLink;
  readonly designCredit: string;
}
