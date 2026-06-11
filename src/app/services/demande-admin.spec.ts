import { TestBed } from '@angular/core/testing';

import { DemandeAdmin } from './demande-admin';

describe('DemandeAdmin', () => {
  let service: DemandeAdmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemandeAdmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
