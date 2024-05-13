import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { MediawikiService } from '../../../services/mediawiki.service';

@Component({
  selector: 'app-blog-main',
  standalone: true,
  imports: [],
  templateUrl: './blog-main.component.html',
  styleUrl: './blog-main.component.scss'
})
export class BlogMainComponent implements OnInit {
  constructor(private mediawikiService: MediawikiService) { }

  ngOnInit(): void {
    this.getPageExtract("Samantha Hudson");
  }

  showPageContent(title: string) {
    this.mediawikiService.getPageContent(title).subscribe(res => {
      console.log(res);
    })
  }

  getPageExtract(title: string) {
    this.mediawikiService.getPageExtract(title).subscribe(res => {
      console.log(res);
    })
  }

}
