import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsParticipantsComponent } from './statistics-participants.component';

describe('StatisticsParticipantsComponent', () => {
  let component: StatisticsParticipantsComponent;
  let fixture: ComponentFixture<StatisticsParticipantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsParticipantsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StatisticsParticipantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
