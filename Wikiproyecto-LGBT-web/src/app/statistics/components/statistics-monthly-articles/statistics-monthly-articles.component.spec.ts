import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsMonthlyArticlesComponent } from './statistics-monthly-articles.component';

describe('StatisticsMonthlyArticlesComponent', () => {
  let component: StatisticsMonthlyArticlesComponent;
  let fixture: ComponentFixture<StatisticsMonthlyArticlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsMonthlyArticlesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatisticsMonthlyArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
