import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vaccination } from './vaccination';

describe('Vaccination', () => {
  let component: Vaccination;
  let fixture: ComponentFixture<Vaccination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vaccination]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vaccination);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
