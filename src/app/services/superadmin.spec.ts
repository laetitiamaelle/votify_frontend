import { TestBed } from '@angular/core/testing';

import { Superadmin } from './superadmin';

describe('Superadmin', () => {
  let service: Superadmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Superadmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
