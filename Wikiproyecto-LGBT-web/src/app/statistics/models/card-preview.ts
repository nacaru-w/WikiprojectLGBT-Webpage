interface CardDetails {
    extract: string;
    image: string;
    /** False when the article has no Wikidata image and the shrug barba is shown. */
    hasImage?: boolean;
    /** Wikidata item id (Q…), used to link to the element page for adding an image. */
    wikidataId?: string;
}
export interface CardPreview {
    [key: string]: CardDetails;
}

