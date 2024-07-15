import { TestBed } from '@angular/core/testing';

import { BarbaService } from './barba.service';

describe('BarbaService', () => {
  let service: BarbaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarbaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
