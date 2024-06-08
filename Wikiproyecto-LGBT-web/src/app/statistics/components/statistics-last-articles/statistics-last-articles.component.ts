import { Component, OnInit } from '@angular/core';
import { CardPreview } from '../../models/card-preview';

import { MediawikiService } from '../../../services/mediawiki.service';
import { CommonModule } from '@angular/common';

import { ChangeDetectorRef } from '@angular/core';

import { popAnimation } from '../../../animations';

@Component({
  selector: 'app-statistics-last-articles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics-last-articles.component.html',
  styleUrl: './statistics-last-articles.component.scss',
  animations: [popAnimation]
})
export class StatisticsLastArticlesComponent implements OnInit {
  cardDict: CardPreview = {};
  showSpinner: boolean = true;

  constructor(private mediawikiService: MediawikiService, private cdReF: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getLastArticlesInfo();
  }

  getLastArticlesInfo(): void {
    this.mediawikiService.getLGBTArticleList().subscribe(res => {
      this.buildDict(res.slice(-3));
      for (let article in this.cardDict) {
        this.assignExtracts(article);
        this.assignImages(article);
      }
      this.showSpinner = false;
    })
  }

  buildDict(array: string[]) {
    for (let title of array) {
      this.cardDict[title] = {
        extract: '',
        image: ''
      }
    }
  }

  assignExtracts(title: string): void {
    this.mediawikiService.getPageExtract(title).subscribe(res => {
      let croppedExtract = this.cropString(res, 35);
      let sanitisedCroppedExtract = this.removeRefnumbers(croppedExtract)
      this.cardDict[title].extract = sanitisedCroppedExtract;
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

  cropString(input: string, maxLength: number): string {
    const words = input.split(' ');
    const croppedWords = words.slice(0, maxLength);
    let croppedString = croppedWords.join(' ');
    if (words.length > maxLength) {
      croppedString += '...';
    }
    return croppedString
  }

  removeRefnumbers(text: string): string {
    const pattern = /\[\d+\]/g;
    let cleanedText = text.replace(pattern, '');
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    return cleanedText
  }

  isDictFull(dict: CardPreview): boolean {
    for (let item in dict) {
      if (!dict[item].extract || !dict[item].image) return false
    }
    return true
  }
}
