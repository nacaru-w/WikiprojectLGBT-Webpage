import { MemberCreatedArticle, MemberCreationsResponse } from '../../../services/models/member-creations';

/**
 * TEMPORARY sample data so the results UI can be built and reviewed before the
 * /api/member-creations endpoint is deployed to production. These are real
 * Nacaru creations (title, current article size, creation date) captured while
 * testing the endpoint logic. Returned for any searched username for now.
 *
 * To go live: replace the component's mock call with
 * `ApiService.getMemberLgbtCreations(username)` (same MemberCreationsResponse
 * shape) and delete this file.
 */
const wikiUrl = (title: string): string =>
  `https://es.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

const RAW: ReadonlyArray<{ title: string; creationDate: string; sizeBytes: number }> = [
  { title: 'Lo que hay', creationDate: '2026-04-09', sizeBytes: 5783 },
  { title: 'Bimboficadas', creationDate: '2026-03-02', sizeBytes: 4133 },
  { title: 'The Boyfriend', creationDate: '2026-02-06', sizeBytes: 7929 },
  { title: 'Alex Soto (actor)', creationDate: '2025-12-21', sizeBytes: 3342 },
  { title: 'Togayther', creationDate: '2025-12-21', sizeBytes: 5985 },
  { title: 'Templo Wei-ming', creationDate: '2025-11-08', sizeBytes: 3683 },
  { title: 'Red Trébol', creationDate: '2025-08-31', sizeBytes: 5081 },
  { title: 'Curro Albaicín', creationDate: '2025-07-05', sizeBytes: 7193 },
  { title: 'Orgullo de Granada', creationDate: '2025-06-29', sizeBytes: 8384 },
  { title: 'Dolete puellae', creationDate: '2025-05-11', sizeBytes: 3805 },
  { title: 'IsiNgqumo', creationDate: '2025-05-05', sizeBytes: 3324 },
  { title: 'Lubunca', creationDate: '2025-04-19', sizeBytes: 5955 },
  { title: 'Ayana Tsubaki', creationDate: '2024-11-26', sizeBytes: 11060 },
  { title: 'Ayako Fuchigami', creationDate: '2024-11-02', sizeBytes: 3595 },
  { title: 'Día de las Rebeldías Lésbicas', creationDate: '2024-10-13', sizeBytes: 4512 },
  { title: 'Nacarid Portal', creationDate: '2024-09-06', sizeBytes: 5499 },
  { title: 'Matrimonio igualitario en Panamá', creationDate: '2024-08-08', sizeBytes: 8599 },
  { title: 'Edwin Chiloba', creationDate: '2024-06-21', sizeBytes: 9542 },
  { title: 'Dounia', creationDate: '2024-05-25', sizeBytes: 16749 },
  { title: 'Le crime du parking', creationDate: '2024-04-08', sizeBytes: 4943 },
  { title: 'Moonmist', creationDate: '2024-04-07', sizeBytes: 8342 },
  { title: 'Charlotte Charlaque', creationDate: '2024-03-13', sizeBytes: 9161 },
  { title: 'Toni Ebel', creationDate: '2024-03-11', sizeBytes: 8865 },
  { title: 'Aleksandra Skochilenko', creationDate: '2024-03-08', sizeBytes: 17662 },
  { title: 'Phyll Opoku-Gyimah', creationDate: '2024-03-01', sizeBytes: 19513 },
  { title: 'Twin Fantasy', creationDate: '2024-02-04', sizeBytes: 17710 },
  { title: 'Tami T', creationDate: '2023-08-17', sizeBytes: 3629 },
  { title: 'La Pija y la Quinqui', creationDate: '2023-07-18', sizeBytes: 63574 },
  { title: 'Before Stonewall', creationDate: '2023-06-07', sizeBytes: 4982 },
  { title: 'La casa en el mar más azul', creationDate: '2023-06-07', sizeBytes: 5947 },
  { title: 'Sombras sobre Shimanami', creationDate: '2023-05-15', sizeBytes: 11651 },
  { title: 'Blåhaj', creationDate: '2023-02-25', sizeBytes: 4996 },
  { title: 'Pia Beck', creationDate: '2022-09-05', sizeBytes: 4877 },
  { title: 'Madame Arthur', creationDate: '2022-07-15', sizeBytes: 7254 },
  { title: 'Juriji der Klee', creationDate: '2022-07-07', sizeBytes: 9705 },
  { title: 'Ley trans (España)', creationDate: '2022-07-02', sizeBytes: 82437 },
  { title: 'Gaysper', creationDate: '2021-05-24', sizeBytes: 10164 },
  { title: 'Samantha Hudson', creationDate: '2021-02-21', sizeBytes: 79238 },
  { title: 'Paris Lees', creationDate: '2018-07-14', sizeBytes: 25551 },
];

const MOCK_ARTICLES: MemberCreatedArticle[] = RAW.map(a => ({
  title: a.title,
  url: wikiUrl(a.title),
  creationDate: a.creationDate,
  sizeBytes: a.sizeBytes,
}));

export function mockMemberCreations(username: string): MemberCreationsResponse {
  return {
    username,
    project: 'es.wikipedia.org',
    count: MOCK_ARTICLES.length,
    articles: MOCK_ARTICLES,
  };
}
