export interface ArticleSearchResult {
    title: string,
    url: string,
    // Last change to the tracked (talk) page, ISO 8601, or null if unknown.
    lastChange: string | null,
}

export interface ArticleSearchResponse {
    query: string,
    // Total number of matches (>= the number of articles returned in this page).
    total: number,
    offset: number,
    limit: number,
    articles: ArticleSearchResult[],
}
