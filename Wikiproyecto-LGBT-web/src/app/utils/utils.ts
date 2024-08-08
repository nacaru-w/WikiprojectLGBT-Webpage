export function escapeInvalidCharacters(input: string): string {
    return input.replace(/&/g, '%26');
}

export function unescapeInvalidCharacters(input: string): string {
    return input.replace(/%26/g, '&');
}