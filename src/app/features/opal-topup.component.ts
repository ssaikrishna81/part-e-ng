// src/app/features/opal-topup.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { DialogService } from '../shared/dialog.service';

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
  minAmount = 10; // Default to Basic Card
  currentBalance: number | null = null;
  checkingBalance = false;
  
  readonly MAX_BALANCE_BASIC = 250;
  readonly MAX_BALANCE_CONCESSION = 150;

  constructor(private fb: FormBuilder, private api: ApiService, private dialog: DialogService) {
    this.form = this.fb.group({
      cardType: ['basic', Validators.required], // 'basic' | 'concessions'
      opalCardNumber: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      opalSecurityCode: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(6)]],
      
      // Payment details (initially disabled until balance is checked)
      nameOnCard: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
      paymentCardNumber: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryDate: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)]],
      cvv: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^\d{3,4}$/)]],

      amountOption: [{ value: '20', disabled: true }, Validators.required],
      customAmount: [{ value: null, disabled: true }],

      topupType: ['oneoff', Validators.required],         // 'oneoff' | 'auto'
      receipt: [false],
      receiptEmail: [{ value: '', disabled: true }, Validators.email],
    });

    // Watch cardType changes to update minAmount and customAmount validator
    this.form.get('cardType')?.valueChanges.subscribe(type => {
      this.minAmount = type === 'concessions' ? 5 : 10;
      // If custom is selected, update its min validator
      if (this.form.get('amountOption')?.value === 'custom') {
        const c = this.form.get('customAmount');
        this.updateCustomAmountValidators(c);
      }
    });

    // toggle custom amount
    this.form.get('amountOption')?.valueChanges.subscribe(v => {
      const c = this.form.get('customAmount');
      if (v === 'custom') {
        c?.enable();
        this.updateCustomAmountValidators(c);
      } else {
        c?.disable();
        c?.clearValidators();
        c?.setValue(null);
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

  private updateCustomAmountValidators(control: any) {
    if (!control) return;
    
    control.setValidators([
      Validators.required,
      Validators.min(this.minAmount),
      (ctrl: any) => {
        const value = Number(ctrl.value);
        const maxTopup = this.getMaxTopupAmount();
        return value > maxTopup
          ? { maxTopup: { max: maxTopup, actual: value } }
          : null;
      }
    ]);
    control.updateValueAndValidity({ emitEvent: false });
  }

  canCheckBalance(): boolean {
    return Boolean(
      this.form.get('cardType')?.valid &&
      this.form.get('opalCardNumber')?.valid &&
      this.form.get('opalSecurityCode')?.valid
    );
  }

  getMaxBalance(): number {
    return this.form.get('cardType')?.value === 'basic' 
      ? this.MAX_BALANCE_BASIC 
      : this.MAX_BALANCE_CONCESSION;
  }

  getMaxTopupAmount(): number {
    if (this.currentBalance === null) return 0;
    return this.getMaxBalance() - this.currentBalance;
  }

  isNearMaxBalance(): boolean {
    if (this.currentBalance === null) return false;
    return this.currentBalance >= (this.getMaxBalance() * 0.9);
  }

  isAmountAllowed(amount: number): boolean {
    return amount <= this.getMaxTopupAmount();
  }

  async checkBalance() {
    if (!this.canCheckBalance()) return;

    this.checkingBalance = true;
    this.error = '';
    this.currentBalance = null;

    const payload = {
      cardType: this.form.get('cardType')?.value,
      cardNumber: this.form.get('opalCardNumber')?.value,
      securityCode: this.form.get('opalSecurityCode')?.value
    };

    try {
      const result = await this.api.checkOpalBalance(payload).toPromise();
      if (!result) {
        throw new Error('Failed to retrieve balance');
      }
      this.currentBalance = result.balance;
      
      // Enable payment fields if balance check was successful
      const maxTopup = this.getMaxTopupAmount();
      if (maxTopup > 0) {
        this.form.get('nameOnCard')?.enable();
        this.form.get('paymentCardNumber')?.enable();
        this.form.get('expiryDate')?.enable();
        this.form.get('cvv')?.enable();
        this.form.get('amountOption')?.enable();
        
        // Update amount options based on available balance
        const customAmountControl = this.form.get('customAmount');
        if (customAmountControl && this.form.get('amountOption')?.value === 'custom') {
          customAmountControl.enable();
          this.updateCustomAmountValidators(customAmountControl);
        }
      } else {
        this.error = 'Card has reached maximum allowed balance.';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to check balance';
      this.currentBalance = null;
    } finally {
      this.checkingBalance = false;
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.currentBalance === null) {
      this.error = 'Please check card balance first';
      return;
    }

    // derive final amount
    const opt = this.form.get('amountOption')?.value as string;
    let amount = opt === 'custom' ? Number(this.form.get('customAmount')?.value) : Number(opt);
    const cardType = this.form.get('cardType')?.value;
    const min = cardType === 'concessions' ? 5 : 10;
    
    if (!amount || isNaN(amount) || amount < min || amount > this.getMaxTopupAmount()) {
      this.error = `Enter an amount between $${min} and $${this.getMaxTopupAmount().toFixed(2)}.`;
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = {
      cardType: this.form.value.cardType!,
      opalCard: {
        cardNumber: this.form.value.opalCardNumber!,
        securityCode: this.form.value.opalSecurityCode!
      },
      payment: {
        nameOnCard: this.form.value.nameOnCard!,
        cardNumber: this.form.value.paymentCardNumber!,
        expiryDate: this.form.value.expiryDate!,
        cvv: this.form.value.cvv!
      },
      amount,
      topupType: this.form.value.topupType!,
      receiptEmail: this.form.value.receipt ? this.form.value.receiptEmail! : undefined
    };

    this.api.createTopup(payload).subscribe({
      next: async (res) => {
        this.loading = false;

        const last4 = String(payload.payment.cardNumber).slice(-4);

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
