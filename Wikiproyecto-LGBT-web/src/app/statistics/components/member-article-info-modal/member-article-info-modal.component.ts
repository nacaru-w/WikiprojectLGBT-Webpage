import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { NgbActiveModal, NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { Chart } from 'chart.js/auto';

import { ApiService } from '../../../services/api.service';
import { XtoolsService } from '../../../services/xtools.service';
import { XtoolsPageInfo } from '../../../services/models/xtools';
import { ArticleAuthor } from '../../../services/models/article-authorship';
import { MemberCreatedArticle } from '../../../services/models/member-creations';
import { LoadingBarbaComponent } from '../../../shared/components/loading-barba/loading-barba.component';

/** One slice of the authorship pie. */
interface PieSlice {
  label: string;
  pct: number;
  chars: number | null; // null when unknown (the "others" slice)
  color: string;
  username?: string;     // set for an individual member → links to their user page
  /** Set on the pooled "other members" slice: the sub-threshold members it groups. */
  members?: { username: string; pct: number; chars: number }[];
}

// Other members contributing more than this each get their own slice; the rest
// are pooled into "other members" (small edits).
const MEMBER_SLICE_THRESHOLD = 3;

const COLOUR_MINE = '#a97cfa';     // looked-up member (violet, our "selected" hue)
const COLOUR_MEMBERS = '#ff6fb7';  // pooled small members (pink)
const COLOUR_OTHERS = '#cccccc';   // everyone else (gray)
// Distinct hues for the other members that each clear the threshold.
const MEMBER_PALETTE = ['#3ac78f', '#b1efff', '#fff574', '#ffad5c', '#fa7c7c', '#20c997'];

/**
 * Modal for one article in the member-creations list. Shows the XTools/WikiWho
 * content-authorship split (by characters) reframed around the Wikiproyecto LGBT
 * members — the looked-up member, each other member above the threshold as its
 * own slice, the rest of the members pooled, and everyone else ("others") gray.
 *
 * Authorship is proxied by our backend (XTools' authorship route has no CORS);
 * the page facts come straight from XTools.
 */
@Component({
  selector: 'app-member-article-info-modal',
  standalone: true,
  imports: [DecimalPipe, DatePipe, TranslatePipe, NgbCollapse, LoadingBarbaComponent],
  templateUrl: './member-article-info-modal.component.html',
  styleUrl: './member-article-info-modal.component.scss',
})
export class MemberArticleInfoModalComponent implements OnInit, OnDestroy {
  // Set by the opener (StatisticsMemberCreationsComponent).
  article!: MemberCreatedArticle;
  member = '';
  members: string[] = [];

  readonly activeModal = inject(NgbActiveModal);
  private api = inject(ApiService);
  private xtools = inject(XtoolsService);
  private translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly info = signal<XtoolsPageInfo | null>(null);
  readonly slices = signal<PieSlice[] | null>(null);
  /** Whether the pooled "other members" breakdown is expanded in the legend. */
  readonly pooledExpanded = signal(false);

  private chart?: Chart<'doughnut', number[], any>;

  ngOnInit(): void {
    forkJoin({
      info: this.xtools.getPageInfo(this.article.title),
      authorship: this.api.getArticleAuthorship(this.article.title),
    }).subscribe({
      next: ({ info, authorship }) => {
        this.info.set(info);
        this.slices.set(this.buildSlices(authorship.authors));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  /** Link to a member's Spanish Wikipedia user page. */
  userUrl(username: string): string {
    return `https://es.wikipedia.org/wiki/Usuario:${encodeURIComponent(username.replace(/ /g, '_'))}`;
  }

  // Draw the chart once the canvas is in the DOM (after data loads).
  @ViewChild('pieCanvas') set pieCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref && this.slices() && !this.chart) {
      this.renderChart(ref.nativeElement);
    }
  }

  private buildSlices(authors: ArticleAuthor[]): PieSlice[] {
    const me = this.member.toLowerCase();
    const memberSet = new Set(this.members.map(m => m.toLowerCase()));
    let minePct = 0;
    let mineChars = 0;
    const bigMembers: ArticleAuthor[] = [];
    let pooledPct = 0;
    let pooledChars = 0;
    const pooled: { username: string; pct: number; chars: number }[] = [];
    for (const author of authors) {
      const name = author.username.toLowerCase();
      if (name === me) {
        minePct += author.percentage;
        mineChars += author.chars;
      } else if (memberSet.has(name)) {
        if (author.percentage > MEMBER_SLICE_THRESHOLD) {
          bigMembers.push(author);
        } else {
          pooledPct += author.percentage;
          pooledChars += author.chars;
          pooled.push({ username: author.username, pct: author.percentage, chars: author.chars });
        }
      }
    }
    bigMembers.sort((a, b) => b.percentage - a.percentage);

    const round = (n: number) => Math.round(n * 10) / 10;
    const slices: PieSlice[] = [
      { label: this.member, pct: round(minePct), chars: mineChars, color: COLOUR_MINE, username: this.member },
    ];
    bigMembers.forEach((author, i) => slices.push({
      label: author.username,
      pct: round(author.percentage),
      chars: author.chars,
      color: MEMBER_PALETTE[i % MEMBER_PALETTE.length],
      username: author.username,
    }));
    if (pooledPct > 0) {
      slices.push({
        label: this.translate.instant('stats.memberCreations.modal.otherMembers'),
        pct: round(pooledPct),
        chars: pooledChars,
        color: COLOUR_MEMBERS,
        members: pooled.sort((a, b) => b.pct - a.pct),
      });
    }
    const memberTotal = minePct + bigMembers.reduce((s, a) => s + a.percentage, 0) + pooledPct;
    slices.push({
      label: this.translate.instant('stats.memberCreations.modal.others'),
      pct: round(Math.max(0, 100 - memberTotal)),
      chars: null,
      color: COLOUR_OTHERS,
    });
    return slices;
  }

  private renderChart(canvas: HTMLCanvasElement): void {
    const slices = this.slices()!;
    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: slices.map(s => s.label),
        datasets: [{
          data: slices.map(s => s.pct),
          backgroundColor: slices.map(s => s.color),
          borderColor: '#000000',
          borderWidth: 2,
          borderRadius: 3,
        }],
      },
      options: {
        maintainAspectRatio: false,
        // Custom HTML legend below carries the labels + figures.
        plugins: { legend: { display: false } },
      },
    });
  }
}
