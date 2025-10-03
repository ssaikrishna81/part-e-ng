import { Routes } from '@angular/router';
import { LoginComponent } from './features/login.component';
import { HomeComponent } from './features/home.component';
import { OpalTopupComponent } from './features/opal-topup.component';
import { VaccinationComponent } from './features/vaccination.component';
import { WaterBillingComponent } from './features/water-billing.component';
import { Landingredirectcomponent } from './features/landingredirectcomponent';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'opal-topup', component: OpalTopupComponent },
  { path: 'vaccination', component: VaccinationComponent },
  { path: 'water-billing', component: WaterBillingComponent },
  { path: '**', redirectTo: 'login' }
];
