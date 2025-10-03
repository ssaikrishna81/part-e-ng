import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Landingredirectcomponent } from './landingredirectcomponent';

describe('Landingredirectcomponent', () => {
  let component: Landingredirectcomponent;
  let fixture: ComponentFixture<Landingredirectcomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landingredirectcomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Landingredirectcomponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
