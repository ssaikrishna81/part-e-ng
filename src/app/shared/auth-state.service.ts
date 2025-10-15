import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const LOGGED_IN_KEY = 'loggedIn';
const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly subject: BehaviorSubject<boolean>;

  constructor() {
    this.subject = new BehaviorSubject<boolean>(this.readInitialState());
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.subject.asObservable();
  }

  isLoggedIn(): boolean {
    return this.subject.value;
  }

  markLoggedIn(token?: string | null): void {
    if (typeof window === 'undefined') {
      this.subject.next(true);
      return;
    }

    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    window.localStorage.setItem(LOGGED_IN_KEY, 'true');
    this.subject.next(true);
  }

  markLoggedOut(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(LOGGED_IN_KEY);
    }
    this.subject.next(false);
  }

  private readInitialState(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(LOGGED_IN_KEY) === 'true';
  }
}
