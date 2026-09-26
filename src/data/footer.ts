import { Route } from '../types/route.ts';
import type { FooterContent } from '../types/footer.ts';
import { IconName } from '../utils/create-icon.ts';

// Home and Library are real pages. The other links have no page in the
// mockup yet, so they lead to Home.
export const FOOTER_CONTENT: FooterContent = {
  tagline:
    'Take a short break and have fun. Hundreds of curated casual mini-games right in your web browser. No download required.',
  columns: [
    {
      title: 'Explore',
      links: [
        { label: 'Home', route: Route.Home },
        { label: 'Library', route: Route.Library },
        { label: 'Categories', route: Route.Home },
        { label: 'Tournaments', route: Route.Home },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', route: Route.Home },
        { label: 'Contact', route: Route.Home },
        { label: 'Privacy Policy', route: Route.Home },
        { label: 'Terms of Service', route: Route.Home },
      ],
    },
  ],
  communityTitle: 'Community',
  socialLinks: [
    { label: 'Share', icon: IconName.Share, route: Route.Home },
    { label: 'Chat', icon: IconName.Chat, route: Route.Home },
    { label: 'RSS feed', icon: IconName.Rss, route: Route.Home },
  ],
  courseLink: { label: 'RS School', url: 'https://rs.school/courses/short-track' },
  developerLink: { label: '@Besika40k', url: 'https://github.com/Besika40k' },
  designCredit: 'Designed with love',
};
