import { Routes } from '@angular/router';
import { LoginComponent } from './features/login.component';
import { HomeComponent } from './features/home.component';
import { Landingredirectcomponent } from './features/landingredirectcomponent';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  // service routes - render HomeComponent but with service selected so URL shows the service
  { path: 'opal', component: HomeComponent },
  { path: 'vaccination', component: HomeComponent },
  { path: 'water', component: HomeComponent },
  // wildcard fallback
  { path: '**', redirectTo: 'login' }
];
