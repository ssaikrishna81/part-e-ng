// src/app/shared/api.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseLatency = 430;

  private latency(min = this.baseLatency, max = this.baseLatency + 420): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private respond<T>(data: T, min?: number, max?: number): Observable<T> {
    return of(data).pipe(delay(this.latency(min, max)));
  }

  private fail(message: string, min?: number, max?: number): Observable<never> {
    return throwError(() => new Error(message)).pipe(delay(this.latency(min, max)));
  }

  private randomId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  searchSlots(payload: { vaccine?: string; postcode?: string; date?: string }): Observable<any[]> {
    const base = payload.date ? new Date(payload.date) : new Date();
    return this.respond(
      Array.from({ length: 3 }).map((_, index) => {
        const slotDate = new Date(base);
        slotDate.setDate(slotDate.getDate() + index);
        return {
          id: this.randomId('VAC'),
          clinicName: `Community Clinic ${index + 1}`,
          date: slotDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: ['9:00 AM', '12:15 PM', '3:30 PM'][index % 3],
          available: 5 + index * 3
        };
      }),
      360,
      640
    );
  }

  checkEligibility(payload: { medicare: string; vaccine: string }): Observable<any> {
    const medicare = payload.medicare?.replace(/\D/g, '') || '';
    if (medicare.length !== 10) {
      return this.fail('Enter a 10 digit Medicare number.');
    }
    const eligible = Number(medicare.slice(-1)) % 2 === 0;
    return this.respond({ eligible, coPayment: eligible ? 0 : 25 }, 260, 520);
  }

  bookVaccination(payload: { slotId: string; name: string; dob: string; email: string; payAtClinic?: boolean }): Observable<any> {
    if (!payload.slotId) {
      return this.fail('Slot is required for booking.');
    }
    return this.respond({ bookingRef: this.randomId('VAC'), ...payload, createdAt: new Date().toISOString() }, 520, 900);
  }

  createTopup(payload: { cardNumber: string; securityCode: string; amount: number; topupType?: 'oneoff' | 'auto'; receiptEmail?: string }): Observable<any> {
    if (!payload.amount || payload.amount <= 0) {
      return this.fail('Top-up amount must be greater than zero.');
    }
    return this.respond({ refId: this.randomId('OPAL'), status: 'success', processedAt: new Date().toISOString() }, 480, 760);
  }

  getBill(payload: { paymentNumber: string }): Observable<any> {
    if (!payload.paymentNumber?.trim()) {
      return this.fail('Payment number is required.');
    }

    const amountDue = Number((Math.random() * 140 + 60).toFixed(2));
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 16);

    return this.respond({
      id: this.randomId('WTR'),
      period: 'Quarter 3 · 2025',
      amountDue,
      dueDate: dueDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      usageKl: 72 + Math.floor(Math.random() * 15),
      tariff: 'Residential'
    }, 400, 700);
  }

  payBill(payload: { billId: string; amount: number; cardNumber: string }): Observable<any> {
    if (!payload.billId) {
      return this.fail('Bill ID is required.');
    }
    if (!payload.amount || payload.amount <= 0) {
      return this.fail('Enter a valid payment amount.');
    }

    return this.respond({
      receiptId: this.randomId('RCPT'),
      status: 'paid',
      amount: Number(payload.amount.toFixed(2)),
      processedAt: new Date().toISOString(),
      cardLast4: payload.cardNumber?.slice(-4) || '0000'
    }, 640, 980);
  }

  register(payload: { name: string; email: string; password: string }): Observable<any> {
    if (!payload.name?.trim()) {
      return this.fail('Name is required.');
    }
    return this.respond({ status: 'created', user: { name: payload.name.trim(), email: payload.email.trim().toLowerCase() } }, 320, 520);
  }

  login(payload: { email: string; password: string }): Observable<any> {
    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      return this.fail('Email is required.');
    }
    return this.respond({ token: `mock-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`, user: { email } }, 280, 520);
  }

  forgotPassword(payload: { email: string }): Observable<any> {
    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      return this.fail('Please provide an email address.');
    }
    return this.respond({ status: 'email-sent', email }, 260, 500);
  }

  logout(): Observable<any> {
    return this.respond({ status: 'logged-out' }, 220, 440);
  }
}
