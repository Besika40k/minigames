import type { NotFoundContent } from '../types/not-found.ts';

export const NOT_FOUND_CONTENT: NotFoundContent = {
  code: '404',
  title: 'Page not found',
  messageStart: 'The page',
  messageEnd: ' does not exist. Check the address for typos, or go back to the home page.',
  homeLinkText: 'Return to Home Page',
};
