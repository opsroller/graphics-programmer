// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'renderer-decision',
  description: 'Decide the rendering path and the per-tier rendering features (lighting, shadows, reflections, volumetrics, post, anti-aliasing, upscaling) for a set of quality tiers: list the options, evaluate each on the weakest target in parallel, decide, check the frame budget adds up, and document the decision. Called by a technical-artist visual target or on its own. args: { question: "what must be decided, e.g. which GI and reflections each tier gets", tiers?: "tier names, devices and frame-time targets, or where they are written", wants?: "the look the visual target asks for, per tier" }',
  phases: [
    { title: 'Plan', detail: 'tiers, budgets, candidate options per feature, docs plan (compass)' },
    { title: 'Evaluate', detail: 'one read-only agent per option: support per target, cost in ms, look, fallback' },
    { title: 'Decide', detail: 'renderer path and feature matrix per tier, with constraints for art' },
    { title: 'Check', detail: 'budgets add up per tier, every feature has a fallback, costs evidenced' },
    { title: 'Docs', detail: 'decision record and reference in the same PR, then verify one kind per page' },
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
    let note = null
    if (has(results, key)) {
      const gap = missing(results[key], op.schema)
      if (!gap) { out[key] = results[key]; return Promise.resolve(results[key]) }
      note = `answer missing ${gap}; answer this brief again`
    }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      return realAgent(prompt, opts).then((r) => { if (r !== null && r !== undefined) out[key] = r; return r })
    }
    next.push(note ? { key, phase: ph, prompt, schema: op.schema || null, note } : { key, phase: ph, prompt, schema: op.schema || null })
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
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, skipped, logs,
        how: 'Do each brief in next yourself, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args and run.results set to the merged results. Repeat until status is "done".',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v1 end (workflow body follows; close it with the tail line) ---

const question = args && args.question
if (!question) return 'usage: renderer-decision with args { question: "which GI, shadows and reflections each tier gets", tiers?: "high desktop 60 fps, mobile 30 fps, web 30 fps (or a docs path)", wants?: "the look per tier" }'
const tiers = (args && args.tiers) || 'not given: take them from the project profile or the visual target docs'
const wants = (args && args.wants) || 'not given: take them from the visual target docs or art direction, if any'

const DOCS_FRAGMENT = 'Classify every user-visible change with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs location, keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change left undocumented and why.'

// The shape the decision takes here and in the technical-artist visual-target
// workflow's Renderer step, so either can consume the other's answer.
const DECISION = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['decided', 'pending'], description: 'pending when it cannot be decided yet; openQuestions say why' },
    renderer: { type: 'string', description: 'rendering path or backend per tier, and why' },
    features: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          feature: { type: 'string', description: 'e.g. global illumination, shadows, reflections, volumetric fog, anti-aliasing, upscaling, post stack' },
          perTier: { type: 'string', description: 'technique and quality per tier, or off' },
          costMs: { type: 'string', description: 'GPU and CPU ms per tier on its weakest example device' },
          evidence: { type: 'string', description: 'capture, engine doc or benchmark behind the cost; say "estimate" when not measured' },
          fallback: { type: 'string', description: 'what replaces it where it is off or unsupported' },
        },
        required: ['feature', 'perTier', 'costMs', 'evidence', 'fallback'],
      },
    },
    constraints: { type: 'array', items: { type: 'string' }, description: 'what art must respect: e.g. lights per object, material features unavailable on a tier, baked vs dynamic lighting' },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'renderer', 'features', 'constraints'],
}

