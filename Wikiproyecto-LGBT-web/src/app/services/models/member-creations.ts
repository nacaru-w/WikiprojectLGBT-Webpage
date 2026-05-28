export interface MemberCreatedArticle {
    title: string,
    url: string,
    creationDate: string | null,
    // Current article size in bytes (from XTools `length`), or null if unknown.
    sizeBytes: number | null,
}

export interface MemberCreationsResponse {
    username: string,
    project: string,
    count: number,
    articles: MemberCreatedArticle[],
}
