import { Injectable, signal } from '@angular/core';

export interface DialogConfig {
  title: string;
  message?: string;
  lines?: string[];
  html?: string;
  imageUrl?: string;
  closeOnBackdrop?: boolean;
  buttons?: Array<{
    text: string;
    value?: any;
    role?: 'primary' | 'secondary';
  }>;
}

type InternalState = (DialogConfig & {
  open: boolean;
  resolver?: (value?: any) => void;
}) | null;

@Injectable({ providedIn: 'root' })
export class DialogService {
  state = signal<InternalState>(null);

  open(config: DialogConfig): Promise<void> {
    return new Promise<void>((resolve) => {
      this.state.set({
        open: true,
        closeOnBackdrop: config.closeOnBackdrop ?? true,
        title: config.title,
        message: config.message,
        lines: config.lines,
        html: config.html,
        imageUrl: config.imageUrl,
        buttons: config.buttons,
        resolver: resolve,
      });
    });
  }

  close(value?: any) {
    const s = this.state();
    s?.resolver?.(value);
    this.state.set(null);
  }
}