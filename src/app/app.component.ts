import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DialogHostComponent } from './shared/dialog-host.component';
import { ApiService } from './shared/api.service'; // <-- added
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DialogHostComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class App {
  onLoginPage = false;
  loggingOut = false;

  constructor(private router: Router, private api: ApiService) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.onLoginPage = e.urlAfterRedirects.startsWith('/login'));
  }

  logout() {
    // call backend logout if available, then always clear client state
    this.loggingOut = true;
    this.api.logout()?.pipe(finalize(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('loggedIn');
      this.loggingOut = false;
      this.router.navigateByUrl('/login');
    })).subscribe({
      next: () => { /* successful server logout */ },
      error: () => { /* ignore server failure, still clear client state */ }
    });
  }
}
