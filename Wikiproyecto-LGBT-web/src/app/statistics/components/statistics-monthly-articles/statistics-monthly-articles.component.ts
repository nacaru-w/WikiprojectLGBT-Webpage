import { Component, OnInit, inject, signal } from '@angular/core';

import { BaseChartDirective } from 'ng2-charts';
import { Chart } from 'chart.js/auto';

import { MediawikiService } from '../../../services/mediawiki.service';

import { lastYear, monthlyCountData, monthlyCountOptions, thisYear, threeYearsAgo, twoYearsAgo } from '../../chart_data/monthly-count-data';
import { palerColorForYear } from '../../chart_data/utils';

import { MonthlyOccurencesModel } from '../../models/monthly-occurences-model';

interface YearFilter {
  label: string;
  datasetIndex: number;
  visible: boolean;
  // Pale tint of this year's line colour, used as the switch's background.
  paleColor: string;
}

@Component({
  selector: 'app-statistics-monthly-articles',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './statistics-monthly-articles.component.html',
  styleUrl: './statistics-monthly-articles.component.scss'
})
export class StatisticsMonthlyArticlesComponent implements OnInit {

  private mediawikiService = inject(MediawikiService);

  monthlyArticlesChart: any;
  thisMonthArticleCount: number = 0;

  // One entry per dataset in monthlyCountData (index 0 = current year ... index 3 = three years ago).
  yearFilters = signal<YearFilter[]>([
    { label: thisYear, datasetIndex: 0, visible: true, paleColor: palerColorForYear(thisYear) },
    { label: lastYear, datasetIndex: 1, visible: true, paleColor: palerColorForYear(lastYear) },
    { label: twoYearsAgo, datasetIndex: 2, visible: true, paleColor: palerColorForYear(twoYearsAgo) },
    { label: threeYearsAgo, datasetIndex: 3, visible: true, paleColor: palerColorForYear(threeYearsAgo) },
  ]);

  ngOnInit(): void {
    this.createMonthlyArticlesChart();
    this.getMonthlyArticlesInfo();
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
  }

  toggleYear(datasetIndex: number): void {
    this.yearFilters.update(filters =>
      filters.map(filter =>
        filter.datasetIndex === datasetIndex ? { ...filter, visible: !filter.visible } : filter
      )
    );
    this.applyYearFilters();
  }

  private applyYearFilters(): void {
    if (!this.monthlyArticlesChart) {
      return;
    }
    for (const filter of this.yearFilters()) {
      this.monthlyArticlesChart.setDatasetVisibility(filter.datasetIndex, filter.visible);
    }
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
