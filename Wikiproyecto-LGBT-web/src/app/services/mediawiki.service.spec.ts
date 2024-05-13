import { TestBed } from '@angular/core/testing';

import { MediawikiService } from './mediawiki.service';

describe('MediawikiService', () => {
  let service: MediawikiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediawikiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
