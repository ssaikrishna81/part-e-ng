import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PortalService {
  private embeddedSubject = new BehaviorSubject<string | null>(null);
  readonly embedded$ = this.embeddedSubject.asObservable();

  // also expose the currently selected service key for UI state
  private keySubject = new BehaviorSubject<string | null>(null);
  readonly key$ = this.keySubject.asObservable();

  // Centralized service URL map — replace with real endpoints
  private services: Record<string, string> = {
    // Direct dev URLs for local services
    opal: 'http://localhost:5631',
    vaccination: 'http://localhost:5632',
    water: 'http://localhost:5633'
  };

  openService(key: string) {
    const url = this.services[key] || null;
    this.keySubject.next(key);
    this.embeddedSubject.next(url);
  }

  close() {
    this.keySubject.next(null);
    this.embeddedSubject.next(null);
  }

  // helper to get raw URL by key
  getUrl(key: string): string | null {
    return this.services[key] || null;
  }

  // get currently selected key synchronously
  getSelectedKey(): string | null {
    return this.keySubject.getValue();
  }
}
