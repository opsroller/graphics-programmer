// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'investigate-render-budget',
  description: 'Investigate a count budget that a scene goes over (draw calls, triangles, memory, texture memory) on one or more targets: fix a repeatable scenario, count a baseline split by render pass (or by memory category), diagnose the part that dominates with parallel read-only diagnosers, apply one fix at a time, re-count, document in the same PR with a docs re-check, and push it as a handoff for engineering-practices deliver-package or land-pr. Counts may come from a software renderer on a machine with no GPU; times may not, so a time budget goes to investigate-frame-time. args: { metric: "draw calls", unit: "calls", budget: 150, targets: ["low tier", "desktop"], scenario?: "how to reproduce", symptom?: "what was seen" }',
  phases: [
    { title: 'Plan', detail: 'scenario, counter, where each target is counted, docs plan (compass)' },
    { title: 'Measure', detail: 'baseline count per target, split by render pass or memory category' },
    { title: 'Diagnose', detail: 'one read-only diagnoser per dominant part, in parallel' },
    { title: 'Fix', detail: 'one change per round, re-counted on every target; at most three rounds' },
    { title: 'Docs', detail: 'write the planned Diataxis pages in the same PR' },
    { title: 'Docs check', detail: 'independent checks and fixes, every touched page re-checked' },
    { title: 'Handoff', detail: 'commit and push the branch, run the checks on the pushed head, return a handoff for deliver-package or land-pr' },
  ],
}

