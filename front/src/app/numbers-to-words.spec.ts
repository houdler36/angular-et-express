import { TestBed } from '@angular/core/testing';

import { NumbersToWords } from './numbers-to-words';

describe('NumbersToWords', () => {
  let service: NumbersToWords;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NumbersToWords);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
