import { Component, OnInit, inject, signal } from '@angular/core';


import { MediawikiService } from '../../../services/mediawiki.service';

import { chartsSlideInOutAnimation, popAnimation } from '../../../animations/animations';

import { NotableArticles } from '../../models/notable-articles';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-statistics-notable',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './statistics-notable.component.html',
  styleUrl: './statistics-notable.component.scss',
  animations: [popAnimation, chartsSlideInOutAnimation]
})
export class StatisticsNotableComponent implements OnInit {
  private mediawikiService = inject(MediawikiService);

  isAPIDone = signal(false);

  notableArtDict: NotableArticles = { AB: [], AD: [] };

  ngOnInit(): void {
    this.getNotableArticlesinfo();
  }

  getNotableArticlesinfo(): void {
    this.mediawikiService.getPageContent('Wikiproyecto:LGBT/Artículos buenos y destacados').subscribe(res => {
      const splitString = "[[WP:SAB|Artículos y anexos buenos]]";
      const splitRes = res.split(splitString);
      const notableArticles = {
        AD: this.extractNotableElements(splitRes[0]),
        AB: this.extractNotableElements(splitRes[1])
      }
      this.notableArtDict = notableArticles;
      this.isAPIDone.set(true);
    })
  }

  extractNotableElements(string: string): string[] {
    const regex = /'''\[\[(.*?)\]\]'''/g;
    let match;
    const elements = [];

    while ((match = regex.exec(string)) !== null) {
      elements.push(match[1]);
    }

    return elements
  }

}
