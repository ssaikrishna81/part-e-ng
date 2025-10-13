// src/app/shared/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const API_BASE = '/api/v1'; // proxy maps /api -> http://localhost:8000 so /api/v1 -> http://localhost:8000/api/v1

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private handleError(err: any) {
    // minimal error normalization: unwrap common shapes
    const message =
      err?.error?.message ||
      err?.message ||
      (typeof err === 'string' ? err : 'Server error');
    return throwError(() => new Error(message));
  }

  // -------------------------
  // NOTE: service-specific API methods (Vaccination / Opal / Water) removed
  // to keep this ApiService focused on portal authentication and common endpoints.
  // If you need those APIs later, either restore them here or extract to a
  // separate ServiceApi file.

  // -------------------------
  // Auth (portal)
  // POST /api/v1/auth/register
  register(payload: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/register`, payload).pipe(catchError(this.handleError));
  }

  // POST /api/v1/auth/login
  login(payload: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/login`, payload).pipe(catchError(this.handleError));
  }

  // POST /api/v1/auth/forgot-password
  forgotPassword(payload: { email: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/forgot-password`, payload).pipe(catchError(this.handleError));
  }

  // POST /api/v1/auth/logout
  logout(): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/logout`, {}).pipe(catchError(this.handleError));
  }
}
