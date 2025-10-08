import { Routes } from '@angular/router';
import { WaterBillingComponent } from './features/water-billing.component';

export const routes: Routes = [
  { path: '', redirectTo: 'water-billing', pathMatch: 'full' },
  { path: 'water-billing', component: WaterBillingComponent },
  { path: '**', redirectTo: 'water-billing' }
];
