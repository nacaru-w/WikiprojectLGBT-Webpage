import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Chart } from 'chart.js/auto';

import { MediawikiService } from '../../../services/mediawiki.service';

import { lastYear, monthlyCountData, monthlyCountOptions, thisYear, threeYearsAgo, twoYearsAgo } from '../../chart_data/monthly-count-data';

import { MonthlyOccurencesModel } from '../../models/monthly-occurences-model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

// Keys for the x-axis month labels (translated at chart creation). Distinct
// from the Spanish month tokens used to parse the wiki source in this file.
const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

@Component({
  selector: 'app-statistics-monthly-articles',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './statistics-monthly-articles.component.html',
  styleUrl: './statistics-monthly-articles.component.scss'
})
export class StatisticsMonthlyArticlesComponent implements OnInit {

  private mediawikiService = inject(MediawikiService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  monthlyArticlesChart: any;
  thisMonthArticleCount: number = 0;

  ngOnInit(): void {
    this.createMonthlyArticlesChart();
    this.getMonthlyArticlesInfo();
    // Re-translate the chart labels whenever the language changes at runtime.
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyChartLabels());
  }

  getMonthlyArticlesInfo(): void {
    this.mediawikiService.getPageContent('Wikiproyecto:LGBT/Artículos creados').subscribe(res => {
      const thisYearMonthObj = this.generateMonthlyCountObject(res, thisYear, 'Categoría:Wikiproyecto:LGBT');
      const lastYearMonthObj = this.generateMonthlyCountObject(res, lastYear, '=== Año en curso ===');
      const twoYearsAgoMonthObj = this.generateMonthlyCountObject(res, twoYearsAgo, `= ${lastYear}`);
      const threeYearsAgoMonthObj = this.generateMonthlyCountObject(res, threeYearsAgo, `= ${twoYearsAgo}`)

      let thisYearDataArray: number[] = this.populateDataArray(thisYearMonthObj);
      let lastYearDataArray: number[] = this.populateDataArray(lastYearMonthObj);
      let twoYearsAgoDataArray: number[] = this.populateDataArray(twoYearsAgoMonthObj);
      let threeYearsAgoDataArray: number[] = this.populateDataArray(threeYearsAgoMonthObj);

      this.animateThisMonthArticleCount(thisYearDataArray[thisYearDataArray.length - 1]);

      if (!this.isEndOfTheMonth()) {
        thisYearDataArray.pop()
      }

      this.monthlyArticlesChart.data.datasets[0].data = thisYearDataArray;
      this.monthlyArticlesChart.data.datasets[1].data = lastYearDataArray;
      this.monthlyArticlesChart.data.datasets[2].data = twoYearsAgoDataArray;
      this.monthlyArticlesChart.data.datasets[3].data = threeYearsAgoDataArray;

      this.monthlyArticlesChart.update();
    })
  }

  isEndOfTheMonth(): boolean {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth >= 20;
  }

  generateMonthlyCountObject(
    pageString: string,
    beginning: string,
    end: string
  ): MonthlyOccurencesModel {
    const regex: RegExp = new RegExp(String.raw`= ${beginning}[\s\S]*?(?=${end})`)
    let match: RegExpMatchArray | null = pageString.match(regex);
    let countObj = {};
    if (match) {
      countObj = this.getMonthlyArticleArray(match[0])
    }
    return countObj
  }

  populateDataArray(monthObject: MonthlyOccurencesModel) {
    let array: number[] = [];
    Object.values(monthObject).forEach(value => {
      if (value > 0) {
        array.push(value);
      }
    })
    return array;
  }

  getMonthlyArticleArray(data: string): MonthlyOccurencesModel {
    const monthsWithTemplateEnding = [
      "enero\)}}",
      "febrero\)}}",
      "marzo\)}}",
      "abril\)}}",
      "mayo\)}}",
      "junio\)}}",
      "julio\)}}",
      "agosto\)}}",
      "septiembre\)}}",
      "octubre\)}}",
      "noviembre\)}}",
      "diciembre\)}}"
    ];

    let counts: MonthlyOccurencesModel = {};

    monthsWithTemplateEnding.forEach(month => {
      const trimmedMonth = month.slice(0, -3);
      counts[trimmedMonth] = this.countOccurrences(data, month);
    })

    return counts;
  }

  countOccurrences(str: string, occurrence: string): number {
    const escapedOccurrence = occurrence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
    const matches = str.match(new RegExp(escapedOccurrence, "g"));
    return matches ? matches.length : 0;
  }

  createMonthlyArticlesChart() {
    const ctx = <HTMLCanvasElement>document.getElementById('monthlyArticlesChart');

    this.monthlyArticlesChart = new Chart(ctx, {
      type: 'line',
      data: monthlyCountData,
      options: monthlyCountOptions
    })

    this.applyChartLabels();
  }

  private applyChartLabels(): void {
    if (!this.monthlyArticlesChart) {
      return;
    }
    this.monthlyArticlesChart.data.labels = MONTH_KEYS.map(
      key => this.translate.instant(`stats.chart.months.${key}`)
    );
    this.monthlyArticlesChart.update();
  }

  animateThisMonthArticleCount(totalCount: number): void {
    const interval = setInterval(() => {
      this.thisMonthArticleCount++;
      if (this.thisMonthArticleCount == totalCount) {
        clearInterval(interval);
      }
    }, 10);
  }

}
