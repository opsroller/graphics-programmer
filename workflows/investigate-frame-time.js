// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'investigate-frame-time',
  description: 'Investigate a frame-time problem (low frame rate, stutter, hitches, overheating) on one target: reproduce with a fixed scenario, measure a baseline, find the bound side with parallel read-only diagnosers, apply one fix at a time, re-measure, and document in the same PR. args: { symptom: "what is wrong, e.g. drops below 30 fps when the menu opens", target: "device or tier from the project profile", scenario?: "how to reproduce" }',
  phases: [
    { title: 'Plan', detail: 'scenario, budget, docs plan (compass)' },
    { title: 'Measure', detail: 'baseline on the target' },
    { title: 'Diagnose', detail: 'CPU, GPU, pacing and memory diagnosers in parallel, read only' },
    { title: 'Fix', detail: 'one change per round, re-measured; at most three rounds' },
    { title: 'Docs', detail: 'write the planned Diataxis pages in the same PR' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
  ],
}

const USAGE = 'usage: investigate-frame-time { symptom: "what is wrong", target: "device or tier", scenario?: "how to reproduce" }'
if (!args || !args.symptom || !args.target) return USAGE
const { symptom, target } = args
const scenarioHint = args.scenario ? `Reproduction given by the requester: ${args.scenario}.` : 'Define a repeatable reproduction yourself (scene, camera path, input replay).'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    scenario: { type: 'string' },
    budgetMs: { type: 'number' },
    build: { type: 'string', description: 'release-like build and how to produce it' },
    canMeasure: { type: 'boolean', description: 'false if no target device or build is reachable' },
    docsPlan: { type: 'array', items: { type: 'string' }, description: 'kind + page path + what changes' },
  },
  required: ['scenario', 'budgetMs', 'canMeasure', 'docsPlan'],
}
const MEASURE = {
  type: 'object',
  properties: {
    medianMs: { type: 'number' }, p95Ms: { type: 'number' }, p99Ms: { type: 'number' }, worstMs: { type: 'number' },
    framesOverBudget: { type: 'number' }, cpuMs: { type: 'number' }, gpuMs: { type: 'number' },
    notes: { type: 'string' },
  },
  required: ['medianMs', 'p95Ms', 'p99Ms', 'notes'],
}
const HYPOTHESES = {
  type: 'object',
  properties: {
    area: { type: 'string' },
    hypotheses: {
      type: 'array',
      items: {
        type: 'object',
        properties: { cause: { type: 'string' }, evidence: { type: 'string' }, change: { type: 'string' }, expectedSavingMs: { type: 'number' } },
        required: ['cause', 'evidence', 'change', 'expectedSavingMs'],
      },
    },
  },
  required: ['area', 'hypotheses'],
}

