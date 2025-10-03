import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { DialogService } from '../shared/dialog.service'; // ⬅️ added
import { Router } from '@angular/router';                 // ⬅️ added

@Component({
  selector: 'app-vaccination',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vaccination.component.html',
  styleUrls: ['./vaccination.component.css']
})
export class VaccinationComponent {
  // Forms
  searchForm!: FormGroup;
  eligibilityForm!: FormGroup;
  bookForm!: FormGroup;

  // UI state
  loading = false;     // search/eligibility loading (your existing flag)
  booking = false;     // booking loader (used for overlay)

  slots: any[] = [];
  selectedSlot: any = null;

  eligibilityChecked = false;
  eligibleFree: boolean | null = null;   // null = not checked, true/false afterwards
  payAtClinic = false;

  bookResult: any = null; // (kept for dev)
  bookError = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialog: DialogService, // ⬅️ added
    private router: Router         // ⬅️ added
  ) {
    this.searchForm = this.fb.group({
      vaccine: ['covid19'],
      postcode: ['', Validators.required],
      date: ['']
    });

    this.eligibilityForm = this.fb.group({
      medicare: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });

    this.bookForm = this.fb.group({
      slotId: [{ value: '', disabled: true }, Validators.required],
      name: ['', Validators.required],
      dob: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Step 1: search & select
  search() {
    if (this.searchForm.invalid) { this.searchForm.markAllAsTouched(); return; }
    this.loading = true;
    this.slots = [];
    this.selectedSlot = null;
    this.resetEligibility();
    this.bookResult = null;
    this.bookError = '';

    this.api.searchSlots({
  vaccine: this.searchForm.value.vaccine,
  postcode: this.searchForm.value.postcode,
  date: this.searchForm.value.date
}).subscribe({
      next: (res) => { this.slots = res || []; this.loading = false; },
      error: () => { this.slots = []; this.loading = false; }
    });
  }

  selectSlot(slot: any) {
    this.selectedSlot = slot;
    this.resetEligibility();
    this.bookForm.reset();
    this.bookForm.get('slotId')?.enable();
    this.bookForm.patchValue({ slotId: slot.id });
  }

  // Step 2: eligibility
  checkEligibility() {
    if (this.eligibilityForm.invalid) { this.eligibilityForm.markAllAsTouched(); return; }
    const { medicare } = this.eligibilityForm.value;
    const vaccine = this.searchForm.value.vaccine;
    this.api.checkEligibility({ medicare, vaccine }).subscribe(res => {
      this.eligibilityChecked = true;
      this.eligibleFree = !!res.eligible;
      this.payAtClinic = !this.eligibleFree;
    });
  }

  proceedPayAtClinic() {
    // user acknowledges clinic payment; allow booking
    this.eligibilityChecked = true;
    this.eligibleFree = false;
    this.payAtClinic = true;
  }

  // Step 3: book
  book() {
    if (this.bookForm.invalid) { this.bookForm.markAllAsTouched(); return; }
    if (!this.selectedSlot) return;

    this.booking = true;                // ⬅️ shows overlay spinner
    this.bookResult = null; this.bookError = '';

    const body = {
      slotId: this.selectedSlot.id,
      name: this.bookForm.get('name')?.value,
      dob: this.bookForm.get('dob')?.value,
      email: this.bookForm.get('email')?.value,
      payAtClinic: this.payAtClinic
    };

    this.api.bookVaccination(body).subscribe({
  next: async (res) => {
    this.bookResult = res;
    this.booking = false;

      const lines: string[] = [];
      lines.push(`Date: ${this.selectedSlot?.date} at ${this.selectedSlot?.time}`);
      lines.push(`Place: ${this.selectedSlot?.clinicName}`);

    if (this.payAtClinic) {
  // Non-eligible path
    lines.push('Payment: Payment required (not eligible for free vaccine). Please pay at the hospital on the day.');
    } else if (this.eligibleFree === true) {
  // Eligible path
    lines.push('Payment: Not required (eligible for free vaccination).');
    }

    // ✅ type-safe pick of whatever the backend sent
    const ref = this.pickRef(res);
    if (ref) lines.push(`Reference: ${ref}`);

    const email = this.bookForm.get('email')?.value;
    lines.push(`Certificate: Will be emailed to ${email} once AIR is updated.`);

    const choice = await this.dialog.open<string>({
      title: 'Booking confirmed 🎉',
      lines,
      buttons: [
        { text: 'Go to Home', value: 'home', role: 'primary' },
        { text: 'Close' }
      ]
    });
    if (choice === 'home') this.router.navigateByUrl('/home');
  },
  error: async (err) => {
    this.bookError = err?.message || 'Booking failed';
    this.booking = false;

    await this.dialog.open({
      title: 'Booking failed',
      lines: [this.bookError, 'Please check your details and try again.'],
      buttons: [{ text: 'OK', role: 'primary' }]
    });
  }
});

  }

  private resetEligibility() {
    this.eligibilityForm.reset();
    this.eligibilityChecked = false;
    this.eligibleFree = null;
    this.payAtClinic = false;
  }

  private pickRef(res: unknown): string | null {
  if (!res || typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;
  const keys = ['bookingRef', 'refId', 'bookingId', 'reference'] as const;

  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}
}
