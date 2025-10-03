import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { DialogService } from '../shared/dialog.service'; // ⬅️ added

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
      accountId: ['', Validators.required]
    });

    this.payForm = this.fb.group({
      billId: [{ value: '', disabled: true }, Validators.required],
      amountOption: ['full', Validators.required], // 'full' | '50' | '100' | '200' | 'custom'
      customAmount: [{ value: null, disabled: true }],
      cardNumber: ['', Validators.required]
    });

    // react to amount option changes
    this.payForm.get('amountOption')?.valueChanges.subscribe(() => this.onAmountOptionChange());
  }

  fetch() {
    if (this.fetchForm.invalid) { this.fetchForm.markAllAsTouched(); return; }
    this.fetching = true;
    this.bill = null; this.selectedBill = null; this.payResult = null; this.payError = '';

    this.api.getBill({ accountId: this.fetchForm.value.accountId }).subscribe({
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

  async pay() {
    if (!this.selectedBill) return;
    if (this.payForm.invalid) { this.payForm.markAllAsTouched(); return; }

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

          // Compute remaining balance locally for UX
          const remaining = Math.max(0, due - amount);
          this.selectedBill.amountDue = remaining;

          // Try to show a receipt/transaction code if backend returns one
          const receipt = this.pickReceipt(res);

          const lines = [
            ...(receipt ? [`Receipt: ${receipt}`] : []),
            `Bill ID: ${this.selectedBill.id}`,
            `Amount paid: $${amount.toFixed(2)}`,
            `Remaining due: $${remaining.toFixed(2)}`,
            'Note: It may take a few minutes for your account to reflect this payment.'
          ];

          await this.dialog.open({
            title: 'Payment successful',
            lines,
            buttons: [{ text: 'Done', role: 'primary' }]
          });
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

  // Safely extract a receipt/transaction reference from any backend shape
  private pickReceipt(res: unknown): string | null {
    if (!res || typeof res !== 'object') return null;
    const r = res as Record<string, unknown>;
    const keys = ['receiptId', 'refId', 'reference', 'txnId', 'transactionId'] as const;
    for (const k of keys) {
      const v = r[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
    return null;
  }
}