// ---------- Plan ----------
phase('Plan')
const PLAN = {
  type: 'object',
  properties: {
    tiers: { type: 'string', description: 'each tier: example weakest device, target fps, frame budget ms, render scale' },
    engine: { type: 'string', description: 'engine or framework and version, its rendering paths or backends, and which run on which target' },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'short kebab-case id, e.g. gi-probes' },
          feature: { type: 'string' },
          what: { type: 'string', description: 'the technique and the engine setting or path that provides it' },
        },
        required: ['name', 'feature', 'what'],
      },
      description: 'at most eight candidate options worth evaluating',
    },
    measurable: { type: 'boolean', description: 'a release-like build runs on each weakest tier device or its agreed stand-in' },
    docKinds: { type: 'array', items: { type: 'string' } },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['tiers', 'engine', 'options', 'measurable', 'docKinds'],
}
const plan = await agent(
  `You are the graphics-programmer deciding: "${question}". Follow engineering-practices project-onboarding, then the graphics-programmer skills platform-scaling and frame-budget-profiling.\n` +
  `Tiers: ${tiers}. Wanted look: ${wants}.\n` +
  'Write down each tier with its weakest example device, target frame rate, frame budget in ms and render scale. Name the engine and version and its rendering paths or backends, and which one each target platform can run, from the engine\'s own documentation. ' +
  'List the candidate options worth evaluating for each feature the question covers (at most eight in total, the realistic ones only), including the cheap fallback for each feature. ' +
  'Say whether you can measure on each weakest device or its agreed stand-in; if not, costs will be estimates and must be labelled so. List which documentation kinds the decision will affect using the Diataxis compass. ' +
  'If tiers or targets are missing from the project and from the args, propose them and return them, do not block; block only if the engine or targets are unknown.',
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'blocked: planning failed (no result returned).'
if (plan.blockers && plan.blockers.length) return { status: 'blocked', stage: 'plan', blockers: plan.blockers }
const options = (plan.options || []).slice(0, 8)
if (!options.length) return { status: 'blocked', stage: 'plan', blockers: ['no candidate options were named'] }

// ---------- Evaluate (parallel, read only) ----------
phase('Evaluate')
const EVAL = {
  type: 'object',
  properties: {
    option: { type: 'string' },
    support: { type: 'string', description: 'which tiers and platforms support it, with the source' },
    costMs: { type: 'string', description: 'GPU and CPU ms per tier on the weakest device' },
    evidence: { type: 'string', description: 'capture, engine doc or benchmark; "estimate" when not measured' },
    look: { type: 'string', description: 'what it gives the image and what goes wrong (leaks, noise, ghosting, popping)' },
    artCost: { type: 'string', description: 'what it asks of content: baking, probes, material limits, light counts' },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['option', 'support', 'costMs', 'evidence', 'look'],
}
const evals = await parallel(options.map((o) => () => agent(
  `You are a graphics-programmer evaluating one option for "${question}": ${o.name} (${o.feature}): ${o.what}.\n` +
  `Engine: ${plan.engine}. Tiers: ${plan.tiers}. Measurable on target: ${plan.measurable}.\n` +
  'Follow frame-budget-profiling and platform-scaling. Check platform support in the engine\'s documentation. If you can measure, build a small probe scene in a scratch location outside the project tree and capture its cost in ms on each tier\'s weakest device or stand-in (median and p95); otherwise give a sourced estimate and label it "estimate". ' +
  'Describe what it does to the image and what it asks of art content. Do NOT modify project files.',
  { schema: EVAL, phase: 'Evaluate', label: `evaluate:${o.name}` },
)))
const evaluated = options.map((o, i) => evals[i] || { option: o.name, unverified: true })
const unevaluated = evaluated.filter((e) => e.unverified).map((e) => e.option)

// ---------- Decide ----------
phase('Decide')
const decide = (round, problems) => agent(
  `You are the graphics-programmer deciding: "${question}". Tiers: ${plan.tiers}. Engine: ${plan.engine}. Wanted look: ${wants}.\n` +
  `Evaluations:\n${JSON.stringify(evaluated, null, 2)}\n` +
  (problems ? `A check of your previous decision found these problems; fix every one:\n${JSON.stringify(problems)}\n` : '') +
  'Pick the rendering path per tier and, for each feature, the technique per tier, building up from the weakest tier. Spend headroom first on what keeps the play area readable, then on richness. ' +
  'Every feature has a fallback where it is off or unsupported. Carry each cost and its evidence over from the evaluations; never present an estimate as measured. ' +
  'State the constraints art content must respect. Return status "pending" with openQuestions only if something outside your role must be answered first (for example a target device nobody has agreed).',
  { schema: DECISION, phase: 'Decide', label: `decide:${round}` },
)
let decision = await decide(1)
if (!decision) return { status: 'blocked', stage: 'decide', open: ['decision agent returned nothing'], evaluated }
if (decision.status === 'pending') return { status: 'pending', decision, openQuestions: decision.openQuestions || [], unevaluated }

// ---------- Check (one fix round) ----------
phase('Check')
const CHECK = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' } },
    perTierTotals: { type: 'string', description: 'sum of feature costs per tier against its frame budget' },
  },
  required: ['ok', 'perTierTotals'],
}
const checkPrompt = (d) =>
  `You are a second graphics-programmer checking a renderer decision for "${question}". Tiers: ${plan.tiers}.\n` +
  `Decision:\n${JSON.stringify(d, null, 2)}\n` +
  'Add up the feature costs per tier and compare with the frame budget, leaving room for the game\'s own CPU work and content. Check that every feature has a fallback, every tier runs the chosen path on its platforms, every cost has evidence and estimates are labelled, and the constraints are concrete enough for art to follow. Report problems; do not edit files.'
let check = await agent(checkPrompt(decision), { schema: CHECK, phase: 'Check', label: 'check:1' })
if (check && !check.ok && check.problems && check.problems.length) {
  const revised = await decide(2, check.problems)
  if (revised) decision = revised
  check = await agent(checkPrompt(decision), { schema: CHECK, phase: 'Check', label: 'check:2' })
}
if (!check) return { status: 'unverified', stage: 'check', decision, note: 'budget check returned nothing' }
if (!check.ok) return { status: 'blocked', stage: 'check', open: check.problems || [], decision }

// ---------- Docs ----------
phase('Docs')
const docs = await agent(
  `You are the graphics-programmer documenting the renderer decision for "${question}". Planned doc kinds: ${JSON.stringify(plan.docKinds)}.\n` +
  `Decision:\n${JSON.stringify(decision, null, 2)}\nTotals: ${check.perTierTotals}\n` +
  DOCS_FRAGMENT + ' Typical: the per-tier rendering path, feature matrix, costs and constraints as a reference page ("Device tiers and quality settings" or the project\'s equivalent); the choices and rejected options with their reasons as an explanation (or the project\'s decision-record format). Use the project\'s docs location from its profile.',
  { phase: 'Docs', label: 'docs' },
)
if (!docs) return { status: 'blocked', stage: 'docs', open: ['docs writer returned nothing'], decision }
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok'] }
const docCheck = await agent(
  `Review the documentation pages just written for the renderer decision (writer's report: ${JSON.stringify(docs)}). Check one Diataxis kind per page, title patterns (how-to names a goal; explanation reads with "About"), reference format matches siblings, links between kinds, and that the numbers match the decision. Fix small problems; report what remains.`,
  { schema: DOCCHECK, phase: 'Docs', label: 'docs check' },
)
return {
  status: !docCheck ? 'done-docs-unverified' : !docCheck.ok ? 'blocked' : unevaluated.length ? 'unverified' : 'decided',
  decision,
  perTierTotals: check.perTierTotals,
  unevaluated,
  docProblems: docCheck ? (docCheck.problems || []) : ['docs check returned nothing'],
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
