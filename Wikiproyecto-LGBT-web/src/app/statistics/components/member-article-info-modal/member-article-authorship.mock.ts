import { ArticleAuthorshipResponse } from '../../../services/models/article-authorship';

/**
 * TEMPORARY sample authorship data. The real source is XTools' authorship table
 * (WikiWho-powered, content share by characters), which has NO CORS — so it must
 * be proxied by our backend (`GET /api/article-authorship/:title`, see
 * server.ts) that isn't deployed yet. Until then this canned set (real capture
 * for "Samantha Hudson") is returned for any article so the member-focused pie
 * can be built/reviewed.
 *
 * To go live: replace the modal's `mockArticleAuthorship(...)` with
 * `ApiService.getArticleAuthorship(title)` (same shape) and delete this file.
 */
const SAMPLE_AUTHORS = [
  { username: 'Nacaru', chars: 38571, percentage: 52.6 },
  { username: 'Ceaseless Watcher', chars: 17486, percentage: 23.8 },
  { username: 'Ideator 2.0', chars: 6936, percentage: 9.5 },
  { username: 'KarlaR98', chars: 1757, percentage: 2.4 },
  { username: 'Duuk-Tsarith', chars: 998, percentage: 1.4 },
  { username: 'Saloca', chars: 844, percentage: 1.2 },
  { username: 'Vinicius10', chars: 642, percentage: 0.9 },
  { username: 'Carles meren', chars: 560, percentage: 0.8 },
  { username: 'Crls9011', chars: 463, percentage: 0.6 },
  { username: 'Brunnaiz', chars: 423, percentage: 0.6 },
  { username: 'HidraNorma', chars: 368, percentage: 0.5 },
  { username: 'PedroAcero76', chars: 332, percentage: 0.5 },
  { username: 'InternetArchiveBot', chars: 254, percentage: 0.3 },
  { username: 'Pancowd', chars: 230, percentage: 0.3 },
  { username: 'Jmimo98', chars: 186, percentage: 0.3 },
  { username: 'Xapzo', chars: 162, percentage: 0.2 },
  { username: 'Kambalaya4.0', chars: 149, percentage: 0.2 },
  { username: 'MiguelAlanCS', chars: 130, percentage: 0.2 },
  { username: 'Rubenmorales958', chars: 113, percentage: 0.2 },
  { username: 'Sabbut', chars: 101, percentage: 0.1 },
  { username: 'Peridotito', chars: 94, percentage: 0.1 },
  { username: 'Amalaidea', chars: 87, percentage: 0.1 },
  { username: 'SaulAR290797', chars: 67, percentage: 0.1 },
  { username: 'Xsmxxlvxlx', chars: 63, percentage: 0.1 },
  { username: 'Msimple', chars: 59, percentage: 0.1 },
  { username: 'Adrianmartinezuwu', chars: 49, percentage: 0.1 },
  { username: 'PepeJuanitxs', chars: 42, percentage: 0.1 },
  { username: 'Embolat', chars: 41, percentage: 0.1 },
  { username: 'Sermd', chars: 38, percentage: 0.1 },
  { username: 'LIrala', chars: 38, percentage: 0.1 },
  { username: 'KokuyoKoychi', chars: 30, percentage: 0 },
  { username: 'AgroVeritatis', chars: 27, percentage: 0 },
  { username: 'TheRichic', chars: 27, percentage: 0 },
  { username: 'Przdiez', chars: 21, percentage: 0 },
  { username: 'Benjavalero', chars: 21, percentage: 0 },
];

export function mockArticleAuthorship(title: string): ArticleAuthorshipResponse {
  return { title, authors: SAMPLE_AUTHORS };
}
