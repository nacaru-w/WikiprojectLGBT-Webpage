/** Subset of the XTools page `pageinfo` response we display. */
export interface XtoolsPageInfo {
  project: string;
  page: string;
  watchers: number | null;
  pageviews: number;
  pageviews_offset: number; // days the pageview count covers
  revisions: number;        // total edits — used as the authorship denominator
  editors: number;
  anon_edits: number;
  minor_edits: number;
  creator: string;
  creator_editcount: number;
  created_at: string;
  modified_at: string;
}

export interface XtoolsTopEditor {
  rank: number;
  username: string;
  count: number; // number of edits to the page
  minor: number;
}

export interface XtoolsTopEditors {
  project: string;
  page: string;
  limit: number;
  top_editors: XtoolsTopEditor[];
}
