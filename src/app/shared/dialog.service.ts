import { Injectable, signal } from '@angular/core';

export type DialogButtonRole = 'primary' | 'secondary';

export interface DialogButton<T = any> {
  text: string;
  value?: T;
  role?: DialogButtonRole;
}

export interface DialogConfig<T = any> {
  title: string;
  lines?: string[];          // simple multi-line content
  html?: string;             // optional rich content (sanitise if needed)
  buttons?: DialogButton<T>[]; // defaults to single “OK”
  closeOnBackdrop?: boolean; // default: true
}

type InternalState<T = any> = (DialogConfig<T> & {
  open: boolean;
  resolver?: (value?: T) => void;
}) | null;

@Injectable({ providedIn: 'root' })
export class DialogService {
  // Angular signal: holds current dialog state (or null when closed)
  state = signal<InternalState>(null);

  open<T = any>(config: DialogConfig<T>): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve) => {
      this.state.set({
        open: true,
        closeOnBackdrop: config.closeOnBackdrop ?? true,
        title: config.title,
        lines: config.lines,
        html: config.html,
        buttons: config.buttons,
        resolver: resolve,
      });
    });
  }

  close<T = any>(value?: T) {
    const s = this.state();
    s?.resolver?.(value);
    this.state.set(null);
  }
}
