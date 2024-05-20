import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
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
export class BlogMainComponent {
  lastThreeArticles: string[] = [];
  lastThreeTexts: string[] = [];

  constructor(private mediawikiService: MediawikiService) { }



}
