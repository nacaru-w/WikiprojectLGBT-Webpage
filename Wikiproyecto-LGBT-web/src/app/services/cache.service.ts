import { Injectable } from '@angular/core';
import { MediawikiService } from './mediawiki.service';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  lastThreeArticles: string[] = [];
  lastThreeTexts: string[] = [];

  constructor(private mediawikiService: MediawikiService) {
    this.initialize();
  }

  initialize() {
    try {
      if (this.lastThreeArticles.length = 0) {
        this.getLastThreeLGBTArticles()
      }
      if (this.lastThreeArticles.length > 0) {
        this.getLastThreeLGBTExtracts()
      }
    } catch (error) {
      console.log(error)
    }
  }

  showPageContent(title: string): void {
    this.mediawikiService.getPageContent(title).subscribe(res => {
      console.log(res);
    })
  }

  assignExtracts(title: string): void {
    this.mediawikiService.getPageExtract(title).subscribe(res => {
      let croppedExtract = this.cropString(res, 35);
      this.lastThreeTexts.push(croppedExtract);
    })
  }

  getLastThreeLGBTArticles(): void {
    this.mediawikiService.getLGBTArticleList().subscribe(res => {
      this.lastThreeArticles = res.slice(-3);
    });
  }

  getLastThreeLGBTExtracts(): void {
    for (let article of this.lastThreeArticles) {
      this.assignExtracts(article);
    }
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

}
