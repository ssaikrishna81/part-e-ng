import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaterBilling } from './water-billing';

describe('WaterBilling', () => {
  let component: WaterBilling;
  let fixture: ComponentFixture<WaterBilling>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterBilling]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaterBilling);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
