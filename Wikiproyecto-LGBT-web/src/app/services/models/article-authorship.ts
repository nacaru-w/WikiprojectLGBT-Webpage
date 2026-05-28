/** One contributor's share of an article's current content (XTools/WikiWho). */
export interface ArticleAuthor {
  username: string;
  chars: number;       // characters of current content attributed to them
  percentage: number;  // XTools-computed % of the whole article
}

export interface ArticleAuthorshipResponse {
  title: string;
  authors: ArticleAuthor[];
}
