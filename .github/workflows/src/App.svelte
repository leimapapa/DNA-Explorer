<script lang="ts">
  import { onDestroy } from 'svelte';
  import LikelihoodPanel from './components/LikelihoodPanel.svelte';
  import ObservedIbdPanel from './components/ObservedIbdPanel.svelte';
  import ProfileComparisonCard from './components/ProfileComparisonCard.svelte';
  import { parseProfileTable } from './lib/profile';
  import type { AnalysisResult, ComparisonMode, EngineStatus, ImportedProfile } from './lib/types';
  import { formatLr } from './lib/format';
  import { WebRAnalysisEngine } from './lib/webr-engine';

  const initialStatus: EngineStatus = {
    phase: 'idle',
    label: 'Ready to initialize',
    detail: 'Start the test case to load R and run the analysis in your browser.',
  };

  let status = $state<EngineStatus>(initialStatus);
  let result = $state<AnalysisResult | null>(null);
  let profile = $state<ImportedProfile | null>(null);
  let mode = $state<ComparisonMode>('match');
  let error = $state('');
  let selectedHypothesis = $state('Full siblings');
  let running = $derived(['loading-r', 'installing', 'running'].includes(status.phase));
  let progress = $derived(status.phase === 'loading-r' ? 22 : status.phase === 'installing' ? 58 : status.phase === 'running' ? 84 : status.phase === 'ready' ? 100 : 0);
  let strongestHypothesis = $derived(result ? [...result.hypotheses].sort((a, b) => b.log10Lr - a.log10Lr)[0] : null);

  const engine = new WebRAnalysisEngine((next) => {
    status = next;
  });

  async function runAnalysis(): Promise<void> {
    error = '';
    try {
      if (!profile) throw new Error('Load two profiles or choose a bundled example first.');
      result = await engine.runImportedProfile(profile, mode);
      selectedHypothesis = result.hypotheses[0]?.name ?? '';
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
      status = {
        phase: 'error',
        label: 'Analysis stopped',
        detail: 'Review the error, then reload the page to restart the WebR session.',
      };
    }
  }

  async function loadProfileText(text: string, name: string): Promise<void> {
    error = '';
    try {
      profile = parseProfileTable(text, name);
      result = null;
      selectedHypothesis = 'Full siblings';
      status = { phase: 'idle', label: 'Profile ready', detail: `${profile.samples.join(' and ')} loaded across ${profile.loci.length} shared loci.` };
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
      status = { phase: 'error', label: 'Profile not loaded', detail: 'Check the file format and try again.' };
    }
  }

  async function loadExample(nextMode: ComparisonMode): Promise<void> {
    mode = nextMode;
    const filename = nextMode === 'match' ? 'match-example.csv' : 'siblings-example.csv';
    const response = await fetch(`${import.meta.env.BASE_URL}data/${filename}`);
    if (!response.ok) throw new Error('Could not load the bundled example.');
    await loadProfileText(await response.text(), nextMode === 'match' ? 'Example 1 · same-sample match' : 'Example 2 · sibling relationship');
  }

  async function handleProfileFile(event: Event): Promise<void> {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (file) await loadProfileText(await file.text(), file.name);
  }

  onDestroy(() => engine.close());
</script>

<svelte:head>
  <meta name="theme-color" content="#081018" />
</svelte:head>

<header class="app-header">
  <a class="brand" href="#top" aria-label="DNA Evidence Explorer home">
    <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
    <span><strong>DNA Evidence Explorer</strong><small>RESEARCH PROOF OF CONCEPT</small></span>
  </a>
  <div class="privacy"><i></i> LOCAL BROWSER SESSION</div>
</header>

