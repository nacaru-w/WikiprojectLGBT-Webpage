import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormMainComponent } from './form-main.component';

describe('FormMainComponent', () => {
  let component: FormMainComponent;
  let fixture: ComponentFixture<FormMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormMainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
