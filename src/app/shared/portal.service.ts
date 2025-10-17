import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type ServiceKey = 'opal' | 'vaccine' | 'water';

@Injectable({ providedIn: 'root' })
export class PortalService {
  private embeddedSubject = new BehaviorSubject<string | null>(null);
  readonly embedded$ = this.embeddedSubject.asObservable();

  // also expose the currently selected service key for UI state
  private keySubject = new BehaviorSubject<string | null>(null);
  readonly key$ = this.keySubject.asObservable();

  private readonly pathMap: Record<ServiceKey, string> = {
    opal: '/opal/',
    vaccine: '/vaccine/',
    water: '/water/'
  };

  private readonly devHostPorts: Record<ServiceKey, string> = {
    opal: 'http://localhost:4201/',
    vaccine: 'http://localhost:4202/',
    water: 'http://localhost:4203/'
  };

  private readonly composeFallback: Record<ServiceKey, string> = {
    opal: 'http://localhost:8082/',
    vaccine: 'http://localhost:8083/',
    water: 'http://localhost:8084/'
  };

  // Centralized service URL map — replace with real endpoints
  private services: Record<ServiceKey, string> = {
    opal: this.resolveUrl('opal'),
    vaccine: this.resolveUrl('vaccine'),
    water: this.resolveUrl('water')
  };

  openService(key: string) {
    const normalized = this.normalizeKey(key);
    const url = normalized ? this.services[normalized] : null;
    this.keySubject.next(normalized);
    this.embeddedSubject.next(url);
  }

  close() {
    this.keySubject.next(null);
    this.embeddedSubject.next(null);
  }

  // helper to get raw URL by key
  getUrl(key: string): string | null {
    const normalized = this.normalizeKey(key);
    return normalized ? this.services[normalized] : null;
  }

  // get currently selected key synchronously
  getSelectedKey(): string | null {
    return this.keySubject.getValue();
  }

  private normalizeKey(key: string): ServiceKey | null {
    switch (key) {
      case 'opal':
      case 'vaccine':
      case 'water':
        return key;
      case 'vaccination':
        return 'vaccine';
      default:
        return null;
    }
  }

  private resolveUrl(key: ServiceKey): string {
    if (typeof window === 'undefined') {
      return this.composeFallback[key];
    }

    const port = window.location.port;
    if (port === '8080' || port === '4200') {
      return this.devHostPorts[key];
    }

    if (port === '' || port === '80') {
      return new URL(this.pathMap[key], window.location.origin).toString();
    }

    return this.composeFallback[key];
  }
}
