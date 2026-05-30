export function escapeInvalidCharacters(input: string): string {
    return input.replace(/&/g, '%26');
}

export function unescapeInvalidCharacters(input: string): string {
    return input.replace(/%26/g, '&');
}

/**
 * Strip HTML tags from a string and collapse whitespace. Used for Commons
 * `extmetadata` fields (e.g. Artist), which arrive as HTML snippets.
 */
export function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}