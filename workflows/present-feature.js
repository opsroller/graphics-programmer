// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'present-feature',
  description: 'Build the presentation for a game feature end to end: plan scene, camera, event-to-animation beats and input actions, implement them, check feel, frame time and input on each target in parallel, fix, document in the same PR, and push it as a handoff for engineering-practices deliver-package or land-pr. Use when a feature already has a design spec and logic events. args: { feature: "short name, e.g. item pickup", spec?: "path to the design spec", targets?: ["weakest supported phone", "desktop"] }',
  phases: [
    { title: 'Plan', detail: 'presentation plan and docs plan (compass)' },
    { title: 'Build', detail: 'one agent implements the plan' },
    { title: 'Verify', detail: 'read-only checks per target and per concern, in parallel' },
    { title: 'Fix', detail: 'one agent applies fixes; at most two rounds' },
    { title: 'Docs', detail: 'write the planned Diataxis pages in the same PR' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
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
      { schema: FINDINGS, phase: 'Verify', label: round ? `${area} round ${round + 1}` : area, independent: true }).then((r) => (r ? { ...r, area } : { area, crashed: true }))))
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
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
const docs = await agent(
  `You are the graphics-programmer. Write the documentation for "${feature}" in the same PR. Planned pages: ${JSON.stringify(plan.docsPlan)}.
${DOCS_FRAGMENT} Commit the docs on the same branch. Return the page paths you touched and each change left undocumented with why.`,
  { schema: DOCS, phase: 'Docs', label: 'docs' },
)
if (!docs) return 'blocked: docs agent returned nothing; the feature is not done without its docs'

phase('Docs check')
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'problems'] }
const check = await agent(
  `Review the docs pages touched for "${feature}" (read only). Check: each page holds one Diataxis kind only; nothing instructional in reference or explanation; how-to titles name a user goal and explanation titles read "About ..."; reference structure matches the code; pages link to the related pages of the other kinds; every user-visible change from this work is documented. Docs report: ${JSON.stringify(docs)}`,
  { schema: DOCCHECK, phase: 'Docs check', label: 'docs check', independent: true },
)
if (!check) return `unverified: docs checker returned nothing. Build: ${built}\nDocs: ${JSON.stringify(docs)}`
if (!check.ok) return `blocked: docs check failed:\n- ${check.problems.join('\n- ')}`

// The handoff is what engineering-practices deliver-package takes as
// prior, so the presentation ships without being built again.
phase('Handoff')
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }
const pages = Array.isArray(docs.pages) ? docs.pages : []
const hand = await agent(
  `Hand off the presentation for "${feature}". If you are on the default branch, cut a Conventional branch (feat/<slug>) from the latest remote default branch; otherwise stay on the current feature branch. Commit everything this run wrote (the presentation code, scene, camera, animation and input data, fixes and their tests, and the docs pages ${pages.join(', ') || 'as written'}) as Conventional Commits, and push. Run the project's checks that apply (test suite, headless or scene checks and the docs link check the project profile names) on the pushed head. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether the checks pass on that head, and the problem if not.`,
  { schema: HANDOFF, phase: 'Handoff', label: 'handoff' },
)
if (!hand || !hand.branch) return `blocked: handoff step returned nothing; the presentation for "${feature}" may not be committed or pushed${hand && hand.problem ? `: ${hand.problem}` : ''}`
if (!hand.tests_pass) return `blocked: checks fail on ${hand.branch}${hand.head_sha ? ` at ${hand.head_sha}` : ''}: ${hand.problem || 'no details'}`

const partial = unverified.length || estimated.length
const summary = partial
  ? `unverified: presentation for "${feature}" built and documented, but not fully verified.${unverified.length ? `\nchecks that returned nothing: ${unverified.join(', ')}` : ''}${estimated.length ? `\nestimated, not measured: ${estimated.join(', ')}` : ''}\nRerun the missing checks before marking it done.\nBuild: ${built}\nDocs: ${JSON.stringify(docs)}`
  : `done: presentation for "${feature}" built, verified and documented.\nBuild: ${built}\nDocs: ${JSON.stringify(docs)}`
return {
  status: partial ? 'unverified' : 'done',
  summary,
  build: built,
  docs,
  unverified,
  estimated,
  handoff: {
    from: 'graphics-programmer:present-feature',
    branch: hand.branch,
    pr: hand.pr || '',
    head_sha: hand.head_sha || '',
    tests_pass: true,
    docs: pages,
    undocumented: Array.isArray(docs.undocumented) ? docs.undocumented : [],
    notes: [
      ...(unverified.length ? [`checks that returned nothing: ${unverified.join(', ')}`] : []),
      ...(estimated.length ? [`estimated, not measured: ${estimated.join(', ')}`] : []),
    ],
  },
  next: `${partial ? 'rerun the unverified or estimated checks first, then ' : ''}ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "${hand.branch}" }`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