phase('Plan')
const plan = await agent(
  `You are the graphics-programmer. Onboard first (engineering-practices project-onboarding). Symptom: "${symptom}" on ${target}. ${scenarioHint}
Follow the frame-budget-profiling skill: fix a repeatable scenario, take the frame budget for this target from the project profile (or propose one), and say whether a real device and release-like build are reachable (canMeasure).
Docs plan: ${DOCS_FRAGMENT} Here only plan: list each page (kind, path, change). Do not edit anything.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'blocked: planning failed (no plan returned)'
if (!plan.canMeasure) return `blocked: no ${target} device or release-like build is reachable, so nothing can be measured. Scenario prepared: ${plan.scenario}`

const measure = (label) => agent(
  `You are the graphics-programmer. Run this scenario on ${target} with ${plan.build || 'a release-like build'} and report frame time per the frame-budget-profiling skill (median, p95, p99, worst, frames over ${plan.budgetMs} ms, CPU and GPU ms). Scenario: ${plan.scenario}. Read only; do not edit files.`,
  { schema: MEASURE, phase: label === 'baseline' ? 'Measure' : 'Fix', label },
)

phase('Measure')
const baseline = await measure('baseline')
if (!baseline) return 'blocked: baseline measurement failed'
log(`baseline p95 ${baseline.p95Ms} ms vs budget ${plan.budgetMs} ms`)

phase('Diagnose')
const AREAS = [
  ['cpu', 'CPU side: logic and presentation cost, per-frame allocations and garbage collection, scene traversal, draw submission count.'],
  ['gpu', 'GPU side: resolution and overdraw, full-screen passes, render-pass load/store traffic, shader cost, texture formats. Skills: platform-scaling, scene-composition.'],
  ['pacing', 'Frame pacing and hitches: first-use shader compilation or asset loads, refresh-rate mismatch, thermal throttling over a long run.'],
  ['memory', 'Memory and loading: texture memory against budget, streaming stalls, leaks that grow over the session.'],
]
const diag = await parallel(AREAS.map(([area, focus]) => () =>
  agent(`You are a graphics-programmer diagnoser. Read only; do not edit files. Symptom "${symptom}" on ${target}. Baseline: ${JSON.stringify(baseline)}. Focus: ${focus}
Follow frame-budget-profiling: name causes only with evidence from captures or code, each with one concrete change and an expected saving in ms. Return an empty list if this area is not on the critical path.`,
    { schema: HYPOTHESES, phase: 'Diagnose', label: area })))
const missingAreas = AREAS.map(([a]) => a).filter((a, i) => !diag[i])
if (missingAreas.length) log(`diagnosers that returned nothing (areas unverified): ${missingAreas.join(', ')}`)
const ranked = diag.filter(Boolean)
  .flatMap((d) => d.hypotheses.map((h) => ({ ...h, area: d.area })))
  .sort((a, b) => b.expectedSavingMs - a.expectedSavingMs)
if (!ranked.length) return `${missingAreas.length ? 'unverified' : 'no evidenced cause found'}: Baseline: ${JSON.stringify(baseline)}${missingAreas.length ? `\nunverified areas: ${missingAreas.join(', ')}` : ''}`

phase('Fix')
let current = baseline
const kept = []
const tried = []
let measureFailed = false
for (const h of ranked.slice(0, 3)) {
  if (current.p95Ms <= plan.budgetMs) break
  const applied = await agent(
    `You are the graphics-programmer. Apply exactly this one change, nothing else, following the relevant graphics-programmer skill, and commit it on the work-package branch: ${h.change} (cause: ${h.cause}).`,
    { phase: 'Fix', label: `apply: ${h.area}` },
  )
  if (!applied) return `blocked: the apply agent for "${h.change}" returned nothing; check the branch for a partial change before continuing.\nbaseline p95 ${baseline.p95Ms} ms; current p95 ${current.p95Ms} ms`
  const after = await measure(`re-measure: ${h.area}`)
  if (!after) {
    const undone = await agent(`You are the graphics-programmer. Revert the last commit ("${h.change}"); its effect could not be measured. Use a revert commit.`, { phase: 'Fix', label: `revert unmeasured: ${h.area}` })
    if (!undone) return `blocked: re-measuring "${h.change}" failed and its revert failed; revert it by hand before continuing.\nbaseline p95 ${baseline.p95Ms} ms; current p95 ${current.p95Ms} ms`
    measureFailed = true
    tried.push(`${h.cause}: measurement failed, reverted; loop stopped`)
    break
  }
  if (after.p95Ms < current.p95Ms) {
    kept.push(`${h.cause}: p95 ${current.p95Ms} -> ${after.p95Ms} ms`)
    current = after
  } else {
    const reverted = await agent(`You are the graphics-programmer. Revert the last commit ("${h.change}"); it did not improve p95 frame time. Use a revert commit.`, { phase: 'Fix', label: `revert: ${h.area}` })
    if (!reverted) return `blocked: "${h.change}" did not help and its revert failed; revert it by hand before continuing.\nbaseline p95 ${baseline.p95Ms} ms; now ${after.p95Ms} ms`
    tried.push(`${h.cause}: no improvement, reverted`)
  }
}
if (ranked.length > 3) log(`only the top 3 of ${ranked.length} hypotheses were tried`)
const summary = `baseline p95 ${baseline.p95Ms} ms; now ${current.p95Ms} ms; budget ${plan.budgetMs} ms\nkept:\n- ${kept.join('\n- ') || 'none'}\ntried:\n- ${tried.join('\n- ') || 'none'}`

phase('Docs')
const docs = await agent(
  `You are the graphics-programmer. Document this investigation in the same PR. Planned pages: ${JSON.stringify(plan.docsPlan)}. Results: ${summary}.
${DOCS_FRAGMENT} Budgets or scenario definitions that changed go in reference; a trade-off decision goes in an explanation. Commit the docs on the same branch.`,
  { phase: 'Docs', label: 'docs' },
)
if (!docs) return `blocked: docs missing (agent returned nothing); work is not done.\n${summary}`

phase('Docs check')
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'problems'] }
const check = await agent(
  `Review the docs pages touched by this frame-time investigation (read only). Check: one Diataxis kind per page; nothing instructional in reference or explanation; how-to titles name a user goal and explanation titles read "About ..."; pages link to related pages of the other kinds. Docs report: ${docs}`,
  { schema: DOCCHECK, phase: 'Docs check', label: 'docs check' },
)
const docsState = !check ? 'docs unverified (checker returned nothing)' : check.ok ? 'docs checked' : `docs problems:\n- ${check.problems.join('\n- ')}`
const gaps = []
if (measureFailed) gaps.push('a re-measurement failed')
if (missingAreas.length) gaps.push(`diagnosers returned nothing: ${missingAreas.join(', ')}`)
if (!check || !check.ok) gaps.push('docs not verified')
const verdict = current.p95Ms > plan.budgetMs ? 'blocked: still over budget' : gaps.length ? `unverified: within budget, but ${gaps.join('; ')}` : 'within budget'
return `${verdict}\n${summary}\n${docsState}`
