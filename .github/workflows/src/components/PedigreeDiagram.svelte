<script lang="ts">
  interface Props {
    activeHypothesis: string;
  }

  const { activeHypothesis }: Props = $props();
  const isUnrelated = $derived(activeHypothesis === 'Unrelated');
  const isHalf = $derived(activeHypothesis === 'Half siblings');
</script>

<section class="card pedigree-card" aria-labelledby="pedigree-title">
  <div class="card-heading">
    <div>
      <p class="eyebrow">Pedigree hypothesis</p>
      <h2 id="pedigree-title">{activeHypothesis}</h2>
    </div>
    <span class="package-tag">pedtools</span>
  </div>

  <svg viewBox="0 0 520 250" role="img" aria-label={`${activeHypothesis} pedigree for people A and B`}>
    {#if isUnrelated}
      <g class="ped-line muted">
        <line x1="125" y1="80" x2="125" y2="157" />
        <line x1="395" y1="80" x2="395" y2="157" />
      </g>
      <g class="founder">
        <rect x="101" y="38" width="48" height="48" rx="4" />
        <circle cx="395" cy="62" r="24" />
      </g>
    {:else}
      <g class="ped-line">
        <line x1="208" y1="62" x2="312" y2="62" />
        <line x1="260" y1="62" x2="260" y2="116" />
        <line x1={isHalf ? 260 : 125} y1="116" x2="395" y2="116" />
        <line x1="125" y1="116" x2="125" y2="157" />
        <line x1="395" y1="116" x2="395" y2="157" />
      </g>
      <g class="founder">
        <rect x="184" y="38" width="48" height="48" rx="4" />
        <circle cx="312" cy="62" r="24" />
      </g>
      {#if isHalf}
        <g class="founder secondary">
          <circle cx="125" cy="62" r="24" />
          <line class="ped-line" x1="149" y1="62" x2="208" y2="62" />
        </g>
      {/if}
    {/if}

    <g class="observed">
      <rect x="99" y="157" width="52" height="52" rx="5" />
      <circle cx="395" cy="183" r="26" />
      <text x="125" y="190">A</text>
      <text x="395" y="190">B</text>
    </g>
  </svg>

  <div class="legend">
    <span><i class="square"></i> Male</span>
    <span><i class="circle"></i> Female</span>
    <span><i class="observed-dot"></i> Genotyped</span>
  </div>
</section>

<style>
  .pedigree-card { min-height: 390px; }
  svg { width: 100%; margin: 4px 0 0; overflow: visible; }
  .ped-line line, line.ped-line { stroke: var(--line-strong); stroke-width: 3; }
  .ped-line.muted line { stroke-dasharray: 7 7; opacity: .5; }
  .founder rect, .founder circle { fill: var(--surface-raised); stroke: var(--line-strong); stroke-width: 3; }
  .founder.secondary { opacity: .7; }
  .observed rect, .observed circle { fill: color-mix(in srgb, var(--cyan) 20%, var(--surface)); stroke: var(--cyan); stroke-width: 3; }
  .observed text { fill: var(--text); font: 700 17px/1 var(--font-mono); text-anchor: middle; }
  .legend { display: flex; justify-content: center; gap: 24px; color: var(--muted); font-size: .78rem; }
  .legend span { display: flex; align-items: center; gap: 7px; }
  .legend i { display: inline-block; width: 10px; height: 10px; border: 1px solid var(--line-strong); }
  .legend .circle { border-radius: 50%; }
  .legend .observed-dot { border-radius: 50%; border-color: var(--cyan); background: var(--cyan-soft); }
</style>
