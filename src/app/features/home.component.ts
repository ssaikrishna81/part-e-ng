import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PortalService } from '../shared/portal.service';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  // iframe src that will be set when user clicks a service button in the navbar
  embeddedSrc: SafeResourceUrl | null = null;
  private sub: Subscription | null = null;
  private routeSub: Subscription | null = null;

  constructor(private sanitizer: DomSanitizer, private portal: PortalService, private router: Router) {
    this.sub = this.portal.embedded$.subscribe(url => {
      this.embeddedSrc = url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
    });

    // open service based on current route path (so /opal opens opal, etc.)
    this.routeSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      const path = e.urlAfterRedirects.replace(/^\//, '').split('?')[0] || '';
      const normalized = path === 'vaccination' ? 'vaccine' : path;
      if (normalized === 'opal' || normalized === 'vaccine' || normalized === 'water') {
        this.portal.openService(normalized);
      } else if (path === '' || path === 'home' || path === 'login') {
        this.portal.close();
      }
    });
  }

  closeEmbedded() {
    this.portal.close();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }
}
