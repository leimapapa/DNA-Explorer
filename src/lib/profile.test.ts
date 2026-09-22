import { describe, expect, it } from 'vitest';
import { parseProfileTable } from './profile';

describe('profile import', () => {
  it('parses a complete two-sample STR table', () => {
    const profile = parseProfileTable([
      'sample,locus,allele_1,allele_2',
      'A,D3S1358,15,16',
      'A,TH01,6,9',
      'A,FGA,20,22',
      'B,D3S1358,15,15',
      'B,TH01,6,7',
      'B,FGA,21,22',
    ].join('\n'));

    expect(profile.samples).toEqual(['A', 'B']);
    expect(profile.loci).toEqual(['D3S1358', 'TH01', 'FGA']);
    expect(profile.rows[0].allele1).toBe('15');
  });

  it('rejects missing shared loci', () => {
    expect(() => parseProfileTable([
      'sample\tlocus\tallele_1\tallele_2',
      'A\tD3S1358\t15\t16',
      'A\tTH01\t6\t9',
      'A\tFGA\t20\t22',
      'B\tD3S1358\t15\t15',
      'B\tTH01\t6\t7',
    ].join('\n'))).toThrow('Missing FGA for sample B');
  });
});
