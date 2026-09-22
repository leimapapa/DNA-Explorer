<script lang="ts">
  import type { IbdEstimate } from '../lib/types';

  interface Props {
    estimate: IbdEstimate;
  }

  const { estimate }: Props = $props();
</script>

<section class="card observed-ibd-card" aria-labelledby="observed-ibd-title">
  <div class="card-heading">
    <div>
      <p class="eyebrow">Observed profiles</p>
      <h2 id="observed-ibd-title">Estimated IBD sharing</h2>
    </div>
    <span class="package-tag">forrel</span>
  </div>
  <p class="explanation">These estimates describe how much DNA the pair is likely to share identical-by-descent at a random locus. They are calculated from the imported profiles, not simulated chromosome segments.</p>
  <div class="ibd-stats">
    <div><strong>{(estimate.k0 * 100).toFixed(1)}%</strong><span>share 0 alleles IBD</span></div>
    <div class="likely"><strong>{(estimate.k1 * 100).toFixed(1)}%</strong><span>share 1 allele IBD</span></div>
    <div><strong>{(estimate.k2 * 100).toFixed(1)}%</strong><span>share 2 alleles IBD</span></div>
  </div>
  <p class="footnote">Estimated from {estimate.markersUsed} shared loci. IBD estimates are supporting context; the likelihood ratio remains the primary relationship comparison.</p>
</section>

<style>
  .observed-ibd-card { min-height: 390px; }
  .explanation { color: var(--muted); margin: -7px 0 20px; font-size: .8rem; line-height: 1.55; }
  .ibd-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin-top: 31px; background: var(--line); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .ibd-stats div { display: flex; flex-direction: column; gap: 6px; min-height: 105px; padding: 16px 13px; background: var(--surface-raised); }
  .ibd-stats strong { color: var(--text); font: 600 1.22rem var(--font-mono); }
  .ibd-stats span { color: var(--muted); font-size: .67rem; line-height: 1.3; }
  .ibd-stats .likely { background: var(--cyan-soft); }
  .ibd-stats .likely strong { color: var(--cyan); }
  .footnote { margin: 22px 0 0; color: var(--muted); font-size: .68rem; line-height: 1.5; }
  @media (max-width: 700px) {
    .ibd-stats { grid-template-columns: 1fr; }
    .ibd-stats div { min-height: auto; }
  }
</style>
