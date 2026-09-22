<script lang="ts">
  import type { IbdSegment, SimulationSummary } from '../lib/types';
  import { clamp } from '../lib/format';

  interface Props {
    segments: IbdSegment[];
    simulations: SimulationSummary[];
    meanSharedPercent: number;
  }

  const { segments, simulations, meanSharedPercent }: Props = $props();
  const chromosomeEnd = $derived(Math.max(...segments.map((segment) => segment.endMb), 1));
  const sharedSegments = $derived(segments.filter((segment) => segment.ibd > 0));
  const validSimulations = $derived(simulations.filter((item) => Number.isFinite(item.sharedPercent)));
  const displayMeanSharedPercent = $derived(Number.isFinite(meanSharedPercent)
    ? meanSharedPercent
    : validSimulations.length
      ? validSimulations.reduce((total, item) => total + item.sharedPercent, 0) / validSimulations.length
      : 0);
  const minimum = $derived(Math.min(...simulations.map((item) => item.sharedPercent), 0));
  const maximum = $derived(Math.max(...simulations.map((item) => item.sharedPercent), 100));

  function left(segment: IbdSegment): number {
    return 100 * segment.startMb / chromosomeEnd;
  }

  function width(segment: IbdSegment): number {
    return Math.max(.3, 100 * (segment.endMb - segment.startMb) / chromosomeEnd);
  }
</script>

<section class="card chromosome-card" aria-labelledby="chromosome-title">
  <div class="card-heading">
    <div>
      <p class="eyebrow">Inheritance simulation</p>
      <h2 id="chromosome-title">Chromosome 1 · first simulation</h2>
    </div>
    <span class="package-tag">ibdsim2</span>
  </div>

  <div class="chromosome-labels"><span>0 Mb</span><span>{chromosomeEnd.toFixed(1)} Mb</span></div>
  <div class="chromosome" aria-label="Identical-by-descent segments on chromosome 1">
    <div class="centromere"></div>
    {#each segments as segment}
      <div
        class:ibd-one={segment.ibd === 1}
        class:ibd-two={segment.ibd === 2}
        class="segment"
        style={`left:${left(segment)}%;width:${width(segment)}%`}
        title={`${Number(segment.startMb).toFixed(2)}–${Number(segment.endMb).toFixed(1)} Mb · IBD${segment.ibd}`}
      ></div>
    {/each}
  </div>
  <div class="segment-legend">
    <span><i class="none"></i>IBD0</span><span><i class="one"></i>IBD1</span><span><i class="two"></i>IBD2</span>
  </div>

  <div class="sharing-summary">
    <div>
      <strong>{displayMeanSharedPercent.toFixed(1)}%</strong>
      <span>mean allele sharing</span>
    </div>
    <div>
      <strong>{sharedSegments.length}</strong>
      <span>shared regions in view</span>
    </div>
    <div>
      <strong>{simulations.length}</strong>
      <span>simulations</span>
    </div>
  </div>

  <div class="distribution" aria-label="Distribution of simulated allele sharing percentages">
    <div class="distribution-axis"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
    <div class="distribution-track">
      <div class="expected" title="Expected full-sibling sharing: 50%"></div>
      {#each validSimulations as item}
        <i style={`left:${clamp(item.sharedPercent, 0, 100)}%`} title={`Simulation ${item.simulation}: ${item.sharedPercent.toFixed(1)}%`}></i>
      {/each}
    </div>
    <p>Each dot is one meiosis simulation. The line marks the 50% expectation for full siblings.</p>
  </div>
</section>

<style>
  .chromosome-card { min-height: 390px; }
  .chromosome-labels { display: flex; justify-content: space-between; margin-top: 34px; color: var(--muted); font: .7rem var(--font-mono); }
  .chromosome { height: 34px; position: relative; overflow: hidden; border-radius: 17px; background: #152231; border: 1px solid var(--line); box-shadow: inset 0 0 14px #0008; }
  .centromere { position: absolute; left: 46%; top: 0; z-index: 2; width: 7%; height: 100%; background: linear-gradient(90deg, transparent, #071017 46%, #071017 54%, transparent); }
  .segment { position: absolute; height: 100%; top: 0; background: #28394b; border-right: 1px solid #101b26; }
  .segment.ibd-one { background: linear-gradient(180deg, #42d4e8, #168ba1); }
  .segment.ibd-two { background: linear-gradient(180deg, #f7ca72, #c68d28); }
  .segment-legend { display: flex; gap: 20px; margin-top: 13px; color: var(--muted); font-size: .72rem; }
  .segment-legend span { display: flex; align-items: center; gap: 6px; }
  .segment-legend i { width: 9px; height: 9px; border-radius: 2px; background: #28394b; }
  .segment-legend .one { background: var(--cyan); }
  .segment-legend .two { background: var(--amber); }
  .sharing-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin: 27px 0 22px; background: var(--line); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .sharing-summary div { display: flex; flex-direction: column; gap: 3px; padding: 13px; background: var(--surface-raised); }
  .sharing-summary strong { color: var(--text); font: 600 1.25rem var(--font-mono); }
  .sharing-summary span { color: var(--muted); font-size: .67rem; line-height: 1.25; }
  .distribution-axis { display: flex; justify-content: space-between; color: var(--muted); font: .61rem var(--font-mono); }
  .distribution-track { position: relative; height: 34px; margin: 5px 2px 0; border-top: 1px solid var(--line); }
  .distribution-track::after { content: ''; position: absolute; left: 0; right: 0; top: 12px; border-top: 1px solid var(--line); }
  .distribution-track i { position: absolute; z-index: 2; top: 8px; width: 7px; height: 7px; transform: translateX(-50%); border-radius: 50%; background: var(--cyan); box-shadow: 0 0 8px var(--cyan); opacity: .68; }
  .distribution-track .expected { position: absolute; z-index: 1; left: 50%; top: -6px; bottom: 9px; border-left: 1px dashed var(--amber); }
  .distribution p { margin: 0; color: var(--muted); font-size: .68rem; }
</style>
