import { readFile } from 'node:fs/promises';
import { ChannelType, WebR } from 'webr';

const webR = new WebR({
  channelType: ChannelType.PostMessage,
  interactive: false,
  repoUrl: 'https://repo.r-wasm.org/',
});

try {
  console.log('Starting WebR…');
  await webR.init();
  console.log(`R ${webR.versionR}; installing scientific packages…`);
  await webR.installPackages(['pedtools', 'forrel', 'ibdsim2', 'jsonlite']);

  const source = await readFile(new URL('../public/r/analysis.R', import.meta.url), 'utf8');
  await webR.evalRVoid(source);
  const json = await webR.evalRString('run_test_case(6L, 3L, 1729L)');
  const result = JSON.parse(json);

  if (result.loci.length !== 6) throw new Error('Expected six marker results.');
  if (result.simulations.length !== 3) throw new Error('Expected three IBD simulations.');
  if (!result.segments.length) throw new Error('Expected chromosome segments.');
  if (!result.hypotheses.some((item) => item.name === 'Full siblings')) {
    throw new Error('The full-sibling hypothesis is missing.');
  }

  console.log(JSON.stringify({
    engine: result.engine,
    hypotheses: result.hypotheses,
    segmentCount: result.segments.length,
    meanSharedPercent: result.meanSharedPercent,
  }, null, 2));
  console.log('WebR smoke test passed.');
} finally {
  webR.close();
}
