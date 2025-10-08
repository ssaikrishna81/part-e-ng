import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DialogHostComponent } from './shared/dialog-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DialogHostComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class App {}