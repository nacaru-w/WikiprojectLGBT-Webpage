import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Chart } from 'chart.js/auto';

import { participantCountData, participantCountOptions } from '../../chart_data/participant-count-chat-data';
import { newParticipants2021, newParticipants2022, newParticipants2023, newParticipants2024, newParticipants2025 } from '../../chart_data/utils';

import { MediawikiService } from '../../../services/mediawiki.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-statistics-participants',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './statistics-participants.component.html',
  styleUrl: './statistics-participants.component.scss'
})
export class StatisticsParticipantsComponent implements OnInit {

  private mediawikiService = inject(MediawikiService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  totalParticipantCount: number = 0;

  participantCountChart: any;

  ngOnInit(): void {
    this.createParticipantCountChart();
    this.getParticipantInfo();
    // Re-translate the chart labels whenever the language changes at runtime.
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyChartLabels());
  }

  getParticipantInfo(): void {
    this.mediawikiService.getParticipantNumbers().subscribe(res => {
      const countNumbers = res;
      this.participantCountChart.data.datasets[0].data[0] = countNumbers.thisYearCount;

      const restOfTimeNumbers = countNumbers.totalCount - (newParticipants2023 + newParticipants2022 + newParticipants2021 + newParticipants2024 + newParticipants2025);
      this.participantCountChart.data.datasets[0].data[this.participantCountChart.data.datasets[0].data.length - 1] = restOfTimeNumbers;

      this.participantCountChart.update();

      this.animateTotalParticipantCount(countNumbers.totalCount);

    })
  }

  animateTotalParticipantCount(totalCount: number): void {
    const interval = setInterval(() => {
      this.totalParticipantCount++;
      if (this.totalParticipantCount == totalCount) {
        clearInterval(interval);
      }
    }, 10);
  }

  createParticipantCountChart() {
    const ctx = <HTMLCanvasElement>document.getElementById('participantCountChart');

    this.participantCountChart = new Chart(ctx, {
      type: 'doughnut',
      data: participantCountData,
      options: participantCountOptions,
    })

    this.applyChartLabels();
  }

  private applyChartLabels(): void {
    if (!this.participantCountChart) {
      return;
    }
    // First slice is the current year, last is "rest of time"; years stay as-is.
    this.participantCountChart.data.labels = [
      this.translate.instant('stats.chart.currentYear'),
      ...participantCountData.labels.slice(1, -1),
      this.translate.instant('stats.chart.restOfTime'),
    ];
    this.participantCountChart.update();
  }


}