// --- run-modes v2 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const reviewers = c.reviewers && typeof c.reviewers === 'object' ? c.reviewers : {}
  const only = Array.isArray(c.only) && c.only.length ? c.only.map(String) : null
  const from = c.from ? String(c.from) : null
  const titles = typeof meta !== 'undefined' && meta && Array.isArray(meta.phases) ? meta.phases.map((p) => p.title) : []
  const unknown = titles.length ? (from ? [from] : []).filter((t) => !titles.includes(t)) : []
  const error = c.mode && !['agents', 'inline'].includes(c.mode)
    ? `run.mode must be "agents" or "inline", got "${c.mode}"`
    : unknown.length ? `run.from names no phase: ${unknown.join(', ')}. Phases: ${titles.join(', ')}` : null
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  // An answer must carry every required key of its schema, as the runtime
  // enforces for agents; returns the missing keys, or null when it fits.
  const missing = (v, schema) => {
    if (v === null || v === undefined) return 'an answer'
    if (!schema || schema.type !== 'object') return null
    if (typeof v !== 'object' || Array.isArray(v)) return 'a JSON object'
    const gap = (schema.required || []).filter((k) => !has(v, k) || v[k] === undefined)
    return gap.length ? gap.join(', ') : null
  }
  const seen = {}
  const out = {}
  // Who answered each step marked independent: "subagent" when this run
  // spawned it, else the reviewer named in run.reviewers, else "self".
  const by = {}
  const who = (k) => (typeof reviewers[k] === 'string' && reviewers[k].trim() ? reviewers[k].trim() : 'self')
  const skipped = []
  const next = []
  const logs = []
  let current = ''
  let reached = !from
  let halting = false
  let release = () => {}
  const halted = new Promise((r) => { release = r })
  const picked = (ph, label) => reached && (!only || only.some((s) => s === ph || s === label || label.startsWith(s + ':')))
  const agent = (prompt, opts) => {
    const op = opts || {}
    const independent = op.independent === true
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    let note = null
    if (has(results, key)) {
      const gap = missing(results[key], op.schema)
      if (!gap) { out[key] = results[key]; if (independent) by[key] = who(key); return Promise.resolve(results[key]) }
      note = `answer missing ${gap}; answer this brief again`
    }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      const pass = Object.assign({}, op)
      delete pass.independent
      return realAgent(prompt, opts ? pass : opts).then((r) => {
        if (r !== null && r !== undefined) { out[key] = r; if (independent) by[key] = 'subagent' }
        return r
      })
    }
    const brief = { key, phase: ph, prompt, schema: op.schema || null }
    if (independent) brief.independent = true
    if (note) brief.note = note
    next.push(brief)
    if (!halting) {
      halting = true
      // Wait 200 microtask turns before pausing, so every sibling in a
      // parallel() or pipeline() fan-out queues its brief into this pause.
      ;(async () => { for (let i = 0; i < 200; i++) await null; release('__run_halted__') })()
    }
    return new Promise(() => {})
  }
  const phase = (t) => { current = t; if (from && t === from) reached = true; return realPhase(t) }
  const log = (m) => { logs.push(String(m)); return realLog(m) }
  const finish = (value) => {
    if (!opted) return value
    const self_reviewed = Object.keys(by).filter((k) => by[k] === 'self')
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, reviewers: by, self_reviewed, skipped, logs,
        how: 'Do each brief in next, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief marked independent reviews work this run produced, so do not answer it yourself: send its prompt to a reviewer with no part in the work (the project\'s code-reviewer role, a fresh session or a fresh subagent), use their answer, and name them in run.reviewers under its key; if you must answer it yourself, it is listed in self_reviewed and must be reported as self-reviewed. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args, run.results set to the merged results and run.reviewers to the merged reviewers. Repeat until status is "done". To avoid pasting results back on every call, drive the run with engineering-practices tools/run-inline.mjs and a state file instead: it stores each answer and prints only the next briefs.',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, reviewers: by, self_reviewed, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v2 end (workflow body follows; close it with the tail line) ---

const USAGE = 'usage: investigate-render-budget { metric: "draw calls", unit: "calls", budget: 150, targets: ["device or tier"], scenario?: "how to reproduce", symptom?: "what was seen" }'
if (!args || !args.metric || !args.unit || !(Number(args.budget) > 0)) return USAGE
const metric = String(args.metric)
const unit = String(args.unit)
const limit = Number(args.budget)
const targets = (Array.isArray(args.targets) ? args.targets : [args.targets || args.target]).filter((t) => typeof t === 'string' && t.trim()).map(String)
if (!targets.length) return USAGE
if (/^(ms|msec|milliseconds?|s|secs?|seconds?|us|µs|microseconds?|ns|fps|hz)$/i.test(unit.trim())) return `usage: "${metric}" in ${unit} is a time, not a count; use /graphics-programmer:investigate-frame-time for time budgets`
const scenarioHint = args.scenario ? `Reproduction given by the requester: ${args.scenario}.` : 'Define a repeatable reproduction yourself (scene, camera path or fixed camera, input replay, quality tier).'
const symptom = args.symptom ? ` Symptom reported: "${args.symptom}".` : ''
const isMemory = /memory|mb|mib|gb|gib|kb|kib|bytes?/i.test(`${metric} ${unit}`)
const PARTS = isMemory
  ? 'memory category (textures, meshes, render targets, buffers, shaders; textures by format)'
  : 'render pass (opaque, transparent, shadow, post, UI, plus any other pass the renderer has)'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    scenario: { type: 'string' },
    counter: { type: 'string', description: 'the engine statistic, frame capture or tool that counts the metric, and the command that runs it' },
    canMeasure: { type: 'boolean', description: 'false if no target, build or software renderer can run the scenario and report the count' },
    where: { type: 'array', items: { type: 'string' }, description: 'one per target: "target: device or software renderer, backend, quality settings"' },
    docsPlan: { type: 'array', items: { type: 'string' }, description: 'kind + page path + what changes' },
  },
  required: ['scenario', 'counter', 'canMeasure', 'docsPlan'],
}
const COUNT = {
  type: 'object',
  properties: {
    total: { type: 'number', description: `${metric} in ${unit} over the scenario (the worst frame for per-frame counts, the peak for memory)` },
    breakdown: {
      type: 'array',
      items: { type: 'object', properties: { part: { type: 'string' }, value: { type: 'number' } }, required: ['part', 'value'] },
      description: `the total split by ${PARTS}`,
    },
    renderer: { type: 'string', description: 'device or software renderer, backend and driver that counted' },
    measured: { type: 'boolean', description: 'true if the count is what the target would report; false if estimated, or if the renderer counted differently from the target' },
    notes: { type: 'string' },
  },
  required: ['total', 'breakdown', 'renderer', 'measured', 'notes'],
}
const HYPOTHESES = {
  type: 'object',
  properties: {
    part: { type: 'string' },
    hypotheses: {
      type: 'array',
      items: {
        type: 'object',
        properties: { cause: { type: 'string' }, evidence: { type: 'string' }, change: { type: 'string' }, expectedSaving: { type: 'number', description: `in ${unit}` } },
        required: ['cause', 'evidence', 'change', 'expectedSaving'],
      },
    },
  },
  required: ['part', 'hypotheses'],
}

