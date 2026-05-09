/**
 * Extracts a human-friendly display name from whatever is stored in user.name.
 *
 * Handles:
 *  - Normal names: "John Smith" → "John Smith"
 *  - Email-as-name: "amrahmedsayde@gmail.com" → "Amrahmedsayde"
 *  - Empty / whitespace: "" → fallback ("User")
 */
export function getDisplayName(raw: string | undefined | null, fallback = 'User'): string {
  if (!raw || !raw.trim()) return fallback;
  const trimmed = raw.trim();

  // If it looks like an email, pull the local part and title-case it
  if (trimmed.includes('@')) {
    const local = trimmed.split('@')[0];
    // Split on dots / underscores / hyphens to get "words"
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return trimmed;
}

/**
 * Extracts just the first name for greeting banners.
 *
 * "John Smith"              → "John"
 * "amrahmedsayde@gmail.com" → "Amrahmedsayde"
 * "Dr. Sarah Johnson"       → "Dr. Sarah"
 */
export function getFirstName(raw: string | undefined | null, fallback = 'there'): string {
  const display = getDisplayName(raw, fallback);
  const parts = display.split(/\s+/);

  // If the first token is a title (Dr., Mr., etc.), include the next word too
  if (parts.length >= 2 && /^(dr|mr|ms|mrs|prof)\.?$/i.test(parts[0])) {
    return `${parts[0]} ${parts[1]}`;
  }

  return parts[0];
}

/**
 * Extracts initials for avatars.
 *
 * "John Smith"              → "JS"
 * "amrahmedsayde@gmail.com" → "A"
 * "Dr. Sarah Johnson"       → "SJ"
 * ""                        → "?"
 */
export function getInitials(raw: string | undefined | null): string {
  const display = getDisplayName(raw, '');
  if (!display) return '?';

  let parts = display.split(/\s+/).filter(Boolean);

  // Skip titles
  if (parts.length >= 2 && /^(dr|mr|ms|mrs|prof)\.?$/i.test(parts[0])) {
    parts = parts.slice(1);
  }

  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  return parts[0].charAt(0).toUpperCase();
}
