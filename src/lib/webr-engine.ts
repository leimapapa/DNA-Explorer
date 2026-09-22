import { ChannelType, WebR } from 'webr';
import type { AnalysisInput, AnalysisResult, ComparisonMode, EngineStatus, ImportedProfile } from './types';

const PACKAGE_NAMES = ['pedtools', 'forrel', 'ibdsim2', 'jsonlite'];

function assetUrl(path: string): string {
  return new URL(`${import.meta.env.BASE_URL}${path}`.replace(/\/+/g, '/'), window.location.origin).href;
}

function validateInput(input: AnalysisInput): void {
  if (!Number.isInteger(input.markerCount) || input.markerCount < 3 || input.markerCount > 30) {
    throw new Error('Marker count must be a whole number from 3 to 30.');
  }
  if (!Number.isInteger(input.simulationCount) || input.simulationCount < 1 || input.simulationCount > 250) {
    throw new Error('Simulation count must be a whole number from 1 to 250.');
  }
  if (!Number.isInteger(input.seed) || input.seed < 1 || input.seed > 2_147_483_647) {
    throw new Error('Seed must be a positive 32-bit integer.');
  }
}

export class WebRAnalysisEngine {
  private webR: WebR | null = null;
  private initialization: Promise<void> | null = null;
  private onStatus: (status: EngineStatus) => void;

  constructor(onStatus: (status: EngineStatus) => void) {
    this.onStatus = onStatus;
  }

  initialize(): Promise<void> {
    if (this.initialization) return this.initialization;
    this.initialization = this.initializeOnce();
    return this.initialization;
  }

  private async initializeOnce(): Promise<void> {
    this.onStatus({
      phase: 'loading-r',
      label: 'Starting WebR',
      detail: 'Loading the local R WebAssembly runtime.',
    });

    this.webR = new WebR({
      baseUrl: assetUrl('webr/'),
      repoUrl: 'https://repo.r-wasm.org/',
      channelType: ChannelType.PostMessage,
      interactive: false,
    });
    await this.webR.init();

    this.onStatus({
      phase: 'installing',
      label: 'Loading genetics packages',
      detail: 'First use downloads compiled pedtools, forrel, and ibdsim2 packages.',
    });
    await this.webR.installPackages(PACKAGE_NAMES);

    const response = await fetch(assetUrl('r/analysis.R'));
    if (!response.ok) throw new Error(`Could not load the R analysis script (${response.status}).`);
    await this.webR.evalRVoid(await response.text());

    this.onStatus({
      phase: 'ready',
      label: 'Scientific engine ready',
      detail: 'R and all three genetics packages are running locally in this browser tab.',
    });
  }

  async run(input: AnalysisInput): Promise<AnalysisResult> {
    validateInput(input);
    await this.initialize();
    if (!this.webR) throw new Error('WebR did not initialize.');

    this.onStatus({
      phase: 'running',
      label: 'Running test case',
      detail: `Calculating ${input.markerCount} markers and ${input.simulationCount} chromosome simulations.`,
    });

    const json = await this.webR.evalRString(
      `run_test_case(${input.markerCount}L, ${input.simulationCount}L, ${input.seed}L)`,
    );
    const result = JSON.parse(json) as AnalysisResult;

    this.onStatus({
      phase: 'ready',
      label: 'Analysis complete',
      detail: `Reproducible result from seed ${input.seed}. Change a control and run it again.`,
    });
    return result;
  }

  async runImportedProfile(profile: ImportedProfile, mode: ComparisonMode): Promise<AnalysisResult> {
    await this.initialize();
    if (!this.webR) throw new Error('WebR did not initialize.');

    this.onStatus({
      phase: 'running',
      label: 'Comparing observed profiles',
      detail: `Calculating relationship evidence across ${profile.loci.length} shared loci.`,
    });

    const profileJson = JSON.stringify(profile)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
    const json = await this.webR.evalRString(`run_profile_case("${profileJson}", "${mode}")`);
    const result = JSON.parse(json) as AnalysisResult;

    this.onStatus({
      phase: 'ready',
      label: 'Profile comparison complete',
      detail: `${profile.loci.length} observed loci compared locally in this browser tab.`,
    });
    return result;
  }

  close(): void {
    this.webR?.close();
    this.webR = null;
    this.initialization = null;
  }
}
