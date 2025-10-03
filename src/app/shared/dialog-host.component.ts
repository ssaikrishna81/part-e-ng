import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-host.component.html',
  styleUrls: ['./dialog-host.component.css']
})
export class DialogHostComponent {
  svc = inject(DialogService);

  defaultButtons = [{ text: 'OK', value: 'ok', role: 'primary' as const }];

  onBackdropClick() {
    const s = this.svc.state();
    if (!s) return;
    if (s.closeOnBackdrop !== false) this.svc.close();
  }

  onButton(value: any) {
    this.svc.close(value);
  }
}
