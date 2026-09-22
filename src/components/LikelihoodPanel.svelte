<script lang="ts">
  import type { HypothesisResult, LocusResult } from '../lib/types';
  import { clamp, formatLog, formatLr } from '../lib/format';

  interface Props {
    hypotheses: HypothesisResult[];
    loci: LocusResult[];
    selected: string;
    onselect: (name: string) => void;
    mode?: 'match' | 'siblings';
  }

  const { hypotheses, loci, selected, onselect, mode = 'siblings' }: Props = $props();
  const sortedLoci = $derived([...loci].sort((a, b) => Math.abs(Math.log10(b.fullSiblingLr)) - Math.abs(Math.log10(a.fullSiblingLr))));
</script>

<section class="card likelihood-card" aria-labelledby="likelihood-title">
  <div class="card-heading">
    <div>
      <p class="eyebrow">Relationship test</p>
      <h2 id="likelihood-title">Likelihood ratios</h2>
    </div>
    <span class="package-tag">forrel</span>
  </div>

  <p class="explanation">This is the main comparison: how much better does the selected explanation fit the marker data than the alternative? A likelihood ratio is evidence strength, not a raw probability.</p>

  <div class="hypotheses">
    {#each hypotheses as hypothesis}
      <button class:active={selected === hypothesis.name} onclick={() => onselect(hypothesis.name)}>
        <span>{hypothesis.name}</span>
        <strong>{formatLr(hypothesis.lr)}</strong>
        <small>LR · log₁₀ {formatLog(hypothesis.log10Lr)}</small>
      </button>
    {/each}
  </div>

  <div class="table-heading"><h3>Marker contribution</h3><span>{mode === 'match' ? 'same-source evidence per locus' : 'sibling evidence per locus'}</span></div>
  <div class="locus-table">
    {#each sortedLoci as locus}
      <div class="locus-row">
        <span class="locus-name">{locus.locus}</span>
        <span class="genotype">{locus.personA} · {locus.personB}</span>
        <div class="bar-track" title={`LR ${formatLr(locus.fullSiblingLr)}`}>
          <i
            class:negative={locus.fullSiblingLr < 1}
            style={`width:${clamp(18 + Math.abs(Math.log10(locus.fullSiblingLr)) * 45, 4, 100)}%`}
          ></i>
        </div>
        <strong>{formatLog(Math.log10(locus.fullSiblingLr))}</strong>
      </div>
    {/each}
  </div>
</section>

<style>
  .likelihood-card { grid-column: 1 / -1; }
  .explanation { color: var(--muted); margin: -7px 0 18px; font-size: .8rem; }
  .hypotheses { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .hypotheses button { display: flex; flex-direction: column; text-align: left; padding: 15px; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); background: var(--surface-raised); cursor: pointer; transition: 150ms ease; }
  .hypotheses button:hover, .hypotheses button.active { border-color: var(--cyan); background: var(--cyan-soft); }
  .hypotheses button.active { box-shadow: inset 3px 0 var(--cyan); }
  .hypotheses span { font-size: .73rem; }
  .hypotheses strong { margin-top: 8px; color: var(--text); font: 600 1.35rem var(--font-mono); }
  .hypotheses small { margin-top: 2px; font: .65rem var(--font-mono); }
  .table-heading { display: flex; align-items: baseline; justify-content: space-between; margin-top: 26px; }
  .table-heading h3 { margin: 0; font-size: .86rem; }
  .table-heading span { color: var(--muted); font-size: .65rem; }
  .locus-table { margin-top: 8px; max-height: 260px; overflow: auto; border-top: 1px solid var(--line); }
  .locus-row { display: grid; grid-template-columns: 64px 120px 1fr 50px; align-items: center; gap: 14px; min-height: 38px; border-bottom: 1px solid var(--line); font-size: .72rem; }
  .locus-name, .genotype, .locus-row > strong { font-family: var(--font-mono); }
  .genotype { color: var(--muted); }
  .locus-row > strong { color: var(--text); text-align: right; }
  .bar-track { height: 5px; background: #1a2a39; border-radius: 3px; overflow: hidden; }
  .bar-track i { display: block; height: 100%; background: var(--cyan); border-radius: inherit; }
  .bar-track i.negative { background: var(--rose); }
  @media (max-width: 700px) {
    .hypotheses { grid-template-columns: 1fr; }
    .locus-row { grid-template-columns: 54px 96px 1fr 42px; gap: 8px; }
  }
</style>
