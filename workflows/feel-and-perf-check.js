// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'feel-and-perf-check',
  description: 'Check finished presentation work before it is marked done: feel timings, readability, input on every device family, and frame time on each target, in parallel and read only; then one prioritised fix list and a docs pass recording the measured results. args: { scope: "what to check, e.g. a branch name such as fix/login-timeout or a feature name", targets?: ["weakest supported phone", "desktop", "web build"] }',
  phases: [
    { title: 'Plan', detail: 'scope, targets, docs plan (compass)' },
    { title: 'Check', detail: 'read-only checks per concern and target, in parallel' },
    { title: 'Report', detail: 'one prioritised fix list' },
    { title: 'Docs', detail: 'record measured results in the project docs' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
  ],
}

const USAGE = 'usage: feel-and-perf-check { scope: "branch or feature", targets?: ["weakest supported phone", "desktop"] }'
if (!args || !args.scope) return USAGE
const scope = args.scope
const targets = Array.isArray(args.targets) && args.targets.length ? args.targets : ['the weakest supported device in the project profile', 'desktop']

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const FINDINGS = {
  type: 'object',
  properties: {
    area: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' }, description: 'each: what, where (file), actual vs target, concrete change' },
    measured: { type: 'boolean' },
  },
  required: ['area', 'findings', 'measured'],
}

phase('Plan')
const PLAN = { type: 'object', properties: { summary: { type: 'string' }, docsPlan: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'docsPlan'] }
const plan = await agent(
  `You are the graphics-programmer. Onboard first (engineering-practices project-onboarding). Summarise what "${scope}" changed in presentation, and plan the docs: ${DOCS_FRAGMENT} Here only plan (kind, path, change), typically reference pages for measured budgets per target. Do not edit anything.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'blocked: planning failed (no plan returned)'

const checks = [
  ['feel', 'Compare every animation timing and easing with the feel targets in the design spec; list each delta as "beat: actual vs target". Check skip and reduced motion. Skill: event-presentation.'],
  ['readability', 'Check the readable set at the smallest supported resolution and the narrowest and widest aspect ratios, inside safe areas, in grayscale. Skills: scene-composition, camera-systems.'],
  ['input', 'Check every action on every supported device family, including cancel, focus loss and disconnect, and touch target sizes. Skill: input-handling.'],
  ...targets.map((t) => [`perf: ${t}`, `Measure frame time (median, p95, p99) on ${t} in a release-like build against the project budget; if no device or build is available, estimate from scene and code and set measured=false. Skills: frame-budget-profiling, platform-scaling, web-rendering for web targets.`]),
]

phase('Check')
const results = await parallel(checks.map(([area, task]) => () =>
  agent(`You are a graphics-programmer reviewer. Read only; do not edit any file. Scope: "${scope}" (${plan.summary}). ${task}`,
    { schema: FINDINGS, phase: 'Check', label: area }).then((r) => (r ? { ...r, area } : { area, crashed: true }))))
const unverified = results.filter((r) => r.crashed).map((r) => r.area)
const estimated = results.filter((r) => !r.crashed && !r.measured).map((r) => r.area)
const done = results.filter((r) => !r.crashed)

phase('Report')
const report = await agent(
  `Turn these findings into one prioritised fix list, biggest player-visible impact first, each with file and the concrete change. Mark items from estimated (not measured) checks as estimates. Areas not checked: ${unverified.join(', ') || 'none'}.\n${JSON.stringify(done)}`,
  { phase: 'Report', label: 'report' },
)
if (!report) return `report failed; raw findings:\n${JSON.stringify(done)}\nunverified: ${unverified.join(', ') || 'none'}`

phase('Docs')
const docs = await agent(
  `You are the graphics-programmer. Record the measured results for "${scope}" in the project docs. Planned pages: ${JSON.stringify(plan.docsPlan)}. Only record numbers from measured checks (estimated: ${estimated.join(', ') || 'none'}). ${DOCS_FRAGMENT} Commit on the same branch as the work.`,
  { phase: 'Docs', label: 'docs' },
)

phase('Docs check')
let docsState = 'docs missing (agent returned nothing)'
if (docs) {
  const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'problems'] }
  const check = await agent(
    `Review the docs pages touched (read only). Check: one Diataxis kind per page; reference states facts only; titles follow the patterns; pages link to related pages of the other kinds. Docs report: ${docs}`,
    { schema: DOCCHECK, phase: 'Docs check', label: 'docs check' },
  )
  docsState = !check ? 'docs unverified (checker returned nothing)' : check.ok ? 'docs checked' : `docs problems:\n- ${check.problems.join('\n- ')}`
}
return `${report}\n\nunverified areas: ${unverified.join(', ') || 'none'}\nestimated, not measured: ${estimated.join(', ') || 'none'}\n${docsState}`
