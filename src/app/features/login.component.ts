// src/app/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../app/shared/api.service'; // adjust if your path differs
import { finalize } from 'rxjs/operators';

type View = 'login' | 'register' | 'forgot';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  view: View = 'login';
  error = '';
  success = '';
  loading = false;

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private api: ApiService) {
    // init forms
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // <-- Add `name` here (backend requires it)
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    if (localStorage.getItem('loggedIn') === 'true') {
      this.router.navigateByUrl('/home');
    }
  }

  switch(v: View) {
    this.error = '';
    this.success = '';
    this.view = v;
  }

  // --------------------
  // Login -> call backend
  // --------------------
  onLogin() {
    if (this.loginForm.invalid) {
      this.error = 'Please enter a valid email and password.';
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.loginForm.value };
    this.loading = true;
    this.error = '';
    this.success = '';

    this.api.login(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          // common token locations: res.token | res.accessToken | res.data.token
          const token = res?.token || res?.accessToken || res?.data?.token || res?.data?.accessToken;
          if (token) {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('loggedIn', 'true');
          } else {
            // still mark logged in to allow demo flows if backend doesn't return a token
            localStorage.setItem('loggedIn', 'true');
          }

          this.success = 'Login successful';
          setTimeout(() => this.router.navigateByUrl('/home'), 200);
        },
        error: (err) => {
          this.error = err?.message || 'Login failed';
        }
      });
  }

  // --------------------
  // Register -> call backend (now sends `name`)
  // --------------------
  onRegister() {
    if (this.registerForm.invalid) {
      this.error = 'Please enter name, a valid email and a password (min 6 chars).';
      this.registerForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.registerForm.value }; // includes name now
    this.loading = true;
    this.error = '';
    this.success = '';

    this.api.register(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.success = 'Registration successful. You can now log in.';
          this.switch('login');
        },
        error: (err) => {
          this.error = err?.message || 'Registration failed';
        }
      });
  }

  // --------------------
  // Forgot password -> call backend
  // --------------------
  onForgot() {
    if (this.forgotForm.invalid) {
      this.error = 'Please enter a valid email.';
      this.forgotForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.forgotForm.value };
    this.loading = true;
    this.error = '';
    this.success = '';

    this.api.forgotPassword(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.success = 'Password reset link sent. Check your email.';
          this.switch('login');
        },
        error: (err) => {
          this.error = err?.message || 'Failed to send reset link';
        }
      });
  }
}
