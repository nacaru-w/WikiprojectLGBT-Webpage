import { Routes } from '@angular/router';
import { MainPageComponent } from './main/components/main-page/main-page.component';
import { BlogMainComponent } from './blog/components/blog-main/blog-main.component';
import { FormMainComponent } from './form/components/form-main/form-main.component';

export const routes: Routes = [
    { path: 'home', component: MainPageComponent },
    { path: 'blog', component: BlogMainComponent },
    { path: 'form', component: FormMainComponent }
];