<main id="top">
  <section class="comparison-intro">
    <p class="eyebrow">Local STR profile comparison</p>
    <h1>Compare two DNA profiles.</h1>
    <p>Load a standard CSV or TSV STR table, choose the comparison question, and inspect marker-level evidence without uploading the profiles.</p>
  </section>

  <section class="workbench">
    <aside class="control-panel">
      <div class="panel-title">
        <div><p class="eyebrow">DNA comparison</p><h2>{profile ? profile.name : 'Choose an example'}</h2></div>
        <span class="case-id">{mode === 'match' ? 'MATCH' : 'SIBLINGS'}</span>
      </div>

      <div class="mode-switch" aria-label="Choose profile source">
        <button class:active={mode === 'match'} onclick={() => loadExample('match')} disabled={running}>Example 1 · match</button>
        <button class:active={mode === 'siblings'} onclick={() => loadExample('siblings')} disabled={running}>Example 2 · siblings</button>
      </div>

      <div class="file-import">
        <label class="file-button"><span aria-hidden="true">↑</span> Load CSV / TSV<input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" onchange={handleProfileFile} disabled={running} /></label>
        <p>Required columns: <code>sample, locus, allele_1, allele_2</code>. Two samples, with the same loci in each.</p>
      </div>

      <div class="question-callout">
        <span class="callout-number">01</span>
        <div><strong>{mode === 'match' ? 'Question to answer' : 'Question to answer'}</strong><p>{mode === 'match' ? 'Do these two profiles provide evidence that they came from the same person?' : 'Do these two profiles provide evidence for a full-sibling relationship?'}</p></div>
      </div>

      <div class="case-description">
        <span>A</span><i></i><span>B</span>
        <p>{profile ? `${profile.samples.join(' and ')} are compared across ${profile.loci.length} shared STR loci.` : 'Choose an example or load your own permitted STR profile.'}</p>
      </div>

      <button class="run-button" onclick={runAnalysis} disabled={running}>
        {#if running}<span class="spinner"></span> {status.label}{:else}<span aria-hidden="true">▶</span> {result ? 'Compare again' : 'Compare profiles'}{/if}
      </button>

      <div class:error={status.phase === 'error'} class="engine-status" aria-live="polite">
        <div><i class:active={status.phase !== 'idle'}></i><strong>{status.label}</strong><span>{progress}%</span></div>
        <div class="progress"><i style={`width:${progress}%`}></i></div>
        <p>{status.detail}</p>
        {#if error}<pre>{error}</pre>{/if}
      </div>

      <details>
        <summary>What runs locally?</summary>
        <p>WebR executes R inside a Web Worker. The pedigree, LR, and IBD calculations stay in this browser tab. Package binaries are fetched from the official WebR repository.</p>
      </details>
    </aside>

    <div class="results">
      {#if result}
        <section class="insight-summary" aria-labelledby="insight-title">
          <div class="insight-kicker"><span class="insight-dot"></span> Plain-language readout</div>
          <div class="insight-body">
            <div>
              <h2 id="insight-title"><em>{strongestHypothesis?.name}</em> is the stronger explanation.</h2>
              <p>The likelihood ratio is <strong>{strongestHypothesis ? formatLr(strongestHypothesis.lr) : '—'}</strong>. This compares the observed marker data with the alternative explanation; it is not a raw probability.</p>
            </div>
            <div class="insight-next"><span>50/50 prior model</span><strong>{result.posteriorPercent?.toFixed(2)}% posterior support</strong><small>This percent is conditional on equal prior odds between the two displayed explanations.</small></div>
          </div>
        </section>
        <div class="result-meta">
          <span>Completed in {Math.round(result.elapsedMs).toLocaleString()} ms</span>
          <span>{result.sourceLabel}</span>
          <span>{result.engine.r}</span>
        </div>
        <div class="visual-grid">
          {#if profile}
            <ProfileComparisonCard profile={profile} loci={result.loci} />
          {/if}
          {#if result.ibdEstimate}
            <ObservedIbdPanel estimate={result.ibdEstimate} />
          {/if}
          <LikelihoodPanel hypotheses={result.hypotheses} loci={result.loci} selected={selectedHypothesis} onselect={(name) => selectedHypothesis = name} mode={result.mode} />
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-visual" aria-hidden="true">
            <span>A</span><i></i><span>B</span>
            <div class="chromosome-placeholder"><b></b><b></b><b></b></div>
          </div>
          <p class="eyebrow">Awaiting analysis</p>
          <h2>The evidence trail will appear here.</h2>
          <p>Choose one of the examples or load two permitted STR profiles, then compare their markers locally. The first start is slower because the R runtime and scientific packages are downloaded.</p>
        </div>
      {/if}
    </div>
  </section>

  <section class="method-note">
    <div><p class="eyebrow">Method boundary</p><h2>A research demonstrator, not a forensic conclusion.</h2></div>
    <p>Profiles stay in this browser tab. The percent shown is a posterior under an explicit 50/50 prior, not a universal probability. Results depend on the population frequency model and are not validated for casework or legal reporting.</p>
  </section>
</main>

<footer>
  <span>pedtools · forrel · ibdsim2 · WebR</span>
  {#if result}<span>Versions: {result.engine.pedtools} · {result.engine.forrel} · {result.engine.ibdsim2}</span>{/if}
</footer>
