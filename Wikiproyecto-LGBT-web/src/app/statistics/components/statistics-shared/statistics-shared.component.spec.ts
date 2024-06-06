import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsSharedComponent } from './statistics-shared.component';

describe('StatisticsSharedComponent', () => {
  let component: StatisticsSharedComponent;
  let fixture: ComponentFixture<StatisticsSharedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsSharedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatisticsSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
