import type { ImportedProfile, ProfileRow } from './types';

const requiredColumns = ['sample', 'locus', 'allele_1', 'allele_2'];

function splitLine(line: string, separator: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      quoted = !quoted;
    } else if (character === separator && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value.trim());
  return values;
}

export function parseProfileTable(text: string, name = 'Imported profile'): ImportedProfile {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('The profile file needs a header and at least one genotype row.');

  const separator = lines[0].includes('\t') ? '\t' : ',';
  const headers = splitLine(lines[0], separator).map((header) => header.toLowerCase().replace(/\s+/g, '_'));
  const indexes = requiredColumns.map((column) => headers.indexOf(column));
  if (indexes.some((index) => index < 0)) {
    throw new Error('Expected columns: sample, locus, allele_1, allele_2.');
  }

  const rows: ProfileRow[] = lines.slice(1).map((line, lineIndex) => {
    const values = splitLine(line, separator);
    const row = {
      sample: values[indexes[0]] ?? '',
      locus: values[indexes[1]] ?? '',
      allele1: values[indexes[2]] ?? '',
      allele2: values[indexes[3]] ?? '',
    };
    if (!row.sample || !row.locus || !row.allele1 || !row.allele2) {
      throw new Error(`Row ${lineIndex + 2} is missing a sample, locus, or allele.`);
    }
    return row;
  });

  const samples = [...new Set(rows.map((row) => row.sample))];
  const loci = [...new Set(rows.map((row) => row.locus))];
  if (samples.length !== 2) throw new Error(`The first version compares exactly two samples; found ${samples.length}.`);
  if (loci.length < 3) throw new Error('At least three shared loci are needed for a relationship comparison.');

  const keys = new Set(rows.map((row) => `${row.sample}\u0000${row.locus}`));
  if (keys.size !== rows.length) throw new Error('Each sample/locus combination must appear only once.');
  for (const sample of samples) {
    for (const locus of loci) {
      if (!keys.has(`${sample}\u0000${locus}`)) throw new Error(`Missing ${locus} for sample ${sample}.`);
    }
  }

  return { name, rows, samples, loci };
}