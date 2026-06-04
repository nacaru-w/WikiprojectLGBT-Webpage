import { Routes } from '@angular/router';
import { MainPageComponent } from './main/components/main-page/main-page.component';
import { authGuard } from './guards/auth.guard';

// All routes except the landing page (`home`) are lazy-loaded so their code
// ships in per-route chunks instead of the initial `main` bundle. `home` stays
// eager because it is the immediate first view — lazy-loading it would only add
// a round-trip before first paint.
export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent, data: { animation: ['HomePage', 'footerAnimation'], deferLoader: true } },
    { path: 'blog', loadComponent: () => import('./blog/components/blog-main/blog-main.component').then(m => m.BlogMainComponent), data: { animation: ['BlogPage', 'footerAnimation'] } },
    { path: 'form', loadComponent: () => import('./form/components/form-main/form-main.component').then(m => m.FormMainComponent), data: { animation: ['FormPage', 'footerAnimation'] } },
    // The stats page is a shell (intro + top-level Articles/Participants/Images
    // nav) with a router-outlet; each section and its sub-views are real child
    // routes. The page-level animation stays on this parent route (the route
    // animation reads the top route's snapshot), so nesting children is transparent
    // to it. Every component is lazy-loaded into its own chunk.
    {
        path: 'stats',
        loadComponent: () => import('./statistics/components/statistics-shared/statistics-shared.component').then(m => m.StatisticsSharedComponent),
        data: { animation: ['StatisticsPage', 'footerAnimation'] },
        children: [
            {
                path: 'articles',
                loadComponent: () => import('./statistics/components/statistics-articles-shell/statistics-articles-shell.component').then(m => m.StatisticsArticlesShellComponent),
                data: { animation: 'articles' },
                children: [
                    { path: '', redirectTo: 'yearly', pathMatch: 'full' },
                    { path: 'yearly', loadComponent: () => import('./statistics/components/statistics-yearly-articles/statistics-yearly-articles.component').then(m => m.StatisticsYearlyArticlesComponent), data: { animation: 'yearly' } },
                    { path: 'monthly', loadComponent: () => import('./statistics/components/statistics-monthly-articles/statistics-monthly-articles.component').then(m => m.StatisticsMonthlyArticlesComponent), data: { animation: 'monthly' } },
                    { path: 'notable', loadComponent: () => import('./statistics/components/statistics-notable/statistics-notable.component').then(m => m.StatisticsNotableComponent), data: { animation: 'notable' } },
                    { path: 'latest', loadComponent: () => import('./statistics/components/statistics-last-articles/statistics-last-articles.component').then(m => m.StatisticsLastArticlesComponent), data: { animation: 'latest' } },
                    { path: 'search', loadComponent: () => import('./statistics/components/statistics-search/statistics-search.component').then(m => m.StatisticsSearchComponent), data: { animation: 'search' } },
                ]
            },
            {
                path: 'participants',
                loadComponent: () => import('./statistics/components/statistics-participants-shell/statistics-participants-shell.component').then(m => m.StatisticsParticipantsShellComponent),
                data: { animation: 'participants' },
                children: [
                    { path: '', redirectTo: 'contributors', pathMatch: 'full' },
                    { path: 'contributors', loadComponent: () => import('./statistics/components/statistics-member-creations/statistics-member-creations.component').then(m => m.StatisticsMemberCreationsComponent), data: { animation: 'contributors' } },
                    { path: 'by-year', loadComponent: () => import('./statistics/components/statistics-participants/statistics-participants.component').then(m => m.StatisticsParticipantsComponent), data: { animation: 'by-year' } },
                ]
            },
            { path: 'images', loadComponent: () => import('./statistics/components/statistics-images/statistics-images.component').then(m => m.StatisticsImagesComponent), data: { animation: 'images' } },
        ]
    },
    // Lazy-loaded: the inline world-map SVG data is large (~1 MB), so it ships
    // in its own chunk only when this page is visited, not in the initial bundle.
    { path: 'event-of-the-month', loadComponent: () => import('./event-of-the-month/components/event-page/event-page.component').then(m => m.EventPageComponent), data: { animation: ['EventPage', 'footerAnimation'] } },
    { path: 'login', loadComponent: () => import('./auth/components/login/login.component').then(m => m.LoginComponent) },
    { path: 'blog-admin', loadComponent: () => import('./blog/components/blog-admin/blog-admin.component').then(m => m.BlogAdminComponent), resolve: [authGuard], data: { animation: ['BlogAdminPage', 'footerAnimation'] } },
    { path: 'blog-edit', loadComponent: () => import('./blog/components/blog-edit/blog-edit.component').then(m => m.BlogEditComponent), resolve: [authGuard], data: { animation: ['BlogEditPage', 'footerAnimation'] } },
    { path: 'privacy', loadComponent: () => import('./legal/components/privacy/privacy.component').then(m => m.PrivacyComponent), data: { animation: ['PrivacyPage', 'footerAnimation'] } },
    { path: 'attribution', loadComponent: () => import('./legal/components/attribution/attribution.component').then(m => m.AttributionComponent), data: { animation: ['AttributionPage', 'footerAnimation'] } },

    { path: 'blog/:id', loadComponent: () => import('./blog/components/blog-post/blog-post.component').then(m => m.BlogPostComponent), data: { animation: ['BlogPostPage', 'footerAnimation'] } },
    { path: 'blog-edit/:id', loadComponent: () => import('./blog/components/blog-edit/blog-edit.component').then(m => m.BlogEditComponent) },

    { path: '**', pathMatch: 'full', loadComponent: () => import('./shared/components/error/error.component').then(m => m.ErrorComponent) }

];
