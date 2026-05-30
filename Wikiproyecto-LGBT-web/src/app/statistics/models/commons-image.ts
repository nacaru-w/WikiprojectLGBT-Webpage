/** One image from the Wikiproyecto's Commons campaign, ready for the gallery. */
export interface CommonsImage {
  /** Full file title, e.g. "File:Pride 2024.jpg". */
  title: string;
  /** Human caption: extmetadata ObjectName, or the title cleaned of File:/extension. */
  caption: string;
  /** Date the photo was taken (extmetadata DateTimeOriginal), null if unknown. */
  dateTaken: string | null;
  /** Width-capped thumbnail URL (from imageinfo iiurlwidth). */
  thumbUrl: string;
  /** Commons file-description page — where a thumbnail click goes. */
  descriptionUrl: string;
  /** Uploading member's username. */
  uploader: string;
  /** Link to the uploader's Commons user page. */
  uploaderUrl: string;
  /** Short licence name, e.g. "CC BY-SA 4.0" (null if unknown). */
  license: string | null;
  /** Author/credit (extmetadata Artist), HTML-stripped (null if unknown). */
  artist: string | null;
  /** Upload timestamp (ISO) — used to sort newest-first. */
  timestamp: string;
}
