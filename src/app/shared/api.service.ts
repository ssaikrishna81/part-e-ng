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
  // Vaccination
  // POST /api/v1/vaccinations/search
  searchSlots(payload: { vaccine?: string; postcode?: string; date?: string }): Observable<any[]> {
    return this.http
      .post<any>(`${API_BASE}/vaccinations/search`, payload)
      .pipe(map(r => (r && r.data) ? r.data : r), catchError(this.handleError));
  }

  // POST /api/v1/vaccinations/eligibility
  checkEligibility(payload: { medicare: string; vaccine: string }): Observable<any> {
    return this.http
      .post<any>(`${API_BASE}/vaccinations/eligibility`, payload)
      .pipe(catchError(this.handleError));
  }

  // POST /api/v1/vaccinations/book
  bookVaccination(payload: { slotId: string; name: string; dob: string; email: string; payAtClinic?: boolean }): Observable<any> {
    return this.http
      .post<any>(`${API_BASE}/vaccinations/book`, payload)
      .pipe(catchError(this.handleError));
  }

  // -------------------------
  // Opal topups
  // POST /api/v1/topups
  createTopup(payload: {
    cardNumber: string;
    securityCode: string;
    amount: number;
    topupType?: 'oneoff' | 'auto';
    receiptEmail?: string;
  }): Observable<any> {
    return this.http
      .post<any>(`${API_BASE}/topups`, payload)
      .pipe(catchError(this.handleError));
  }

  // -------------------------
  // Water
  // POST /api/v1/water/bill
  getBill(payload: { accountId: string }): Observable<any> {
    // backend expects POST body with accountId per your docs
    return this.http
      .post<any>(`${API_BASE}/water/bill`, payload)
      .pipe(catchError(this.handleError));
  }

  // POST /api/v1/water/pay
payBill(payload: { billId: string; amount: number; cardNumber: string }): Observable<any> {
  return this.http
    .post<any>(`${API_BASE}/water/pay`, payload)
    .pipe(catchError(this.handleError));
}

  // -------------------------
  // Auth (if needed)
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
