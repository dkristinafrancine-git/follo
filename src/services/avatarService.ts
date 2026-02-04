/**
 * DiceBear Avatar Service
 * Generates consistent avatars based on profile name/ID
 * Uses DiceBear API with bottts style (robot avatars)
 */

// Available avatar styles
export type AvatarStyle =
    | 'bottts'      // Robots (default)
    | 'avataaars'   // Human-like
    | 'fun-emoji'   // Fun emoji faces
    | 'lorelei'     // Abstract portraits
    | 'notionists'  // Minimal style
    | 'thumbs';     // Thumbs up/down

// Color palette for backgrounds
const AVATAR_COLORS = [
    'b6e3f4', // Light blue
    'c0aede', // Light purple
    'ffd5dc', // Light pink
    'd1d4f9', // Periwinkle
    'ffdfba', // Peach
    'baffc9', // Light green
];

/**
 * Generate a DiceBear avatar URL
 * The URL is deterministic - same seed always generates same avatar
 */
export function getAvatarUrl(
    seed: string,
    style: AvatarStyle = 'bottts',
    size = 128
): string {
    // Create a simple hash from the seed to pick a background color
    const colorIndex = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
    const backgroundColor = AVATAR_COLORS[colorIndex];

    // DiceBear API URL
    return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=${backgroundColor}`;
}

/**
 * Generate avatar URL from profile name
 */
export function getProfileAvatarUrl(
    profileName: string,
    profileId?: string,
    style: AvatarStyle = 'bottts'
): string {
    // Use profile ID if available (more stable), otherwise use name
    const seed = profileId ?? profileName;
    return getAvatarUrl(seed, style);
}

/**
 * Get a list of avatar options for user to choose from
 */
export function getAvatarOptions(baseSeed: string, count = 6): string[] {
    return Array.from({ length: count }, (_, i) =>
        getAvatarUrl(`${baseSeed}-${i}`, 'bottts')
    );
}

/**
 * Avatar styles with display names for the picker
 */
export const AVATAR_STYLES: { value: AvatarStyle; label: string }[] = [
    { value: 'bottts', label: 'Robots' },
    { value: 'avataaars', label: 'People' },
    { value: 'fun-emoji', label: 'Emoji' },
    { value: 'lorelei', label: 'Abstract' },
    { value: 'notionists', label: 'Minimal' },
    { value: 'thumbs', label: 'Thumbs' },
];
