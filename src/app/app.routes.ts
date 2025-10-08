import { Routes } from '@angular/router';
import { VaccinationComponent } from './features/vaccination.component';

export const routes: Routes = [
  { path: '', redirectTo: 'vaccination', pathMatch: 'full' },
  { path: 'vaccination', component: VaccinationComponent },
  { path: '**', redirectTo: 'vaccination' }
];
