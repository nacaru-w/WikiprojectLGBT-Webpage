import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsMainComponent } from './statistics-main.component';

describe('StatisticsMainComponent', () => {
  let component: StatisticsMainComponent;
  let fixture: ComponentFixture<StatisticsMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsMainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatisticsMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
