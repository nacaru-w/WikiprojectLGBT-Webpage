import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgbAccordionModule, NgbCollapse, NgbScrollSpyModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { MediawikiService } from '../../../services/mediawiki.service';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { CardPreview } from '../../models/card-preview';

import { articlesPerYearData, articlesPerYearOptions } from '../../chart_data/article-count-chart-data';
import { participantCountData, participantCountOptions } from '../../chart_data/participant-count-chat-data';
import { monthlyCountData, monthlyCountOptions } from '../../chart_data/monthly-count-data';

import { newParticipants2021, newParticipants2022, newParticipants2023 } from '../../chart_data/utils';

import { MonthlyOccurencesModel } from '../../models/monthly-occurences-model';

@Component({
  selector: 'app-statistics-main',
  standalone: true,
  imports: [
    NgbAccordionModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbScrollSpyModule,
    NgbCollapse,
    BaseChartDirective,
    CommonModule,
  ],
  templateUrl: './statistics-main.component.html',
  styleUrl: './statistics-main.component.scss'
})
export class StatisticsMainComponent implements OnInit, AfterViewInit {
  totalParticipantCount: number = 0;
  totalArticleCount: number = 0;
  totalThisMonthArticleCount: number = 0;

  cardDict: CardPreview = {};

  articleCountChart: any;
  participantCountChart: any;
  monthlyCountChart: any;

  constructor(private mediawikiService: MediawikiService) {
  }

  ngOnInit(): void {
    try {
      this.createMonthlyCountChart();
      this.createArticleCountChart();
      this.createParticipantCountChart();
      this.getMonthlyArticleCountInfo();
      this.getParticipantInfo();
      this.getInfo();
    } catch (error) {
      console.log(error)
    }

  }

  ngAfterViewInit(): void {
  }

  showPageContent(title: string): void {
    this.mediawikiService.getPageContent(title).subscribe(res => {
    })
  }

  assignExtracts(title: string): void {
    this.mediawikiService.getPageExtract(title).subscribe(res => {
      let croppedExtract = this.cropString(res, 35);
      console.log(title, croppedExtract);
      this.cardDict[title].extract = croppedExtract;
      console.log(this.cardDict);
    })
  }

  assignImages(title: string): void {
    this.mediawikiService.getWikidataEntity(title).subscribe(res => {
      this.mediawikiService.getImageUrlFromWdEntity(res).subscribe(wdimage => {
        this.cardDict[title].image = wdimage ?
          `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file&wpvalue=${wdimage}`
          : "./../assets/imgs/Barba-wikiproyecto-lgbt.svg";
      })
    })
  }

  getThisYearArticles(array: string[]): string[] | null {
    const indexOfFirstArticle = array.indexOf("Tenderoni")
    if (indexOfFirstArticle == -1) {
      return null
    }
    return array.slice(indexOfFirstArticle);
  }

  getParticipantInfo(): void {
    this.mediawikiService.getParticipantNumbers().subscribe(res => {
      console.log(res);
      const countNumbers = res;
      this.participantCountChart.data.datasets[0].data[0] = countNumbers.thisYearCount;

      const restOfTimeNumbers = countNumbers.totalCount - (newParticipants2023 + newParticipants2022 + newParticipants2021);
      this.participantCountChart.data.datasets[0].data[this.participantCountChart.data.datasets[0].data.length - 1] = restOfTimeNumbers;

      this.participantCountChart.update();

      this.animateTotalParticipantCount(countNumbers.totalCount);

    })
  }

  getInfo(): void {
    this.mediawikiService.getLGBTArticleList().subscribe(res => {
      const thisYearsArticles = this.getThisYearArticles(res);
      this.buildDict(res.slice(-3));
      for (let article in this.cardDict) {
        this.assignExtracts(article);
        this.assignImages(article);
      }
      this.articleCountChart.data.datasets[0].data[0] = thisYearsArticles ? thisYearsArticles.length : 0;
      this.articleCountChart.update();

      this.animateTotalArticleCount(res.length);
    });
  }

  getMonthlyArticleCountInfo(): void {
    this.mediawikiService.getPageContent('Wikiproyecto:LGBT/Artículos creados').subscribe(res => {
      const target = "# [[Tenderoni]]";
      const targetIndex = res.indexOf(target);
      const newStr = res.substring(targetIndex);
      const monthObject = this.getMonthlyCountArray(newStr);

      let arrayWithData: number[] = [];

      Object.values(monthObject).forEach(value => {
        if (value > 0) {
          arrayWithData.push(value);
        }
      })

      this.animateTotalThisMonthArticleCount(arrayWithData[arrayWithData.length - 1]);

      this.monthlyCountChart.data.datasets[0].data = arrayWithData;
      this.monthlyCountChart.update();

    })
  }

  getMonthlyCountArray(data: string): MonthlyOccurencesModel {
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

  cropString(input: string, maxLength: number): string {
    const words = input.split(' ');
    const croppedWords = words.slice(0, maxLength);
    let croppedString = croppedWords.join(' ');
    if (words.length > maxLength) {
      croppedString += '...';
    }
    return croppedString
  }

  buildDict(array: string[]) {
    for (let title of array) {
      this.cardDict[title] = {
        extract: '',
        image: ''
      }
    }
  }



  createArticleCountChart() {
    const ctx = <HTMLCanvasElement>document.getElementById('articleCountChart');

    this.articleCountChart = new Chart(ctx, {
      type: 'bar',
      data: articlesPerYearData,
      options: articlesPerYearOptions
    })
  }

  createParticipantCountChart() {
    const ctx = <HTMLCanvasElement>document.getElementById('participantCountChart');

    this.participantCountChart = new Chart(ctx, {
      type: 'doughnut',
      data: participantCountData,
      options: participantCountOptions,
    })

  }

  createMonthlyCountChart() {
    const ctx = <HTMLCanvasElement>document.getElementById('monthlyCountChart');

    this.monthlyCountChart = new Chart(ctx, {
      type: 'line',
      data: monthlyCountData,
      options: monthlyCountOptions
    })
  }

  animateTotalArticleCount(totalCount: number): void {
    const interval = setInterval(() => {
      if (this.totalArticleCount < 2500) {
        this.totalArticleCount += 10;
      } else {
        this.totalArticleCount++;
      }

      if (this.totalArticleCount == totalCount) {
        clearInterval(interval);
      }
    }, 1);
  }

  animateTotalParticipantCount(totalCount: number): void {
    const interval = setInterval(() => {
      this.totalParticipantCount++;
      if (this.totalParticipantCount == totalCount) {
        clearInterval(interval);
      }
    }, 10);
  }

  animateTotalThisMonthArticleCount(totalCount: number): void {
    const interval = setInterval(() => {
      this.totalThisMonthArticleCount++;
      if (this.totalThisMonthArticleCount == totalCount) {
        clearInterval(interval);
      }
    }, 10);
  }

}
