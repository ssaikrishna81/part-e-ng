import { Routes } from '@angular/router';
import { OpalTopupComponent } from './features/opal-topup.component';

export const routes: Routes = [
  { path: '', redirectTo: 'opal-topup', pathMatch: 'full' },
  { path: 'opal-topup', component: OpalTopupComponent },
  { path: '**', redirectTo: 'opal-topup' }
];