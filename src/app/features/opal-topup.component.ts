// src/app/features/opal-topup.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { DialogService } from '../shared/dialog.service';  // ⬅️ add this

@Component({
  selector: 'app-opal-topup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './opal-topup.component.html',
  styleUrls: ['./opal-topup.component.css']
})
export class OpalTopupComponent {
  form!: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private api: ApiService, private dialog: DialogService) {
    this.form = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      securityCode: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(6)]],

      amountOption: ['20', Validators.required],          // '10' | '20' | '50' | '100' | 'custom'
      customAmount: [{ value: null, disabled: true }],

      topupType: ['oneoff', Validators.required],         // 'oneoff' | 'auto'
      receipt: [false],
      receiptEmail: [{ value: '', disabled: true }, Validators.email],
    });

    // toggle custom amount
    this.form.get('amountOption')?.valueChanges.subscribe(v => {
      const c = this.form.get('customAmount');
      if (v === 'custom') {
        c?.enable(); c?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        c?.disable(); c?.clearValidators(); c?.setValue(null);
      }
      c?.updateValueAndValidity({ emitEvent: false });
    });

    // toggle receipt email
    this.form.get('receipt')?.valueChanges.subscribe(on => {
      const e = this.form.get('receiptEmail');
      if (on) e?.enable(); else { e?.disable(); e?.setValue(''); }
      e?.updateValueAndValidity({ emitEvent: false });
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    // derive final amount
    const opt = this.form.get('amountOption')?.value as string;
    const amount = opt === 'custom' ? Number(this.form.get('customAmount')?.value) : Number(opt);
    if (!amount || isNaN(amount) || amount <= 0) { this.error = 'Enter a valid amount.'; return; }

    this.loading = true; this.error = '';

    const payload = {
      cardNumber: this.form.value.cardNumber!,
      securityCode: this.form.value.securityCode!,
      amount,
      topupType: this.form.value.topupType!,
      receiptEmail: this.form.value.receipt ? this.form.value.receiptEmail! : undefined
    };

    this.api.createTopup(payload).subscribe({
      next: async (res) => {
        this.loading = false;

        const last4 = String(payload.cardNumber).slice(-4);

        await this.dialog.open({
          title: 'Top-up successful',
          lines: [
            `Ref: ${res.refId}`,
            `Status: ${res.status}`,
            `Card: •••• ${last4}`,
            `Amount: $${amount.toFixed(2)}`,
            'Activation: Tap on an Opal reader within 60 days to activate this top-up.',
            'Update time: Physical cards can take up to 60 minutes; Digital would be instantly updated.'
          ],
          buttons: [{ text: 'OK', role: 'primary' }]
        });
      },
      error: async (err) => {
        this.loading = false;
        this.error = err?.message || 'Request failed';

        await this.dialog.open({
          title: 'Top-up failed',
          lines: [this.error, 'Please check your details and try again.'],
          buttons: [{ text: 'OK', role: 'primary' }]
        });
      }
    });
  }
}
