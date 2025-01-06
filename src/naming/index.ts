import { allReservedKeywords } from './all-reserved-keywords';
import { reservedKeywords } from './reserved-keywords';

// More restrictive than strictly necessary, so we'll end up quoting some things that don't
// necessarily need quotes, but that's fine.
const validIdentifierRe = /^[a-z_][a-z0-9_]*$/;

export const wrapQuotes = (string: string, extended?: boolean) => {
  const isValidIdentifier = validIdentifierRe.test(string);
  const isReserved = reservedKeywords.has(string) || (extended && allReservedKeywords.has(string));
  const shouldWrap = isReserved || !isValidIdentifier;

  return shouldWrap ? `"${string}"` : string;
};

export const toSnakeCase = (string: string) =>
  string
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join('_');
