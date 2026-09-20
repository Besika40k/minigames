const INITIALS_LENGTH = 2;

// Takes the first two capital letters of a name written in camel case or with
// underscores: "Alex_Pro99" is "AP" and "CozyGamer_x" is "CG". A name with fewer
// than two capitals uses its first letters instead.
export function getInitials(playerName: string): string {
  const capitals: string[] = playerName.match(/\p{Lu}/gu) ?? [];
  const letters: string[] =
    capitals.length < INITIALS_LENGTH
      ? [...playerName.replaceAll(/[^\p{L}\p{N}]/gu, '')]
      : capitals;

  return letters.slice(0, INITIALS_LENGTH).join('').toUpperCase();
}
