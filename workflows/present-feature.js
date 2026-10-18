// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'present-feature',
  description: 'Build the presentation for a game feature end to end: plan scene, camera, event-to-animation beats and input actions, implement them, check feel, frame time and input on each target in parallel, fix, and document in the same PR. Use when a feature already has a design spec and logic events. args: { feature: "short name, e.g. item pickup", spec?: "path to the design spec", targets?: ["weakest supported phone", "desktop"] }',
  phases: [
    { title: 'Plan', detail: 'presentation plan and docs plan (compass)' },
    { title: 'Build', detail: 'one agent implements the plan' },
    { title: 'Verify', detail: 'read-only checks per target and per concern, in parallel' },
    { title: 'Fix', detail: 'one agent applies fixes; at most two rounds' },
    { title: 'Docs', detail: 'write the planned Diataxis pages in the same PR' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
  ],
}

// --- run-modes v1 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const only = Array.isArray(c.only) && c.only.length ? c.only.map(String) : null
  const from = c.from ? String(c.from) : null
  const titles = typeof meta !== 'undefined' && meta && Array.isArray(meta.phases) ? meta.phases.map((p) => p.title) : []
  const unknown = titles.length ? (from ? [from] : []).filter((t) => !titles.includes(t)) : []
  const error = c.mode && !['agents', 'inline'].includes(c.mode)
    ? `run.mode must be "agents" or "inline", got "${c.mode}"`
    : unknown.length ? `run.from names no phase: ${unknown.join(', ')}. Phases: ${titles.join(', ')}` : null
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  const seen = {}
  const out = {}
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
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    if (has(results, key)) { out[key] = results[key]; return Promise.resolve(results[key]) }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      return realAgent(prompt, opts).then((r) => { if (r !== null && r !== undefined) out[key] = r; return r })
    }
    next.push({ key, phase: ph, prompt, schema: op.schema || null })
    if (!halting) {
      halting = true
      ;(async () => { for (let i = 0; i < 200; i++) await null; release('__run_halted__') })()
    }
    return new Promise(() => {})
  }
  const phase = (t) => { current = t; if (from && t === from) reached = true; return realPhase(t) }
  const log = (m) => { logs.push(String(m)); return realLog(m) }
  const finish = (value) => {
    if (!opted) return value
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, skipped, logs,
        how: 'Do each brief in next yourself, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given. Add each answer to results under its key, then run this workflow again with the same args and run.results set to the merged results. Repeat until status is "done".',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v1 end (workflow body follows; close it with the tail line) ---

const USAGE = 'usage: present-feature { feature: "short name", spec?: "path/to/spec.md", targets?: ["weakest supported phone", "desktop"] }'
if (!args || !args.feature) return USAGE
const feature = args.feature
const spec = args.spec ? `The design spec is at ${args.spec}.` : 'Find the design spec for this feature through the project profile; if none exists, stop and say so.'
const targets = Array.isArray(args.targets) && args.targets.length ? args.targets : ['the weakest supported device in the project profile', 'desktop']

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    events: { type: 'array', items: { type: 'string' }, description: 'logic events consumed, with the data each must carry' },
    beats: { type: 'array', items: { type: 'string' }, description: 'event -> beat recipe with timing and easing from the spec' },
    scene: { type: 'string' },
    camera: { type: 'string' },
    inputActions: { type: 'array', items: { type: 'string' } },
    budget: { type: 'string', description: 'frame-time and sub-budget impact per target' },
    files: { type: 'array', items: { type: 'string' } },
    docsPlan: { type: 'array', items: { type: 'string' }, description: 'each entry: kind + page path + what changes' },
    missing: { type: 'array', items: { type: 'string' }, description: 'contract gaps that block the work' },
  },
  required: ['events', 'beats', 'files', 'docsPlan', 'missing'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    area: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
    minor: { type: 'array', items: { type: 'string' } },
    measured: { type: 'boolean', description: 'true if numbers came from a real run on the target, false if estimated' },
  },
  required: ['area', 'blockers', 'minor', 'measured'],
}

