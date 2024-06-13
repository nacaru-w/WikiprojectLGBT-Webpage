import { Routes } from '@angular/router';
import { MainPageComponent } from './main/components/main-page/main-page.component';
import { BlogMainComponent } from './blog/components/blog-main/blog-main.component';
import { FormMainComponent } from './form/components/form-main/form-main.component';
import { LoginComponent } from './auth/components/login/login.component';
import { PrivacyComponent } from './legal/components/privacy/privacy.component';
import { StatisticsSharedComponent } from './statistics/components/statistics-shared/statistics-shared.component';
import { BlogAdminComponent } from './blog/components/blog-admin/blog-admin.component';
import { BlogEditComponent } from './blog/components/blog-edit/blog-edit.component';
import { ErrorComponent } from './shared/components/error/error.component';
import { AttributionComponent } from './legal/components/attribution/attribution.component';
import { BlogPostComponent } from './blog/components/blog-post/blog-post.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent, data: { animation: ['HomePage', 'footerAnimation'] } },
    { path: 'blog', component: BlogMainComponent, data: { animation: ['BlogPage', 'footerAnimation'] } },
    { path: 'form', component: FormMainComponent, data: { animation: ['FormPage', 'footerAnimation'] } },
    { path: 'stats', component: StatisticsSharedComponent, data: { animation: ['StatisticsPage', 'footerAnimation'] } },
    { path: 'login', component: LoginComponent },
    { path: 'blog-admin', component: BlogAdminComponent },
    { path: 'blog-edit', component: BlogEditComponent },
    { path: 'privacy', component: PrivacyComponent, data: { animation: ['PrivacyPage', 'footerAnimation'] } },
    { path: 'attribution', component: AttributionComponent, data: { animation: ['AttributionPage', 'footerAnimation'] } },

    { path: 'blog/:id', component: BlogPostComponent, data: { animation: ['BlogPostPage', 'footerAnimation'] } },
    { path: 'blog-edit/:id', component: BlogEditComponent },

    { path: '**', pathMatch: 'full', component: ErrorComponent }

];