phase('Plan')
const plan = await agent(
  `You are the graphics-programmer. Onboard first (engineering-practices project-onboarding). Budget: ${metric} at most ${limit} ${unit} on ${targets.join('; ')}.${symptom} ${scenarioHint}
Follow the frame-budget-profiling skill (sub-budgets): fix a repeatable scenario and name the counter (engine render statistics, a frame capture or the project's measurement tool) that reports ${metric} split by ${PARTS}. Counts can be taken on a software renderer on a machine with no GPU (graphics-programmer headless-rendering skill, "What software frame times mean"): draw calls, primitives and engine-accounted memory are the same as on a GPU for the same scene and settings, so set each target's quality settings exactly. Times from that renderer are never measurements, and this workflow takes none. Say per target where it will be counted, and whether anything can count it at all (canMeasure).
Docs plan: ${DOCS_FRAGMENT} Here only plan: list each page (kind, path, change). Do not edit anything.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'blocked: planning failed (no plan returned)'
if (!plan.canMeasure) return `blocked: nothing reachable can count ${metric} for ${targets.join(', ')}, not even a software renderer. Scenario prepared: ${plan.scenario}`

const countBrief = (t, why) => `You are the graphics-programmer. ${why} Count ${metric} in ${unit} for the scenario on ${t} with ${plan.counter}. Where: ${JSON.stringify(plan.where || [])}. Scenario: ${plan.scenario}.
Report the total and split it by ${PARTS}; the parts must add up to the total. Record the renderer, backend and driver. A software renderer's count is measured (measured=true) only when it ran with ${t}'s exact quality settings and counts the same thing the target would: draw calls and primitives do; memory does only as the engine accounts it, and not for textures in a compressed format the software driver lacks (it stores them decompressed), so set measured=false there and say so in notes. Never report a time from a software renderer (headless-rendering skill). Read only; do not edit files.`
const countAll = (why, tag) => parallel(targets.map((t) => () => agent(countBrief(t, why), { schema: COUNT, phase: tag === 'baseline' ? 'Measure' : 'Fix', label: `${tag}: ${t}` })))
const over = (counts) => counts.some((c) => c && c.total > limit)
const worstOf = (counts) => Math.max(...counts.map((c) => (c ? c.total : -Infinity)))
const line = (counts) => targets.map((t, i) => `${t} ${counts[i] ? counts[i].total : '?'} ${unit}`).join(', ')

phase('Measure')
const baseline = await countAll('Take the baseline count.', 'baseline')
const lost = targets.filter((t, i) => !baseline[i])
if (lost.length === targets.length) return 'blocked: baseline count failed on every target'
if (lost.length) log(`baseline count returned nothing on: ${lost.join(', ')}`)
log(`baseline ${metric}: ${line(baseline)} vs budget ${limit} ${unit}`)

phase('Diagnose')
// Diagnose the target furthest over budget, on the parts that dominate it:
// the largest part always, and any other holding a quarter of the total,
// at most three.
const wi = baseline.reduce((b, c, i) => (c && (b < 0 || c.total > baseline[b].total) ? i : b), -1)
const worst = baseline[wi]
const parts = (Array.isArray(worst.breakdown) ? worst.breakdown : []).filter((p) => p && p.part).sort((a, b) => b.value - a.value)
const dominant = parts.filter((p, i) => i === 0 || p.value >= worst.total / 4).slice(0, 3)
if (!dominant.length) return `blocked: the baseline on ${targets[wi]} has no split by ${PARTS}; the counter must report one. Baseline: ${JSON.stringify(worst)}`
const diag = await parallel(dominant.map((p) => () =>
  agent(`You are a graphics-programmer diagnoser. Read only; do not edit files. ${metric} on ${targets[wi]} is ${worst.total} ${unit} against a budget of ${limit}; ${p.part} holds ${p.value} ${unit} of it. Full baseline: ${JSON.stringify(worst)}. Find why ${p.part} costs this much: ${isMemory ? 'texture sizes and formats, mip chains, duplicate or unused assets, render-target sizes and counts, buffers kept alive' : 'objects or materials that could batch or instance, state and material changes that split batches, culling and LOD, shadow casters and cascades, passes or layers drawn more than once, UI elements that break batching'}. Skills: frame-budget-profiling, scene-composition, platform-scaling. Name causes only with evidence from captures, statistics or code, each with one concrete change and an expected saving in ${unit}. Say when a change alters what the player sees. Return an empty list if nothing in this part can be cut.`,
    { schema: HYPOTHESES, phase: 'Diagnose', label: `diagnose: ${p.part}` })))
const missingParts = dominant.map((p) => p.part).filter((_, i) => !diag[i])
if (missingParts.length) log(`diagnosers that returned nothing (parts unverified): ${missingParts.join(', ')}`)
const ranked = diag.filter(Boolean)
  .flatMap((d) => d.hypotheses.map((h) => ({ ...h, part: d.part })))
  .sort((a, b) => b.expectedSaving - a.expectedSaving)
if (!ranked.length && over(baseline)) return `${missingParts.length ? 'unverified' : 'no evidenced cause found'}: baseline ${line(baseline)}; budget ${limit} ${unit}${missingParts.length ? `\nunverified parts: ${missingParts.join(', ')}` : ''}`

phase('Fix')
let current = baseline
const kept = []
const tried = []
let measureFailed = false
let round = 0
for (const h of ranked.slice(0, 3)) {
  if (!over(current)) break
  round += 1
  const applied = await agent(
    `You are the graphics-programmer. Apply exactly this one change, nothing else, following the relevant graphics-programmer skill, and commit it on the work-package branch: ${h.change} (cause: ${h.cause}, in ${h.part}). If it changes what the player sees, say what in the commit message.`,
    { phase: 'Fix', label: `apply:${round}` },
  )
  if (!applied) return `blocked: the apply agent for "${h.change}" returned nothing; check the branch for a partial change before continuing.\nbaseline ${line(baseline)}; current ${line(current)}`
  const after = await countAll(`Re-count after the change "${h.change}".`, `re-count:${round}`)
  if (after.some((c) => !c)) {
    const undone = await agent(`You are the graphics-programmer. Revert the last commit ("${h.change}"); its effect could not be counted on every target. Use a revert commit.`, { phase: 'Fix', label: `revert uncounted:${round}` })
    if (!undone) return `blocked: re-counting "${h.change}" failed and its revert failed; revert it by hand before continuing.\nbaseline ${line(baseline)}; current ${line(current)}`
    measureFailed = true
    tried.push(`${h.cause}: re-count failed, reverted; loop stopped`)
    break
  }
  if (worstOf(after) < worstOf(current) && after.every((c, i) => !current[i] || c.total <= current[i].total)) {
    kept.push(`${h.cause} (${h.part}): ${line(current)} -> ${line(after)}`)
    current = after
  } else {
    const reverted = await agent(`You are the graphics-programmer. Revert the last commit ("${h.change}"); it did not lower ${metric} on the worst target, or raised it on another. Use a revert commit.`, { phase: 'Fix', label: `revert:${round}` })
    if (!reverted) return `blocked: "${h.change}" did not help and its revert failed; revert it by hand before continuing.\nbaseline ${line(baseline)}; now ${line(after)}`
    tried.push(`${h.cause} (${h.part}): no improvement, reverted`)
  }
}
if (ranked.length > 3) log(`only the top 3 of ${ranked.length} hypotheses were tried`)
const estimated = targets.filter((t, i) => current[i] && current[i].measured === false)
const summary = `${metric} (${unit}): baseline ${line(baseline)}; now ${line(current)}; budget ${limit}
split on ${targets[wi]}: ${parts.map((p) => `${p.part} ${p.value}`).join(', ')}
kept:\n- ${kept.join('\n- ') || 'none'}\ntried:\n- ${tried.join('\n- ') || 'none'}`
if (over(current)) return `blocked: still over budget\n${summary}`

phase('Docs')
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
const docs = await agent(
  `You are the graphics-programmer. Document this investigation in the same PR. Planned pages: ${JSON.stringify(plan.docsPlan)}. Results: ${summary}.
${DOCS_FRAGMENT} Record each count with target, renderer, backend and quality settings, and the split by ${PARTS}; budgets or scenario definitions that changed go in reference; a trade-off decision (a change the player can see) goes in an explanation. Record no time from a software renderer. Commit the docs on the same branch. Return the page paths you touched and each change left undocumented with why.`,
  { schema: DOCS, phase: 'Docs', label: 'docs' },
)
if (!docs) return `blocked: docs missing (agent returned nothing); work is not done.\n${summary}`

phase('Docs check')
// The check only reads, so it stays independent of the docs it judges;
// fixes are their own step, followed by a fresh check of every page touched
// so far. Up to three checks and two fixes; minor issues left go to notes.
const DOCCHECK = { type: 'object', properties: { issues: { type: 'array', items: { type: 'object', properties: {
  page: { type: 'string' }, problem: { type: 'string' }, severity: { type: 'string', enum: ['blocking', 'minor'] },
}, required: ['problem', 'severity'] } } }, required: ['issues'] }
const DOCFIX = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, left: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
const checkPrompt = (fixed) => `Review the docs pages touched by this ${metric} investigation. Docs report: ${JSON.stringify(docs)}${fixed.length ? `\nPages touched by fixes since: ${JSON.stringify(fixed)}` : ''}\nCheck every one of those pages: one Diataxis kind per page; reference states facts only; how-to titles name a user goal and explanation titles read "About ..."; pages link to related pages of the other kinds; recorded counts carry target, renderer and settings, and no software-renderer time appears. Give each issue the page, the problem and a severity: blocking when a page mixes kinds, is missing, has a broken link or states a wrong number; minor for wording, a title that could follow the pattern more closely, or a cross-link a reader can do without. Read-only: do not edit anything; return every issue.`
const text = (i) => (i.page ? `${i.page}: ${i.problem}` : i.problem)
let fixed = []
let issues = []
let checked = false
for (let r = 1; r <= 3; r++) {
  const c = await agent(checkPrompt(fixed), { schema: DOCCHECK, phase: 'Docs check', label: r === 1 ? 'docs check' : `docs recheck:${r - 1}`, independent: true })
  if (!c) { checked = false; break }
  checked = true
  issues = (c.issues || []).map((i) => (typeof i === 'string' ? { problem: i, severity: 'blocking' } : { severity: 'blocking', ...i }))
  if (!issues.length || r === 3) break
  const fix = await agent(`You are the graphics-programmer. Fix these documentation problems with the smallest edits, touching only the pages they name (add a page only when an issue says one is missing); leave anything that needs a content decision. Commit on the same branch as the work:\n- ${issues.map(text).join('\n- ')}\nReturn pages: every page you edited or added, and left: any issue you did not fix, with why.`, { schema: DOCFIX, phase: 'Docs check', label: `docs fix:${r}` })
  if (!fix) break
  fixed = [...new Set([...fixed, ...(fix.pages || [])])]
}
const blocking = issues.filter((i) => i.severity !== 'minor').map(text)
const docMinor = issues.filter((i) => i.severity === 'minor').map(text)
if (checked && blocking.length) return `blocked: docs problems:\n- ${blocking.join('\n- ')}\n${summary}`

// The handoff is what engineering-practices deliver-package takes as
// prior, so the fix ships without being redone.
phase('Handoff')
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }
const pages = [...new Set([...(Array.isArray(docs.pages) ? docs.pages : []), ...fixed])]
const hand = await agent(
  `Hand off the ${metric} budget work. If you are on the default branch, cut a Conventional branch (perf/<slug>) from the latest remote default branch; otherwise stay on the current branch. Commit everything this run wrote (the kept changes and their reverts as made, and the docs pages ${pages.join(', ') || 'as written'}) as Conventional Commits, and push. Run the project's checks that apply (test suite, headless or scene checks, asset validator and the docs link check the project profile names) on the pushed head. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether the checks pass on that head, and the problem if not.`,
  { schema: HANDOFF, phase: 'Handoff', label: 'handoff' },
)
if (!hand || !hand.branch) return `blocked: handoff step returned nothing; the work may not be committed or pushed${hand && hand.problem ? `: ${hand.problem}` : ''}\n${summary}`
if (!hand.tests_pass) return `blocked: checks fail on ${hand.branch}${hand.head_sha ? ` at ${hand.head_sha}` : ''}: ${hand.problem || 'no details'}`

