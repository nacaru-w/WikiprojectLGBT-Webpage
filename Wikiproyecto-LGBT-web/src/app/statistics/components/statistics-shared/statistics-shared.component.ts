import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsMonthlyArticlesComponent } from '../statistics-monthly-articles/statistics-monthly-articles.component';
import { StatisticsNotableComponent } from '../statistics-notable/statistics-notable.component';
import { StatisticsYearlyArticlesComponent } from '../statistics-yearly-articles/statistics-yearly-articles.component';
import { StatisticsParticipantsComponent } from '../statistics-participants/statistics-participants.component';
import { StatisticsLastArticlesComponent } from '../statistics-last-articles/statistics-last-articles.component';

import { chartsSlideInOutAnimation } from '../../../animations';

@Component({
  selector: 'app-statistics-shared',
  standalone: true,
  imports: [
    StatisticsMonthlyArticlesComponent,
    StatisticsNotableComponent,
    StatisticsYearlyArticlesComponent,
    StatisticsParticipantsComponent,
    StatisticsLastArticlesComponent,
    CommonModule,
  ],
  templateUrl: './statistics-shared.component.html',
  styleUrl: './statistics-shared.component.scss',
  animations: [
    chartsSlideInOutAnimation
  ]
})
export class StatisticsSharedComponent {
  showMonthlyArticles: boolean = false;
  showYearlyArticles: boolean = false;
  showParticipants: boolean = false;
  showNotable: boolean = false;
  showLastArticles: boolean = false;

  showChart(chart: string) {
    this.hideAllCharts();
    setTimeout(() => {
      switch (chart) {
        case "yearly-articles":
          this.showYearlyArticles = true;
          break;
        case "monthly-articles":
          this.showMonthlyArticles = true;
          break;
        case "participants":
          this.showParticipants = true;
          break;
        case "notable":
          this.showNotable = true;
          break;
        case "last-articles":
          this.showLastArticles = true;
      }
    }, 300);
  }

  hideAllCharts() {
    this.showMonthlyArticles = false;
    this.showYearlyArticles = false;
    this.showParticipants = false;
    this.showNotable = false;
    this.showLastArticles = false;
  }

}
