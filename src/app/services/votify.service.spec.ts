import { TestBed } from '@angular/core/testing';

import { VotifyService } from './votify.service';

describe('VotifyService', () => {
  let service: VotifyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VotifyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