phase('Plan')
const plan = await agent(
  `You are the graphics-programmer. Onboard first (engineering-practices project-onboarding). Plan the presentation of "${feature}". ${spec}
Follow the graphics-programmer skills event-presentation (event contract, event-to-beat table), scene-composition, camera-systems and input-handling. Targets: ${targets.join('; ')}.
List the logic events you will consume and any data they lack (put contract gaps in "missing"; never plan to read live logic state). List the files you will change.
Docs plan: ${DOCS_FRAGMENT} Here only plan: list each page (kind, path, change). Do not edit anything yet.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'blocked: planning failed (no plan returned)'
if (plan.missing && plan.missing.length) return `blocked: the event contract is incomplete; ask the gameplay-programmer for:\n- ${plan.missing.join('\n- ')}`

phase('Build')
const built = await agent(
  `You are the graphics-programmer. Implement this presentation plan for "${feature}" exactly, following the skills event-presentation, scene-composition, camera-systems and input-handling. Logic must never wait on animation; timings live in data; skip and reduced motion must give the same final state.
Plan: ${JSON.stringify(plan)}
Commit on the work-package branch following engineering-practices git-workflow. Return a short summary of files changed.`,
  { phase: 'Build', label: 'build' },
)
if (!built) return 'blocked: build agent returned nothing; no changes are confirmed'

const checks = [
  ['feel', 'Compare every beat\'s timing and easing with the feel targets in the spec; check skip, fast-forward and reduced motion leave the view equal to logic state. Skill: event-presentation.'],
  ['input', 'Check every input action on every supported device family, including cancel, focus loss and disconnect; check touch target sizes and picking during camera motion. Skill: input-handling.'],
  ['readability', 'Check the readable set at the smallest supported resolution and the narrowest and widest aspect ratios, inside safe areas, in grayscale. Skills: scene-composition, camera-systems.'],
  ...targets.map((t) => [`perf: ${t}`, `Measure frame time (median, p95, p99) for the feature on ${t} in a release-like build against the project budget; if no device or build is available, estimate from the scene and code and set measured=false. Skill: frame-budget-profiling.`]),
]

let round = 0
let open = []
let unverified = []
let estimated = []
while (true) {
  phase('Verify')
  const results = await parallel(checks.map(([area, task]) => () =>
    agent(`You are a graphics-programmer reviewer. Read only; do not edit any file. Feature: "${feature}". ${task} Return blockers (must fix before merge) and minor issues, each with file and concrete change.`,
      { schema: FINDINGS, phase: 'Verify', label: area }).then((r) => (r ? { ...r, area } : { area, crashed: true }))))
  unverified = results.filter((r) => r.crashed).map((r) => r.area)
  open = results.filter((r) => !r.crashed).flatMap((r) => r.blockers.map((b) => `${r.area}: ${b}`))
  estimated = results.filter((r) => !r.crashed && r.measured === false).map((r) => r.area)
  if (estimated.length) log(`estimated, not measured: ${estimated.join(', ')}`)
  if (!open.length || round >= 2) break
  round += 1
  phase('Fix')
  const fixed = await agent(
    `You are the graphics-programmer. Fix these blockers for "${feature}" in one pass, following the relevant skills, then commit:\n- ${open.join('\n- ')}`,
    { phase: 'Fix', label: `fix round ${round}` },
  )
  if (!fixed) return `blocked: fix agent returned nothing; open blockers:\n- ${open.join('\n- ')}`
}
if (open.length) return `blocked after ${round} fix rounds; open blockers:\n- ${open.join('\n- ')}${unverified.length ? `\nunverified: ${unverified.join(', ')}` : ''}`

phase('Docs')
const docs = await agent(
  `You are the graphics-programmer. Write the documentation for "${feature}" in the same PR. Planned pages: ${JSON.stringify(plan.docsPlan)}.
${DOCS_FRAGMENT} Commit the docs on the same branch.`,
  { phase: 'Docs', label: 'docs' },
)
if (!docs) return 'blocked: docs agent returned nothing; the feature is not done without its docs'

phase('Docs check')
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'problems'] }
const check = await agent(
  `Review the docs pages touched for "${feature}" (read only). Check: each page holds one Diataxis kind only; nothing instructional in reference or explanation; how-to titles name a user goal and explanation titles read "About ..."; reference structure matches the code; pages link to the related pages of the other kinds; every user-visible change from this work is documented. Docs report: ${docs}`,
  { schema: DOCCHECK, phase: 'Docs check', label: 'docs check' },
)
if (!check) return `unverified: docs checker returned nothing. Build: ${built}\nDocs: ${docs}`
if (!check.ok) return `blocked: docs check failed:\n- ${check.problems.join('\n- ')}`

if (unverified.length || estimated.length) {
  return `unverified: presentation for "${feature}" built and documented, but not fully verified.${unverified.length ? `\nchecks that returned nothing: ${unverified.join(', ')}` : ''}${estimated.length ? `\nestimated, not measured: ${estimated.join(', ')}` : ''}\nRerun the missing checks before marking it done.\nBuild: ${built}\nDocs: ${docs}`
}
return `done: presentation for "${feature}" built, verified and documented.\nBuild: ${built}\nDocs: ${docs}`
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
