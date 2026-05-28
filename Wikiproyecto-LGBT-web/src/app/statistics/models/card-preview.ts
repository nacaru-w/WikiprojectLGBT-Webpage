interface CardDetails {
    extract: string;
    /** True once the extract fetch has resolved (even if the page had none). */
    extractLoaded?: boolean;
    image: string;
    /** False when the article has no Wikidata image and the shrug barba is shown. */
    hasImage?: boolean;
    /** Wikidata item id (Q…), used to link to the element page for adding an image. */
    wikidataId?: string;
    /** Creation date (day-month string from the wiki list, e.g. "24 de mayo"). */
    creationDate?: string;
}
export interface CardPreview {
    [key: string]: CardDetails;
}

