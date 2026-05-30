import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chart } from 'chart.js/auto';

import { MediawikiService } from '../../../services/mediawiki.service';

import { articlesPerYearData, articlesPerYearOptions } from '../../chart_data/article-count-chart-data';
import { applyChartTheme } from '../../chart_data/chart-theme';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-statistics-yearly-articles',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './statistics-yearly-articles.component.html',
  styleUrl: './statistics-yearly-articles.component.scss',
})
export class StatisticsYearlyArticlesComponent implements OnInit {
  private mediawikiService = inject(MediawikiService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  articlesArray: string[] = [];
  totalArticleCount: number = 0;
  yearlyArticlesChart: any;

  ngOnInit(): void {
    this.createYearlyArticlesChart();
    this.getAllArticles();
    // Re-translate the chart labels whenever the language changes at runtime.
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyChartLabels());
  }

  createYearlyArticlesChart() {
    const ctx = <HTMLCanvasElement>document.getElementById('yearlyArticlesChart');

    this.yearlyArticlesChart = new Chart(ctx, {
      type: 'bar',
      data: articlesPerYearData,
      options: applyChartTheme(articlesPerYearOptions)
    })

    this.applyChartLabels();
  }

  private applyChartLabels(): void {
    if (!this.yearlyArticlesChart) {
      return;
    }
    // Only the trailing "current year" label is translatable; the rest are years.
    this.yearlyArticlesChart.data.labels = [
      ...articlesPerYearData.labels.slice(0, -1),
      this.translate.instant('stats.chart.currentYear'),
    ];
    this.yearlyArticlesChart.update();
  }

  getAllArticles(): void {
    this.mediawikiService.getLGBTArticleList().subscribe(res => {
      const thisYearsArticles = this.getThisYearArticles(res);
      this.yearlyArticlesChart.data.datasets[0].data[5] = thisYearsArticles ? thisYearsArticles.length : 0;
      this.yearlyArticlesChart.update();
      this.animateTotalArticleCount(res.length);
    })
  }

  getThisYearArticles(array: string[]): string[] | null {
    const indexOfFirstArticle = array.indexOf("What it feels like for a girl (serie de televisión)")
    if (indexOfFirstArticle == -1) {
      return null
    }
    return array.slice(indexOfFirstArticle);
  }

  animateTotalArticleCount(totalCount: number): void {
    const interval = setInterval(() => {
      if (this.totalArticleCount < totalCount - 100) {
        this.totalArticleCount += 20;
      } else {
        this.totalArticleCount++;
      }

      if (this.totalArticleCount == totalCount) {
        clearInterval(interval);
      }
    }, 1);
  }


}
