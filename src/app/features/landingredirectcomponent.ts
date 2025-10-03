import { Component, inject  } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landingredirectcomponent',
  imports: [],
  standalone: true,
  templateUrl: './landingredirectcomponent.html',
  styleUrl: './landingredirectcomponent.css'
})
export class Landingredirectcomponent {
private router = inject(Router);

  constructor() {
    const loggedIn = localStorage.getItem('loggedIn') === 'true';
    this.router.navigateByUrl(loggedIn ? '/home' : '/login');
  }
}
