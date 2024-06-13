import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttributionComponent } from './attribution.component';

describe('AttributionComponent', () => {
  let component: AttributionComponent;
  let fixture: ComponentFixture<AttributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttributionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
