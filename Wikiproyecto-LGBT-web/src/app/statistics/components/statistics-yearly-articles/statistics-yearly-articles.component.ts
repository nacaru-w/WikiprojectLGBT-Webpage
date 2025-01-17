import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';

import { MediawikiService } from '../../../services/mediawiki.service';

import { articlesPerYearData, articlesPerYearOptions } from '../../chart_data/article-count-chart-data';

import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-statistics-yearly-articles',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './statistics-yearly-articles.component.html',
  styleUrl: './statistics-yearly-articles.component.scss',
})
export class StatisticsYearlyArticlesComponent implements OnInit {
  articlesArray: string[] = [];
  totalArticleCount: number = 0;
  yearlyArticlesChart: any;

  constructor(private mediawikiService: MediawikiService) { }

  ngOnInit(): void {
    this.createYearlyArticlesChart();
    this.getAllArticles();
  }

  createYearlyArticlesChart() {
    const ctx = <HTMLCanvasElement>document.getElementById('yearlyArticlesChart');

    this.yearlyArticlesChart = new Chart(ctx, {
      type: 'bar',
      data: articlesPerYearData,
      options: articlesPerYearOptions
    })
  }

  getAllArticles(): void {
    this.mediawikiService.getLGBTArticleList().subscribe(res => {
      const thisYearsArticles = this.getThisYearArticles(res);
      this.yearlyArticlesChart.data.datasets[0].data[4] = thisYearsArticles ? thisYearsArticles.length : 0;
      this.yearlyArticlesChart.update();
      this.animateTotalArticleCount(res.length);
    })
  }

  getThisYearArticles(array: string[]): string[] | null {
    const indexOfFirstArticle = array.indexOf("Sher Machado")
    if (indexOfFirstArticle == -1) {
      return null
    }
    return array.slice(indexOfFirstArticle);
  }

  animateTotalArticleCount(totalCount: number): void {
    const interval = setInterval(() => {
      if (this.totalArticleCount < totalCount - 100) {
        this.totalArticleCount += 10;
      } else {
        this.totalArticleCount++;
      }

      if (this.totalArticleCount == totalCount) {
        clearInterval(interval);
      }
    }, 1);
  }


}
