import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { MediawikiService } from '../../../services/mediawiki.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-blog-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-main.component.html',
  styleUrl: './blog-main.component.scss'
})
export class BlogMainComponent implements OnInit {
  lastThreeArticles: string[] = [];
  lastThreeTexts: string[] = [];

  constructor(private mediawikiService: MediawikiService) { }

  ngOnInit(): void {
    this.getLastThreeLGBTArticles();
    this.getLastThreeLGBTExtracts();
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
