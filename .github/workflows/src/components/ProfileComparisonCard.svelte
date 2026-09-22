<script lang="ts">
  import type { ImportedProfile, LocusResult } from '../lib/types';

  interface Props {
    profile: ImportedProfile;
    loci: LocusResult[];
  }

  const { profile, loci }: Props = $props();
  const sampleA = $derived(profile.samples[0]);
  const sampleB = $derived(profile.samples[1]);
  const rows = $derived(loci.map((locus) => {
    const allelesA = locus.personA.split('/');
    const allelesB = locus.personB.split('/');
    const remaining = [...allelesB];
    let shared = 0;
    for (const allele of allelesA) {
      const match = remaining.indexOf(allele);
      if (match >= 0) {
        shared += 1;
        remaining.splice(match, 1);
      }
    }
    return { ...locus, shared, exact: allelesA.sort().join('/') === allelesB.sort().join('/') };
  }));
  const exactCount = $derived(rows.filter((row) => row.exact).length);
  const sharedAlleles = $derived(rows.reduce((total, row) => total + row.shared, 0));
  const possibleAlleles = $derived(rows.length * 2);
  const sharePercent = $derived(possibleAlleles ? Math.round((sharedAlleles / possibleAlleles) * 100) : 0);
</script>

<section class="card profile-card" aria-labelledby="profile-title">
  <div class="card-heading">
    <div>
      <p class="eyebrow">Input profiles</p>
      <h2 id="profile-title">What was compared</h2>
    </div>
    <span class="package-tag">{profile.loci.length} loci</span>
  </div>

  <div class="profile-pair">
    <div class="sample-block sample-a"><span>A</span><strong>{sampleA}</strong><small>sample one</small></div>
    <div class="pair-connector"><i></i><span>marker by marker</span><i></i></div>
    <div class="sample-block sample-b"><span>B</span><strong>{sampleB}</strong><small>sample two</small></div>
  </div>

  <div class="quality-summary">
    <div><strong>{exactCount}/{rows.length}</strong><span>exact genotype matches</span></div>
    <div><strong>{sharedAlleles}/{possibleAlleles}</strong><span>alleles shared</span></div>
    <div class="quality-meter"><strong>{sharePercent}%</strong><span>observed allele overlap</span><i><b style={`width:${sharePercent}%`}></b></i></div>
  </div>

  <div class="profile-table" role="table" aria-label="Imported DNA profile comparison">
    <div class="profile-table-head" role="row"><span>Locus</span><span>{sampleA}</span><span>{sampleB}</span><span>Signal</span></div>
    {#each rows as row}
      <div class="profile-row" role="row">
        <strong>{row.locus}</strong>
        <code>{row.personA}</code>
        <code>{row.personB}</code>
        <span class:exact={row.exact} class="signal"><i></i>{row.exact ? 'exact' : `${row.shared}/2 shared`}</span>
      </div>
    {/each}
  </div>
  <p class="profile-footnote">Exact means both allele values match at that locus. The evidence calculation below uses the allele frequencies and relationship model, not this visual count alone.</p>
</section>

<style>
  .profile-card { grid-column: 1 / -1; }
  .profile-pair { display: grid; grid-template-columns: 1fr auto 1fr; gap: 13px; align-items: center; margin: 3px 0 18px; }
  .sample-block { display: grid; grid-template-columns: auto 1fr; column-gap: 9px; align-items: center; padding: 11px 13px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface-raised); }
  .sample-block > span { grid-row: 1 / 3; display: grid; place-items: center; width: 27px; height: 27px; border: 1px solid var(--cyan); border-radius: 50%; color: var(--cyan); font: .65rem var(--font-mono); }
  .sample-block strong { overflow: hidden; color: var(--text); font-size: .76rem; text-overflow: ellipsis; white-space: nowrap; }
  .sample-block small { color: var(--muted); font-size: .6rem; }
  .sample-b { border-color: rgba(244, 186, 91, .35); }
  .sample-b > span { border-color: var(--amber); color: var(--amber); }
  .pair-connector { display: flex; align-items: center; gap: 6px; color: var(--muted); font: .56rem var(--font-mono); white-space: nowrap; }
  .pair-connector i { display: block; width: 22px; border-top: 1px dashed var(--line-strong); }
  .quality-summary { display: grid; grid-template-columns: .8fr .8fr 1.4fr; gap: 1px; margin-bottom: 20px; border: 1px solid var(--line); border-radius: 7px; overflow: hidden; background: var(--line); }
  .quality-summary > div { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: var(--surface-raised); }
  .quality-summary strong { color: var(--text); font: 600 1.1rem var(--font-mono); }
  .quality-summary span { color: var(--muted); font-size: .62rem; }
  .quality-meter i { height: 4px; margin-top: 5px; overflow: hidden; border-radius: 4px; background: #1a2a39; }
  .quality-meter b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--cyan), var(--amber)); }
  .profile-table { overflow: hidden; border-top: 1px solid var(--line); }
  .profile-table-head, .profile-row { display: grid; grid-template-columns: 1fr 1.2fr 1.2fr 1fr; gap: 12px; align-items: center; }
  .profile-table-head { min-height: 31px; color: var(--muted); font: .57rem var(--font-mono); text-transform: uppercase; }
  .profile-row { min-height: 37px; border-top: 1px solid var(--line); font-size: .68rem; }
  .profile-row strong, .profile-row code { font-family: var(--font-mono); }
  .profile-row strong { color: var(--text); }
  .profile-row code { color: var(--muted); }
  .signal { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: .62rem; }
  .signal i { width: 6px; height: 6px; border-radius: 50%; background: var(--amber); }
  .signal.exact { color: #8ed8ad; }
  .signal.exact i { background: #61c48f; box-shadow: 0 0 6px #61c48f; }
  .profile-footnote { margin: 14px 0 0; color: var(--muted); font-size: .64rem; line-height: 1.45; }
  @media (max-width: 650px) {
    .profile-pair { grid-template-columns: 1fr; gap: 7px; }
    .pair-connector { justify-content: center; }
    .quality-summary { grid-template-columns: 1fr 1fr; }
    .quality-meter { grid-column: 1 / -1; }
    .profile-table-head, .profile-row { grid-template-columns: .8fr 1fr 1fr .9fr; gap: 6px; }
    .profile-table-head { font-size: .5rem; }
    .profile-row { font-size: .62rem; }
    .signal { font-size: .55rem; }
  }
</style>
