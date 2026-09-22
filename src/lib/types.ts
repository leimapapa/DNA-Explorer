export type EnginePhase = 'idle' | 'loading-r' | 'installing' | 'ready' | 'running' | 'error';

export interface AnalysisInput {
  markerCount: number;
  simulationCount: number;
  seed: number;
}

export interface ProfileRow {
  sample: string;
  locus: string;
  allele1: string;
  allele2: string;
}

export interface ImportedProfile {
  name: string;
  rows: ProfileRow[];
  samples: string[];
  loci: string[];
}

export type ComparisonMode = 'match' | 'siblings';

export interface EngineStatus {
  phase: EnginePhase;
  label: string;
  detail: string;
}

export interface LocusResult {
  locus: string;
  personA: string;
  personB: string;
  fullSiblingLr: number;
  halfSiblingLr: number;
}

export interface HypothesisResult {
  name: string;
  lr: number;
  log10Lr: number;
}

export interface IbdSegment {
  startMb: number;
  endMb: number;
  startCm: number;
  endCm: number;
  ibd: number;
}

export interface SimulationSummary {
  simulation: number;
  sharedPercent: number;
  ibd1Cm: number;
  ibd2Cm: number;
}

export interface IbdEstimate {
  k0: number;
  k1: number;
  k2: number;
  markersUsed: number;
}

export interface AnalysisResult {
  engine: {
    r: string;
    pedtools: string;
    forrel: string;
    ibdsim2: string;
  };
  input: AnalysisInput;
  hypotheses: HypothesisResult[];
  loci: LocusResult[];
  segments: IbdSegment[];
  simulations: SimulationSummary[];
  meanSharedPercent: number;
  elapsedMs: number;
  source?: 'synthetic' | 'imported';
  sourceLabel?: string;
  ibdEstimate?: IbdEstimate;
  mode?: ComparisonMode;
  posteriorPercent?: number;
  comparisonLabel?: string;
}
