import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsYearlyArticlesComponent } from './statistics-yearly-articles.component';

describe('StatisticsYearlyArticlesComponent', () => {
  let component: StatisticsYearlyArticlesComponent;
  let fixture: ComponentFixture<StatisticsYearlyArticlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsYearlyArticlesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatisticsYearlyArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
