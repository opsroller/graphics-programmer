// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'build-measurement-tool',
  description: 'Build a tool that measures a build against its budgets and acceptance criteria, such as a benchmark scene with a repeatable scenario, frame-time percentile capture, automated acceptance checks (readability, contrast) on captures, and a tier feature check: plan the scenario, measurements, report and checks, build it test-first with every check proven on a known-good and a known-bad input, run it where it can run, attack it for validity, fix, document it in the same PR and push it as a handoff for engineering-practices deliver-package or land-pr. args: { tool: "<what it measures>", spec: "<budgets, acceptance criteria or tier tables, paths or sections>", targets?: "<devices or tiers to run on>", wp?: "<work package id>", branch?: "<existing branch>", pr?: "<existing PR>" }',
  phases: [
    { title: 'Plan', detail: 'scenario, samples and percentiles, report schema, one check per criterion with sourced thresholds, where it runs (compass for docs)' },
    { title: 'Build', detail: 'failing tests first (pure parts and each check on good and bad inputs), then the tool, until green' },
    { title: 'Run', detail: 'run it end to end where it can run; software-rendered numbers labelled; content failures are findings, not tool bugs' },
    { title: 'Attack', detail: 'parallel independent read-only attempts to break its validity; each returns failing test code' },
    { title: 'Fix', detail: 'one agent adds the attack tests and fixes the tool; only tests still failing block, notes never do' },
    { title: 'Docs', detail: 'reference for the tool and its report, a how-to per place it runs' },
    { title: 'Check', detail: 'independent: suite green, smoke run, every check fails its bad input, each touched page one kind' },
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

const USAGE = 'usage: build-measurement-tool { tool: "<what it measures, e.g. benchmark scene and readability checks>", spec: "<budgets, acceptance criteria or tier tables, paths or sections>", targets: "<devices or tiers to run on, optional>", wp: "<work package id, optional>", branch: "<existing branch, optional>", pr: "<existing PR, optional>" }'
if (!args || !args.tool || !args.spec) return USAGE
const tool = String(args.tool)
const spec = String(args.spec)
const targets = args.targets ? String(args.targets) : 'the targets and tiers in the project profile'
const wp = args.wp ? String(args.wp) : ''
const where = args.pr
  ? `Work on the existing PR ${args.pr} and its head branch; do not create a new branch or PR.`
  : args.branch
    ? `Work on the existing branch ${args.branch} (reuse its open PR if one exists); do not create a new branch.`
    : 'Work on the current feature branch; if you are on the default branch, cut a Conventional branch (feat/<slug>) from the latest remote default branch.'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs location (per the project profile), keep each page to one kind, title it by the project pattern (how-to names a goal, explanation reads "About ...", reference is named for the thing), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

// Only failures of the tool block. A check that fails on the current game
// content is the tool doing its job: it is a finding for the content's
// owner, never a blocker for the tool.
const NOTES_RULE = 'Put a problem in the blocking list only if it is a failure of the tool you can point to: a test that still fails, a suite or check that is red, a check that passes its known-bad input or fails its known-good one, a run that crashes or writes no report. A check that fails on the current game content is a finding for its owner, not a problem. Everything else (observations, follow-up ideas, questions, things already fixed, "nothing found") goes in notes, never in the blocking list; an empty blocking list means done.'

// Pure parts (statistics, scenario planning, check logic) stay free of the
// engine so they test fast; in-engine parts follow the project's rules for
// engine-side code, and offline checks the project's language for tools.
const NATIVE = 'Keep the parts that need no running engine (percentiles, scenario planning, check logic on images or reports) free of the engine, so they are unit tested with synthetic inputs. Write in-engine parts in the language and location the project profile names for engine-side code, never in a scripting or web layer the profile rules out for logic; scene or config files may only wire them up. Write offline checks in the language the profile names for tools. Every threshold is a named option with a default and a comment or doc naming who owns its value.'

const HEADLESS = 'If the machine has no GPU or no display, set rendering up per the graphics-programmer headless-rendering skill: the engine\'s headless mode draws nothing, so runs that need frames use a software renderer and a virtual display, and any frame time from a software renderer is labelled "software renderer, not a measurement".'

const PLAN = {
  type: 'object',
  properties: {
    criteria: { type: 'string', description: 'where the budgets, acceptance criteria and tier tables are written, or "missing"' },
    scenario: { type: 'string', description: 'the fixed, repeatable scenario: what it plays (the worst case the spec cares about), how it is made deterministic (seed, scripted input or replay), how a run detects that it drifted, warm-up and capture lengths' },
    samples: { type: 'array', items: { type: 'string' }, description: 'each per-frame sample and the engine API it comes from (CPU, GPU, wall-clock frame time; draw calls, primitives, memory), and how missing GPU timing is reported' },
    stats: { type: 'string', description: 'the statistics per sample (median, p95, p99, max, frames over budget), the percentile method, and the budget each is compared with' },
    report: { type: 'string', description: 'the report: machine-readable, versioned schema, device and build info (engine version, backend, adapter, resolution, build type, software-rendered or not), and how it is read where files are hard to reach' },
    checks: { type: 'array', items: { type: 'object', properties: { criterion: { type: 'string' }, method: { type: 'string' }, threshold: { type: 'string' }, owner: { type: 'string', description: 'role that owns the threshold value' }, bad: { type: 'string', description: 'the known-bad input that must fail it' } }, required: ['criterion', 'method', 'threshold', 'owner', 'bad'] }, description: 'one automated check per acceptance criterion or tier feature row' },
    manual: { type: 'array', items: { type: 'string' }, description: 'criteria that cannot be checked automatically, and why' },
    runs: { type: 'array', items: { type: 'string' }, description: 'each place it runs (desktop, phone, browser, CI smoke run, this machine) with the command or steps and what that run can and cannot prove' },
    cases: { type: 'array', items: { type: 'string' }, description: 'one-line test cases: statistics edge cases, scenario determinism, each check on its good and bad input, report schema, exit status' },
    files: { type: 'array', items: { type: 'string' } },
    ambiguous: { type: 'array', items: { type: 'string' }, description: 'each "AMBIGUOUS: <question> -> default <value>"' },
    docKinds: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page', 'why'] } },
    blockers: { type: 'array', items: { type: 'string' }, description: 'only what stops the work: nothing says what to measure or accept, unknown engine or targets' },
  },
  required: ['criteria', 'scenario', 'samples', 'stats', 'report', 'checks', 'runs', 'cases', 'ambiguous', 'docKinds'],
}
const BUILD = { type: 'object', properties: { green: { type: 'boolean' }, testFile: { type: 'string' }, branch: { type: 'string' }, commands: { type: 'array', items: { type: 'string' }, description: 'the commands that run the tool and its checks' }, non_original: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' } }, required: ['green', 'testFile', 'branch', 'commands'] }
const RUN_SCHEMA = {
  type: 'object',
  properties: {
    ran: { type: 'array', items: { type: 'object', properties: { where: { type: 'string', description: 'machine, backend and adapter' }, software: { type: 'boolean', description: 'frames were software-rendered' }, report: { type: 'string', description: 'path of the report or captures' }, summary: { type: 'string', description: 'key numbers and check results, software frame times labelled' } }, required: ['where', 'software', 'summary'] } },
    findings: { type: 'array', items: { type: 'string' }, description: 'checks that fail on the current game content, each with the owning role' },
    problems: { type: 'array', items: { type: 'string' }, description: 'failures of the tool itself' },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['ran', 'findings', 'problems'],
}
const ATTACK = { type: 'object', properties: { failures: { type: 'array', items: { type: 'object', properties: { problem: { type: 'string' }, testCode: { type: 'string' } }, required: ['problem', 'testCode'] } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['failures'] }
const FIX = { type: 'object', properties: { green: { type: 'boolean' }, failing: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['green', 'failing'] }
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages', 'undocumented'] }
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }

const strings = (xs) => (Array.isArray(xs) ? xs.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [])
const notes = []

phase('Plan')
const plan = await agent(
  `You are the graphics-programmer building the measurement tool "${tool}". Onboard first (engineering-practices project-onboarding), then follow the graphics-programmer skills frame-budget-profiling, platform-scaling and headless-rendering, and web-rendering if a target is a browser. Read ${spec}. It must say what to measure or accept: budgets per tier, acceptance criteria, or tier feature tables. If nothing does, put "nothing says what to measure; get budgets (/graphics-programmer:renderer-decision) or acceptance criteria (the technical artist's visual target) first" in blockers. Never invent a budget or a criterion; the tool implements and runs them. ` +
  'Plan: one fixed, repeatable scenario that plays the worst case the spec cares about, made deterministic (seed, scripted input or replay) with a way to detect a run that drifted; warm-up and capture lengths; each per-frame sample with its engine API, from the engine\'s documentation for the version the project uses; percentiles (state the method) and frames over budget; a versioned machine-readable report with device and build info, including whether frames were software-rendered and whether GPU timing was available. ' +
  'Turn each acceptance criterion and tier feature row into one automated check with a method, a threshold taken from the spec (a named default when the spec gives none, listed as AMBIGUOUS, owned by the role that owns the criterion, usually the technical artist who calibrates it against captures), and a known-bad input that must fail it. List criteria that cannot be automated as manual. ' +
  `List each place it runs (${targets}, a CI smoke run that checks the tool works and measures nothing, and this machine) with what that run can and cannot prove. Return every behaviour as a one-line test case. State each gap as "AMBIGUOUS: <question> -> default <value>". ` +
  'Plan documentation with the Diataxis compass: a tool owes reference for its files, scenario, samples, report fields and checks with thresholds, and a how-to per place someone runs it; an explanation only if a design choice is made. List the files you will change. Do not edit files.',
  { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!plan) return 'blocked: planning failed (no plan returned) for ' + tool
const blockers = strings(plan.blockers)
if (blockers.length) return { status: 'blocked', stage: 'plan', open: blockers }
if (!Array.isArray(plan.cases) || !plan.cases.length) return 'blocked: planning returned no case list for ' + tool
const checks = Array.isArray(plan.checks) ? plan.checks : []
const ambiguous = strings(plan.ambiguous)
const docKinds = Array.isArray(plan.docKinds) ? plan.docKinds : []
log(`${plan.cases.length} cases, ${checks.length} checks, ${strings(plan.manual).length} manual criteria, ${strings(plan.runs).length} run places, ${ambiguous.length} ambiguous, ${docKinds.length} doc pages planned`)

phase('Build')
const build = await agent(
  `Build the measurement tool "${tool}" following the graphics-programmer skills frame-budget-profiling and headless-rendering and the project profile. ${where} ${NATIVE}\n` +
  `Scenario: ${plan.scenario}\nSamples:\n- ${strings(plan.samples).join('\n- ')}\nStatistics: ${plan.stats}\nReport: ${plan.report}\n` +
  'Checks (each must fail its known-bad input and pass a known-good one, in a test):\n' +
  (checks.length ? checks.map((c) => `- ${c.criterion}: ${c.method}; threshold ${c.threshold} (owner ${c.owner}); bad input: ${c.bad}`).join('\n') : '- (none planned)') +
  '\nWrite failing tests for these cases first, in one test file for this tool (synthetic inputs: known sample series for the statistics, small generated images or reports for the checks), then the simplest code that passes, then refactor:\n- ' + plan.cases.join('\n- ') +
  '\nThe tool exits non-zero when a run fails or a check fails, and says which. Add the CI smoke run so it runs wherever the project\'s test suite runs; if that needs a pipeline change in a path another role owns, make the smallest change and say so in notes (engineering-practices peer-coordination). ' + HEADLESS +
  (ambiguous.length ? '\nImplement each stated default as a named option and keep this list:\n- ' + ambiguous.join('\n- ') : '') +
  '\nLog every non-original item you add (third-party code, data or assets) per the engineering-practices provenance skill. Run the full test suite with the project\'s commands. Commit with Conventional Commits. Return whether the suite is green, the test file path, the branch name, the commands that run the tool and its checks, and the non-original items added (empty if none).',
  { schema: BUILD, phase: 'Build', label: 'build' })
if (!build || !build.green) return 'blocked: build did not reach green for ' + tool + (build && build.notes ? ': ' + build.notes : '')
if (build.notes) notes.push('build: ' + build.notes)

phase('Run')
const run = await agent(
  `Run the measurement tool "${tool}" end to end with these commands, on every place in this list you can reach from here, and on this machine:\n- ${strings(build.commands).join('\n- ')}\nPlaces: ${strings(plan.runs).join('; ')}. ${HEADLESS} ` +
  'For each run, verify the report records the engine version, backend, adapter and resolution, that captures are the size asked for and not blank, and that the scenario did not drift. Return each run with where it ran, whether frames were software-rendered, the report path and a summary of the key numbers and check results. ' +
  'A check that fails on the current game content goes in findings with the role that owns that content (it is the tool working); a crash, a missing or malformed report, a drifted scenario or a check that cannot run goes in problems. Do not change the tool or the content in this step; do not edit files. ' + NOTES_RULE,
  { schema: RUN_SCHEMA, phase: 'Run', label: 'run' })
if (!run) return { status: 'blocked', reason: 'run step failed; the tool was never run end to end', notes }
const runProblems = strings(run.problems)
const findings = strings(run.findings)
strings(run.notes).forEach((n) => notes.push('run: ' + n))
const ran = Array.isArray(run.ran) ? run.ran : []
if (!ran.length) runProblems.push('the tool did not run anywhere')

phase('Attack')
const lenses = [
  'measurement validity: the scenario is deterministic and a drifted run is reported; warm-up frames are excluded; percentiles are right on edge cases (no samples, one sample, ties); units are ms; each sample comes from the frame it describes; missing GPU timing is reported as missing, never as 0 ms (frame-budget-profiling)',
  'check correctness: every check fails its known-bad input and passes a known-good one; a missing file, empty region or unreadable report fails rather than passes; thresholds are named options with sourced defaults; no check measures something other than its criterion',
  'tier coverage: every row of the tier feature tables and every acceptance criterion in the spec has a check or is listed as manual; an unknown tier or a feature the tool cannot read is reported, not silently passed (platform-scaling)',
  `environments: each place it runs (${strings(plan.runs).join('; ')}); runs without a GPU or display label software frame times and use a real software renderer rather than the engine's headless mode; the window size is honoured; exit status reflects failures; a CI smoke run stays short (headless-rendering, web-rendering)`,
]
const attacks = await parallel(lenses.map((lens) => () => agent(
  `You are a graphics-programmer reviewer giving an independent review of the new measurement tool "${tool}", which you did not write. Try to break it through ${lens}. Spec: ${spec}. Do NOT edit any file. For each real problem, return a short description and the code of one failing test written for the project's test framework, ready to add to ${build.testFile}. Put only real, reproducible problems in failures; observations and ideas go in notes. Return an empty failures list if you find nothing.`,
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

if (failures.length || runProblems.length) {
  phase('Fix')
  const fix = await agent(
    `Fix the measurement tool "${tool}". ${failures.length ? `Add these tests to ${build.testFile} in one edit, then fix the code until they pass` : 'Fix the code'}, keeping every existing test green. Follow the same skills and rules as the build: ${NATIVE} ${HEADLESS} Commit.\n\n` +
    failures.map((f, i) => `${i + 1}. ${f.problem}\n${f.testCode}`).join('\n\n') +
    (runProblems.length ? '\n\nProblems from running it end to end; rerun it after fixing:\n- ' + runProblems.join('\n- ') : '') +
    '\nReturn green (the full suite passes and the tool runs), failing (each test or problem above that still fails after your fixes, one line each) and notes. ' + NOTES_RULE,
    { schema: FIX, phase: 'Fix', label: 'fix' })
  if (!fix) return { status: 'blocked', reason: 'fix agent failed', open: failures.map((f) => f.problem).concat(runProblems) }
  const failing = strings(fix.failing)
  strings(fix.notes).forEach((n) => notes.push('fix: ' + n))
  if (!fix.green || failing.length) return { status: 'blocked', open: failing.length ? failing : ['suite not green or tool not running after fixes'], findings, notes }
}

phase('Docs')
const docs = await agent(
  `Document the measurement tool "${tool}" in the same PR. Planned pages:\n` +
  (docKinds.length ? docKinds.map((d) => `- ${d.kind}: ${d.page} (${d.why})`).join('\n') : '- (none planned; re-run the compass)') +
  '\nThe reference page lists the files, the scenario, every sample and its source, the statistics, every report field, and every check with its threshold, option name and owner; link the budgets and criteria rather than copying their reasons. Each how-to gives the steps for one place it runs and says what numbers from there do not mean (a machine with no GPU measures nothing). ' +
  DOCS_FRAGMENT + ' Commit with a docs: or the feature commit per the project convention.',
  { schema: DOCS, phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'blocked', reason: 'docs step failed; a tool without its docs is not done', findings, notes }

phase('Check')
const check = await agent(
  `You are a second graphics-programmer giving an independent check of the measurement tool "${tool}", which you did not write. 1) Run the full test suite with the project's commands. 2) Run the CI smoke command among these and confirm it exits 0 and writes a report that matches the documented schema: ${strings(build.commands).join('; ')}. ${HEADLESS} 3) For each check, confirm a test proves it fails its known-bad input and passes a known-good one, and that its threshold matches ${spec} or is a named, documented default. ` +
  `4) For each touched docs page (${(docs.pages || []).join(', ') || 'none reported'}): it holds one Diataxis kind only, starts with a line saying its kind and audience, its title follows the pattern, and it links to the related pages of other kinds. A check failing on game content is a note, not a problem. Do not edit anything; report problems and notes separately. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.',
  { schema: CHECK, phase: 'Check', label: 'check', independent: true })
if (!check) return { status: 'unverified', reason: 'check agent failed', docs: docs.pages, unverifiedLenses: unverified, findings, notes }
const problems = strings(check.problems)
strings(check.notes).forEach((n) => notes.push('check: ' + n))
if (problems.length) return { status: 'blocked', open: problems, findings, notes }
if (!check.pass) return { status: 'blocked', open: ['check reported a failure without naming it; run the check again'], findings, notes }

phase('Hand off')
const handoff = await agent(
  `Hand off the "${tool}" work. ${where} Make sure every commit is pushed to the branch (${build.branch}); if no pull request is open for it, open a draft PR titled as a Conventional Commit${wp ? ` with "Refs: ${wp}" in the body` : ''}, listing the docs pages by Diataxis kind, the commands to run the tool, where it was run and whether those frames were software-rendered (software frame times are not measurements)${findings.length ? ', the findings on current content and the roles they go to' : ''}${ambiguous.length ? ', and the defaults taken for ambiguous points' : ''}. Do not mark it ready, request review or merge: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, PR URL, head commit SHA, and whether the full suite passes on that head.`,
  { schema: HANDOFF, phase: 'Hand off', label: 'handoff' })
if (!handoff || !handoff.branch) return { status: 'blocked', reason: 'hand-off failed; the work is committed on ' + build.branch + ' but may not be pushed', findings, notes }
if (!handoff.tests_pass) return { status: 'blocked', open: ['suite not green on the pushed head' + (handoff.problem ? ': ' + handoff.problem : '')], findings, notes }

return {
  status: unverified.length ? 'unverified' : 'done',
  cases: plan.cases.length,
  checks: checks.map((c) => c.criterion),
  manual: strings(plan.manual),
  ambiguous,
  attackTestsAdded: failures.length,
  unverifiedLenses: unverified,
  commands: strings(build.commands),
  ran,
  findings,
  docs: docs.pages,
  undocumented: docs.undocumented,
  notes,
  handoff: {
    from: 'graphics-programmer:build-measurement-tool',
    branch: handoff.branch,
    pr: handoff.pr || '',
    head_sha: handoff.head_sha || '',
    tests_pass: true,
    docs: docs.pages || [],
    undocumented: docs.undocumented || [],
    non_original: strings(build.non_original),
    notes,
  },
  next: (findings.length ? 'send each finding to the role named with it (engineering-practices peer-coordination); thresholds are tuned by their owner, not by changing the tool. ' : '') + (wp
    ? `ship it without rebuilding: /engineering-practices:deliver-package { wp: "${wp}", prior: <this result> }; after the code reviewer passes, /engineering-practices:land-pr { pr: "<the PR>" }`
    : `land it (it marks the PR ready, asks the code reviewer, polls CI and squash-merges once passed): /engineering-practices:land-pr ${handoff.pr ? `{ pr: "${handoff.pr}" }` : `{ branch: "${handoff.branch}" }`}`),
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
