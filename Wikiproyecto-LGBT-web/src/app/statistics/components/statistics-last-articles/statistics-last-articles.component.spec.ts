import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsLastArticlesComponent } from './statistics-last-articles.component';

describe('StatisticsLastArticlesComponent', () => {
  let component: StatisticsLastArticlesComponent;
  let fixture: ComponentFixture<StatisticsLastArticlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsLastArticlesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatisticsLastArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
