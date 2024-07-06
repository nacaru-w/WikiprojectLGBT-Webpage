import { Component, OnInit } from '@angular/core';

import { BaseChartDirective } from 'ng2-charts';
import { Chart } from 'chart.js/auto';

import { MediawikiService } from '../../../services/mediawiki.service';

import { lastYear, monthlyCountData, monthlyCountOptions, thisYear, twoYearsAgo } from '../../chart_data/monthly-count-data';

import { MonthlyOccurencesModel } from '../../models/monthly-occurences-model';

@Component({
  selector: 'app-statistics-monthly-articles',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './statistics-monthly-articles.component.html',
  styleUrl: './statistics-monthly-articles.component.scss'
})
export class StatisticsMonthlyArticlesComponent implements OnInit {

  monthlyArticlesChart: any;
  thisMonthArticleCount: number = 0;

  constructor(private mediawikiService: MediawikiService) { }

  ngOnInit(): void {
    this.createMonthlyArticlesChart();
    this.getMonthlyArticlesInfo();
  }

  getMonthlyArticlesInfo(): void {
    this.mediawikiService.getPageContent('Wikiproyecto:LGBT/Artículos creados').subscribe(res => {
      const thisYearMonthObj = this.generateMonthlyCountObject(res, thisYear, 'Categoría:Wikiproyecto:LGBT');
      const lastYearMonthObj = this.generateMonthlyCountObject(res, lastYear, '=== Año en curso ===');
      const twoYearsAgoMonthObj = this.generateMonthlyCountObject(res, twoYearsAgo, `= ${lastYear}`)

      let thisYearDataArray: number[] = this.populateDataArray(thisYearMonthObj);
      let lastYearDataArray: number[] = this.populateDataArray(lastYearMonthObj);
      let twoYearsAgoDataArray: number[] = this.populateDataArray(twoYearsAgoMonthObj);

      this.animateThisMonthArticleCount(thisYearDataArray[thisYearDataArray.length - 1]);

      if (!this.isEndOfTheMonth()) {
        thisYearDataArray.pop()
      }

      this.monthlyArticlesChart.data.datasets[0].data = thisYearDataArray;
      this.monthlyArticlesChart.data.datasets[1].data = lastYearDataArray;
      this.monthlyArticlesChart.data.datasets[2].data = twoYearsAgoDataArray

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

  animateThisMonthArticleCount(totalCount: number): void {
    const interval = setInterval(() => {
      this.thisMonthArticleCount++;
      if (this.thisMonthArticleCount == totalCount) {
        clearInterval(interval);
      }
    }, 10);
  }

}
