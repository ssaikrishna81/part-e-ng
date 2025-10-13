import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DialogHostComponent } from './shared/dialog-host.component';
import { ApiService } from './shared/api.service'; // <-- added
import { PortalService } from './shared/portal.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DialogHostComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class App implements AfterViewInit {
  onLoginPage = false;
  loggingOut = false;
  selectedService: string | null = null;
  private sub: Subscription | null = null;
  currentRoute = '';

  constructor(private router: Router, private api: ApiService, private portal: PortalService) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.onLoginPage = e.urlAfterRedirects.startsWith('/login');
        this.currentRoute = e.urlAfterRedirects || '';
      });

    this.sub = this.portal.key$.subscribe(k => this.selectedService = k);
  }

  ngAfterViewInit(): void {
    // measure the header (topbar) height and set a CSS variable so iframe can align exactly
    try {
      const header = document.querySelector('.topbar') as HTMLElement | null;
      if (header) {
        const rect = header.getBoundingClientRect();
        const height = Math.ceil(rect.height);
        // only set the variable if it's not already set or is the legacy default (56px)
        const current = getComputedStyle(document.documentElement).getPropertyValue('--topbar-height').trim();
        if (!current || current === '56px') {
          document.documentElement.style.setProperty('--topbar-height', `${height}px`);
        }
      }
    } catch (e) {
      // silent fallback
    }
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

  openEmbedded(key: string) {
    // delegate to PortalService which will broadcast to Home component
    // navigate to the service route; Home component will react to the route and open the iframe
    this.router.navigateByUrl('/' + key);
  }

  // when user explicitly clicks Home, clear any embedded selection so Home shows welcome
  goHome() {
    this.portal.close();
    this.router.navigateByUrl('/home');
  }

  isActive(key: string) {
    return this.selectedService === key;
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
