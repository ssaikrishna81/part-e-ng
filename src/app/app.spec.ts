import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';

import { App } from './app.component';
import { AuthStateService } from './shared/auth-state.service';
import { ApiService } from './shared/api.service';
import { PortalService } from './shared/portal.service';

describe('App', () => {
  let authStateSubject: BehaviorSubject<boolean>;
  let authStub: AuthStateService;
  let logoutSpy: jasmine.Spy;

  beforeEach(async () => {
    authStateSubject = new BehaviorSubject<boolean>(false);
    authStub = {
      isLoggedIn$: authStateSubject.asObservable(),
      isLoggedIn: () => authStateSubject.value,
      markLoggedIn: (token?: string | null) => authStateSubject.next(true),
      markLoggedOut: () => authStateSubject.next(false)
    } as AuthStateService;

    logoutSpy = jasmine.createSpy('logout').and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, App],
      providers: [
        { provide: AuthStateService, useValue: authStub },
        {
          provide: ApiService,
          useValue: {
            logout: logoutSpy
          }
        },
        {
          provide: PortalService,
          useValue: {
            key$: new BehaviorSubject<string | null>(null).asObservable(),
            close: () => undefined,
            openService: () => undefined
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the ServiceUniverse brand', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('ServiceUniverse');
  });

  it('should show login button when logged out', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.login-btn')).toBeTruthy();
  });

  it('should show logout button when logged in', () => {
    authStateSubject.next(true);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logout-btn')).toBeTruthy();
  });
});
