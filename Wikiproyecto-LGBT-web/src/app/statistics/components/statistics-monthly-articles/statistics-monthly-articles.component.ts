import { Component, OnInit } from '@angular/core';

import { BaseChartDirective } from 'ng2-charts';
import { Chart } from 'chart.js/auto';

import { MediawikiService } from '../../../services/mediawiki.service';

import { monthlyCountData, monthlyCountOptions } from '../../chart_data/monthly-count-data';

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
      const target = "# [[Tenderoni]]";
      const targetIndex = res.indexOf(target);
      const newStr = res.substring(targetIndex);
      const monthObject = this.getMonthlyArticleArray(newStr);

      let arrayWithData: number[] = [];

      Object.values(monthObject).forEach(value => {
        if (value > 0) {
          arrayWithData.push(value);
        }
      })

      this.animateThisMonthArticleCount(arrayWithData[arrayWithData.length - 1]);

      this.monthlyArticlesChart.data.datasets[0].data = arrayWithData;
      this.monthlyArticlesChart.update();

    })
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
      "agosto\)}}"
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

  getThisYearArticles(array: string[]): string[] | null {
    const indexOfFirstArticle = array.indexOf("Tenderoni")
    if (indexOfFirstArticle == -1) {
      return null
    }
    return array.slice(indexOfFirstArticle);
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
