import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { DialogService } from '../shared/dialog.service';

@Component({
  selector: 'app-water-billing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './water-billing.component.html',
  styleUrls: ['./water-billing.component.css']
})
export class WaterBillingComponent {
  // Forms
  fetchForm!: FormGroup;
  payForm!: FormGroup;

  // State
  fetching = false;
  paying = false;

  bill: any = null;          // result from fetch (stub returns one bill)
  selectedBill: any = null;  // set when user clicks "Pay this bill"

  payResult: any = null;
  payError = '';

  constructor(private fb: FormBuilder, private api: ApiService, private dialog: DialogService) {
    this.fetchForm = this.fb.group({
      paymentNumber: ['', Validators.required]
    });

    this.payForm = this.fb.group({
      billId: [{ value: '', disabled: true }, Validators.required],
      amountOption: ['full', Validators.required], // 'full' | '50' | '100' | '200' | 'custom'
      customAmount: [{ value: null, disabled: true }],
      nameOnCard: ['', [Validators.required, Validators.minLength(3)]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });

    // react to amount option changes
    this.payForm.get('amountOption')?.valueChanges.subscribe(() => this.onAmountOptionChange());
  }

  fetch() {
    this.fetching = true;
    this.bill = null; this.selectedBill = null; this.payResult = null; this.payError = '';

    const fallbackPaymentNumber = 'P-100001';
    const paymentRaw = (this.fetchForm.value.paymentNumber ?? '').toString().trim();
    const paymentNumber = paymentRaw || fallbackPaymentNumber;

    this.fetchForm.patchValue({ paymentNumber }, { emitEvent: false });

    this.api.getBill({ paymentNumber }).subscribe({
      next: (res) => { this.bill = res; this.fetching = false; },
      error: (err) => { this.bill = { error: err?.message || 'Fetch failed' }; this.fetching = false; }
    });
  }

  selectBill() {
    if (!this.bill || this.bill.error) return;
    this.selectedBill = this.bill;
    this.payForm.get('billId')?.enable();
    this.payForm.patchValue({ billId: this.selectedBill.id, amountOption: 'full', customAmount: null });
    this.onAmountOptionChange(); // reset validators for custom field
  }

  openPaymentHelp() {
    this.dialog.open({
      title: 'Where to find your payment number',
      message: 'Your payment number can be found on your bill as shown below:',
      imageUrl: 'assets/bill-call-out.jpeg'
    });
  }

  onAmountOptionChange() {
    const opt = this.payForm.get('amountOption')?.value;
    const customCtrl = this.payForm.get('customAmount');
    if (opt === 'custom') {
      customCtrl?.enable();
      const max = Number(this.selectedBill?.amountDue ?? 0);
      customCtrl?.setValidators([Validators.required, Validators.min(0.01), Validators.max(max || 999999)]);
    } else {
      customCtrl?.disable();
      customCtrl?.clearValidators();
      customCtrl?.setValue(null);
    }
    customCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  getPaymentAmount(): string {
    const opt = this.payForm.get('amountOption')?.value;
    if (!opt) return '0.00';
    
    if (opt === 'full') {
      return this.selectedBill?.amountDue?.toFixed(2) || '0.00';
    } else if (opt === 'custom') {
      const amount = this.payForm.get('customAmount')?.value;
      return amount ? amount.toFixed(2) : '0.00';
    } else {
      return opt;
    }
  }

  async pay() {
    if (!this.selectedBill) return;
    if (this.payForm.invalid) { 
      this.payForm.markAllAsTouched(); 
      return; 
    }

    const opt = this.payForm.get('amountOption')?.value as string;
    const due = Number(this.selectedBill.amountDue || 0);
    let amount = 0;

    if (opt === 'full') amount = due;
    else if (opt === 'custom') amount = Number(this.payForm.get('customAmount')?.value);
    else amount = Number(opt); // preset numeric like '50', '100', '200'

    if (!amount || isNaN(amount) || amount <= 0) {
      this.payError = 'Enter a valid amount.'; return;
    }
    if (amount > due) {
      this.payError = 'Amount cannot exceed the amount due.'; return;
    }

    this.paying = true; this.payError = ''; this.payResult = null;

    this.api.payBill({
  billId: this.selectedBill.id,
  amount,
  cardNumber: this.payForm.get('cardNumber')?.value
})
      .subscribe({
        next: async (res) => {
          this.payResult = res;
          this.paying = false;

          const receipt = res.receiptId || res.transactionId || res.id || 'TXN-' + Date.now().toString().slice(-6);

          await this.dialog.open({
            title: 'Payment Successful!',
            lines: [
              `receiptId: ${receipt}`,
              'Your payment has been processed successfully and the invoice will be sent to Mail.'
            ],
            buttons: [{ text: 'Close', role: 'primary' }]
          });

          // Reset forms
          this.bill = null;
          this.selectedBill = null;
          this.fetchForm.reset();
        },
        error: async (err) => {
          this.payError = err?.message || 'Payment failed';
          this.paying = false;

          await this.dialog.open({
            title: 'Payment failed',
            lines: [this.payError, 'Please try again or use a different method.'],
            buttons: [{ text: 'OK', role: 'primary' }]
          });
        }
      });
  }

  // (removed unused helper) 
}