const gaps = []
if (lost.length) gaps.push(`baseline returned nothing on: ${lost.join(', ')}`)
if (estimated.length) gaps.push(`estimated, not measured on: ${estimated.join(', ')}`)
if (measureFailed) gaps.push('a re-count failed')
if (missingParts.length) gaps.push(`diagnosers returned nothing: ${missingParts.join(', ')}`)
if (!checked) gaps.push('docs not verified (checker returned nothing)')
const notes = docMinor.map((d) => `docs check (minor): ${d}`)
// An unverified run returns no handoff, so deliver-package cannot ship it
// as checked; rerunning the missing steps gives one.
if (gaps.length) {
  return {
    status: 'unverified',
    summary: `unverified: within budget, but ${gaps.join('; ')}\n${summary}\nNo handoff: rerun the missing steps before shipping.`,
    docs,
    unverified: gaps,
    notes,
    pushed: { branch: hand.branch, pr: hand.pr || '', head_sha: hand.head_sha || '' },
    next: 'rerun the steps listed (run.only with their labels and run.results from this run); the run that verifies them returns the handoff',
  }
}
return {
  status: 'done',
  summary: `within budget\n${summary}\ndocs checked`,
  docs,
  unverified: [],
  notes,
  handoff: {
    from: 'graphics-programmer:investigate-render-budget',
    branch: hand.branch,
    pr: hand.pr || '',
    head_sha: hand.head_sha || '',
    tests_pass: true,
    docs: pages,
    undocumented: Array.isArray(docs.undocumented) ? docs.undocumented : [],
    notes: [`${metric} (${unit}): ${line(baseline)} -> ${line(current)}; budget ${limit}`, ...kept.map((k) => `kept: ${k}`), ...notes],
  },
  next: `ship it without redoing it: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "${hand.branch}" }`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
