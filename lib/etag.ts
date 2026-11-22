export function matchesIfNoneMatch(value: string | null, tag: string) {
  if (value === null) return false;
  if (value === "*") return true;

  // Commas inside quoted opaque tags are data, not list separators.
  const member = /[ \t]*(?:(?:W\/)?("[!#-~\u0080-\u00ff]*")[ \t]*)?(?:,|$)/y;
  let matched = false;
  while (member.lastIndex < value.length) {
    const match = member.exec(value);
    if (!match) return false;
    if (match[1] === tag) matched = true;
  }
  return matched;
}
