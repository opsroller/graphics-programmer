// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'implement-renderer-system',
  description: 'Implement one engine-side rendering system from a decided spec, such as a quality-tier system that applies a profile to the renderer, adaptive resolution, a post stack or a lighting setup: plan test cases, a headless self-test and a frame budget, build it in the project\'s native code test-first, attack it for tier fidelity, fallbacks, runtime switching and cost, fix, document it in the same PR and push it as a handoff for engineering-practices deliver-package or land-pr. args: { system: "<system name>", spec: "<decision doc or spec, path or section>", plan?: "<implementationPlan from renderer-decision, optional>", wp?: "<work package id>", branch?: "<existing branch>", pr?: "<existing PR>" }',
  phases: [
    { title: 'Plan', detail: 'case list from the decision, engine settings each tier maps to, headless self-test, frame budget, doc kinds (compass)' },
    { title: 'Build', detail: 'failing tests and the self-test first, then native code, until green' },
    { title: 'Attack', detail: 'parallel independent read-only attempts to break it; each returns failing test code' },
    { title: 'Fix', detail: 'one agent adds the attack tests and fixes the code; only tests still failing block, notes never do' },
    { title: 'Docs', detail: 'write or update the planned Diataxis pages in the same PR' },
    { title: 'Check', detail: 'independent: suite and headless self-test green, budget met or labelled estimate, each touched page one kind' },
    { title: 'Hand off', detail: 'push, open or reuse a draft PR, return a handoff for deliver-package or land-pr' },
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
        how: 'Do each brief in next, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief marked independent reviews work this run produced, so do not answer it yourself: send its prompt to a reviewer with no part in the work (the project\'s code-reviewer role, a fresh session or a fresh subagent), use their answer, and name them in run.reviewers under its key; if you must answer it yourself, it is listed in self_reviewed and must be reported as self-reviewed. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args, run.results set to the merged results and run.reviewers to the merged reviewers. Repeat until status is "done".',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, reviewers: by, self_reviewed, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v2 end (workflow body follows; close it with the tail line) ---

const USAGE = 'usage: implement-renderer-system { system: "<system name, e.g. quality tiers>", spec: "<decision doc or spec, path or section>", plan: "<implementationPlan from renderer-decision, optional>", wp: "<work package id, optional>", branch: "<existing branch, optional>", pr: "<existing PR, optional>" }'
if (!args || !args.system || !args.spec) return USAGE
const system = String(args.system)
const spec = String(args.spec)
const given = args.plan ? (typeof args.plan === 'string' ? args.plan : JSON.stringify(args.plan)) : ''
const wp = args.wp ? String(args.wp) : ''
const where = args.pr
  ? `Work on the existing PR ${args.pr} and its head branch; do not create a new branch or PR.`
  : args.branch
    ? `Work on the existing branch ${args.branch} (reuse its open PR if one exists); do not create a new branch.`
    : 'Work on the current feature branch; if you are on the default branch, cut a Conventional branch (feat/<slug>) from the latest remote default branch.'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs location (per the project profile), keep each page to one kind, title it by the project pattern (how-to names a goal, explanation reads "About ...", reference is named for the thing), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

// Only failures block. Every step returns blocking problems and
// informational notes in separate fields, and the workflow stops on the
// blocking field alone, so a note never turns green work into "blocked".
const NOTES_RULE = 'Put a problem in the blocking list only if it is a failure you can point to: a test or self-test that still fails, a suite or check that is red, a measured cost over budget, a case you could not implement or fix. Everything else (observations, follow-up ideas, questions, things already fixed, "nothing found") goes in notes, never in the blocking list; an empty blocking list means done.'

// The code lives where the project profile says engine-side code lives,
// in the language it names, so a project that forbids logic in a
// scripting layer gets native code and thin scene or config glue only.
const NATIVE = 'Write the system in the language and location the project profile names for engine-side code (for example a native engine extension or module), never in a scripting or web layer the profile rules out for logic; scene, resource or config files may only wire it up. Keep the per-tier values data-driven (one table or resource per tier, read by the code), so art and design can tune them without code changes.'

const PLAN = {
  type: 'object',
  properties: {
    decision: { type: 'string', description: 'where the decided tiers, features and fallbacks are written, or "missing"' },
    cases: { type: 'array', items: { type: 'string' }, description: 'one-line test cases: each tier gives each feature its decided technique and quality; each fallback where a feature is off or unsupported; tier selection and overrides; switching at runtime; invalid or saved values' },
    mapping: { type: 'array', items: { type: 'string' }, description: 'each "tier / feature -> engine setting or API = value", from the engine\'s own documentation' },
    api: { type: 'string', description: 'the public interface: how the game selects, applies and reads back a profile, and any signal it emits' },
    selfTest: { type: 'string', description: 'one command that starts the engine headless (no window, or the project\'s offscreen mode), applies every tier in turn, reads each setting back, prints what it checked and exits non-zero on any mismatch; and where it runs (the test suite, CI)' },
    budget: { type: 'string', description: 'cost limit per tier in ms from the decision, the scene it is measured on, and how (capture tool, device or stand-in)' },
    measurable: { type: 'boolean', description: 'a release-like build runs on each tier\'s weakest device or agreed stand-in' },
    files: { type: 'array', items: { type: 'string' } },
    ambiguous: { type: 'array', items: { type: 'string' }, description: 'each "AMBIGUOUS: <question> -> default <value>"' },
    docKinds: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page', 'why'] } },
    blockers: { type: 'array', items: { type: 'string' }, description: 'only what stops the work: no decision to implement, unknown engine or targets' },
  },
  required: ['decision', 'cases', 'mapping', 'api', 'selfTest', 'budget', 'measurable', 'ambiguous', 'docKinds'],
}
const BUILD = { type: 'object', properties: { green: { type: 'boolean' }, testFile: { type: 'string' }, selfTest: { type: 'string', description: 'the self-test command and its output summary' }, branch: { type: 'string' }, measured: { type: 'string', description: 'cost per tier in ms with device and capture, or "estimate: ..."' }, non_original: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' } }, required: ['green', 'testFile', 'selfTest', 'branch'] }
const ATTACK = { type: 'object', properties: { failures: { type: 'array', items: { type: 'object', properties: { problem: { type: 'string' }, testCode: { type: 'string' } }, required: ['problem', 'testCode'] } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['failures'] }
const FIX = { type: 'object', properties: { green: { type: 'boolean' }, failing: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['green', 'failing'] }
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages', 'undocumented'] }
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } }, measured: { type: 'string' }, notes: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }

const strings = (xs) => (Array.isArray(xs) ? xs.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [])
const notes = []

phase('Plan')
const plan = await agent(
  `You are the graphics-programmer implementing the rendering system "${system}". Onboard first (engineering-practices project-onboarding), then follow the graphics-programmer skills platform-scaling and frame-budget-profiling, headless-rendering for running the self-test on a machine with no GPU or display, and web-rendering if a target is a browser. Read ${spec}` +
  (given ? ` and this implementation plan from renderer-decision, which you take as the starting point:\n${given}\n` : '. ') +
  'The spec must hold a decision: the tiers, the technique and quality each feature gets per tier, a fallback for each, and costs. If it does not, put "no renderer decision to implement; run /graphics-programmer:renderer-decision first" in blockers. Never decide features or tiers yourself. ' +
  'Map every tier and feature to the engine setting or API that delivers it, from the engine\'s own documentation for the version the project uses, including which settings need a restart or a new viewport to take effect. Return every behaviour as a one-line test case, plan one headless self-test, take the cost budget per tier from the decision, and say whether you can measure on each tier\'s weakest device. ' +
  'State each gap as "AMBIGUOUS: <question> -> default <value>". Then plan documentation with the Diataxis compass: a new system owes reference for its interface and per-tier settings; an explanation if a design choice is made; a how-to if someone must do something new (add a tier, tune a setting). List the files you will change. Do not edit files.',
  { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!plan) return 'blocked: planning failed (no plan returned) for ' + system
const blockers = strings(plan.blockers)
if (blockers.length) return { status: 'blocked', stage: 'plan', open: blockers }
if (!Array.isArray(plan.cases) || !plan.cases.length) return 'blocked: planning returned no case list for ' + system
const ambiguous = strings(plan.ambiguous)
const docKinds = Array.isArray(plan.docKinds) ? plan.docKinds : []
log(`${plan.cases.length} cases, ${(plan.mapping || []).length} settings mapped, ${ambiguous.length} ambiguous, ${docKinds.length} doc pages planned`)

phase('Build')
const build = await agent(
  `Implement the rendering system "${system}" following the graphics-programmer skills platform-scaling and frame-budget-profiling and the project profile. ${where} ${NATIVE}\n` +
  `Public interface: ${plan.api}\nSettings per tier:\n- ${strings(plan.mapping).join('\n- ')}\n` +
  'Write failing tests for these cases first, in one test file for this system (unit tests for whatever does not need a running renderer, such as choosing a tier and building the settings for it), then the simplest code that passes, then refactor:\n- ' + plan.cases.join('\n- ') +
  `\nAdd the headless self-test so it runs wherever the project's test suite runs: ${plan.selfTest}. On a machine with no GPU or display, set rendering up per the graphics-programmer headless-rendering skill (the engine\'s headless mode may skip the renderer, so settings that only exist on a real renderer need a software renderer and a virtual display); a cost measured there is not a measurement: label it estimate. If running it in CI needs a pipeline change in a path another role owns, make the smallest change and say so in notes (engineering-practices peer-coordination).` +
  (ambiguous.length ? '\nImplement each stated default as a named value in the tier data and keep this list:\n- ' + ambiguous.join('\n- ') : '') +
  `\nMeasure the cost per tier against the budget (${plan.budget})` + (plan.measurable ? ' on each tier\'s weakest device or stand-in, in a release-like build, median and p95.' : '; no target device is reachable, so give a sourced estimate and label it "estimate".') +
  '\nLog every non-original item you add (third-party code, data or assets) per the engineering-practices provenance skill. Run the full test suite and the self-test with the project\'s commands. Commit with Conventional Commits. Return whether the suite and self-test are green, the test file path, the self-test command and its result, the branch name, the measured or estimated cost, and the non-original items added (empty if none).',
  { schema: BUILD, phase: 'Build', label: 'build' })
if (!build || !build.green) return 'blocked: build did not reach green for ' + system + (build && build.notes ? ': ' + build.notes : '')
if (build.notes) notes.push('build: ' + build.notes)

phase('Attack')
const lenses = [
  'tier fidelity: every tier applies exactly the decided technique and quality for every feature, and switching from a higher tier to a lower one leaves nothing from the higher one switched on (platform-scaling)',
  'fallbacks and platforms: every rendering backend and platform the project targets, including mobile and web; a feature off or unsupported gets its decided fallback, feature detection is used rather than assumptions, and nothing crashes or renders black (platform-scaling, web-rendering)',
  'runtime lifecycle: applying a tier at startup before the scene or viewport exists, switching at runtime and repeatedly, settings that need a restart or new viewport, resources freed on switch, a saved or overridden tier that is invalid or from an older version (platform-scaling)',
  `cost: ${plan.budget}; measure or estimate each tier on its weakest device or stand-in, and the hitch when switching tiers; report a failing test or benchmark when a tier is over its budget, and label estimates (frame-budget-profiling)`,
]
const attacks = await parallel(lenses.map((lens) => () => agent(
  `You are a graphics-programmer reviewer giving an independent review of the new rendering system "${system}", which you did not write. Try to break it through ${lens}. Spec: ${spec}. Do NOT edit any file. For each real problem, return a short description and the code of one failing test (or a self-test assertion) written for the project's test framework, ready to add to ${build.testFile}. Put only real, reproducible problems in failures; observations and ideas go in notes. Return an empty failures list if you find nothing.`,
  { schema: ATTACK, phase: 'Attack', label: 'attack:' + lens.split(':')[0].replace(/\s+/g, '-'), independent: true })))
const unverified = []
const failures = []
attacks.forEach((a, i) => {
  const name = lenses[i].split(':')[0]
  if (!a || !Array.isArray(a.failures)) unverified.push(name)
  else {
    a.failures.forEach((f) => failures.push(f))
    strings(a.notes).forEach((n) => notes.push(name + ': ' + n))
  }
})

if (failures.length) {
  phase('Fix')
  const fix = await agent(
    `Add these tests to ${build.testFile} in one edit, then fix the "${system}" code until they pass, keeping every existing test, the self-test and the tier data green. Follow the same skills and rules as the build: ${NATIVE} Commit.\n\n` +
    failures.map((f, i) => `${i + 1}. ${f.problem}\n${f.testCode}`).join('\n\n') +
    '\nReturn green (the full suite and the self-test pass), failing (each test or problem above that still fails after your fixes, one line each) and notes. ' + NOTES_RULE,
    { schema: FIX, phase: 'Fix', label: 'fix' })
  if (!fix) return { status: 'blocked', reason: 'fix agent failed', open: failures.map((f) => f.problem) }
  const failing = strings(fix.failing)
  strings(fix.notes).forEach((n) => notes.push('fix: ' + n))
  if (!fix.green || failing.length) return { status: 'blocked', open: failing.length ? failing : ['suite or self-test not green after fixes'], notes }
}

phase('Docs')
const docs = await agent(
  `Document the rendering system "${system}" in the same PR. Planned pages:\n` +
  (docKinds.length ? docKinds.map((d) => `- ${d.kind}: ${d.page} (${d.why})`).join('\n') : '- (none planned; re-run the compass)') +
  '\nThe reference page lists the public interface, every tier with the engine setting and value each feature gets, the fallbacks, the self-test command and the cost per tier (measured, or labelled estimate); link the renderer decision rather than copying its reasons. ' +
  DOCS_FRAGMENT + ' Also update the project contracts doc if the public interface is used by another role. Commit with a docs: or the feature commit per the project convention.',
  { schema: DOCS, phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'blocked', reason: 'docs step failed; code without its docs is not done' }

phase('Check')
const check = await agent(
  `You are a second graphics-programmer giving an independent check of the "${system}" work, which you did not write. 1) Run the full test suite and the headless self-test (${plan.selfTest}) with the project's commands. 2) Confirm the cost per tier is within the budget (${plan.budget}); the build reported ${build.measured || 'no measurement'}. A cost labelled estimate is a note, not a problem; a measured cost over budget is a problem. 3) Confirm each tier's settings in the code and data match the decision in ${spec}. ` +
  `4) For each touched docs page (${(docs.pages || []).join(', ') || 'none reported'}): it holds one Diataxis kind only, starts with a line saying its kind and audience, its title follows the pattern, and it links to the related pages of other kinds. Do not edit; report problems and notes separately. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.',
  { schema: CHECK, phase: 'Check', label: 'check', independent: true })
if (!check) return { status: 'unverified', reason: 'check agent failed', docs: docs.pages, unverifiedLenses: unverified, notes }
const problems = strings(check.problems)
strings(check.notes).forEach((n) => notes.push('check: ' + n))
if (problems.length) return { status: 'blocked', open: problems, notes }
if (!check.pass) return { status: 'blocked', open: ['check reported a failure without naming it; run the check again'], notes }

phase('Hand off')
const handoff = await agent(
  `Hand off the "${system}" work. ${where} Make sure every commit is pushed to the branch (${build.branch}); if no pull request is open for it, open a draft PR titled as a Conventional Commit${wp ? ` with "Refs: ${wp}" in the body` : ''}, listing the docs pages by Diataxis kind, the self-test command and the cost per tier (measured or estimate)${ambiguous.length ? ', and the defaults taken for ambiguous points' : ''}. Do not mark it ready, request review or merge: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, PR URL, head commit SHA, and whether the full suite and the self-test pass on that head.`,
  { schema: HANDOFF, phase: 'Hand off', label: 'handoff' })
if (!handoff || !handoff.branch) return { status: 'blocked', reason: 'hand-off failed; the work is committed on ' + build.branch + ' but may not be pushed', notes }
if (!handoff.tests_pass) return { status: 'blocked', open: ['suite or self-test not green on the pushed head' + (handoff.problem ? ': ' + handoff.problem : '')], notes }

const measured = check.measured || build.measured || ''
return {
  status: unverified.length ? 'unverified' : 'done',
  cases: plan.cases.length,
  ambiguous,
  attackTestsAdded: failures.length,
  unverifiedLenses: unverified,
  selfTest: plan.selfTest,
  measured,
  docs: docs.pages,
  undocumented: docs.undocumented,
  notes,
  handoff: {
    from: 'graphics-programmer:implement-renderer-system',
    branch: handoff.branch,
    pr: handoff.pr || '',
    head_sha: handoff.head_sha || '',
    tests_pass: true,
    docs: docs.pages || [],
    undocumented: docs.undocumented || [],
    non_original: strings(build.non_original),
    notes,
  },
  next: wp
    ? `ship it without rebuilding: /engineering-practices:deliver-package { wp: "${wp}", prior: <this result> }; after the code reviewer passes, /engineering-practices:land-pr { pr: "<the PR>" }`
    : `land it (it marks the PR ready, asks the code reviewer, polls CI and squash-merges once passed): /engineering-practices:land-pr ${handoff.pr ? `{ pr: "${handoff.pr}" }` : `{ branch: "${handoff.branch}" }`}`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
