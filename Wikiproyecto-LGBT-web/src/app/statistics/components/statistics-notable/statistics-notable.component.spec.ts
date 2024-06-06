import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsNotableComponent } from './statistics-notable.component';

describe('StatisticsNotableComponent', () => {
  let component: StatisticsNotableComponent;
  let fixture: ComponentFixture<StatisticsNotableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsNotableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatisticsNotableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
