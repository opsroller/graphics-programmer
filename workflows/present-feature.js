// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'present-feature',
  description: 'Build the presentation for a game feature end to end: plan scene, camera, event-to-animation beats, input actions, look-dev frames, measurement and placeholder art, capture before frames, implement, capture after frames, check feel, input, readability (against the project\'s visual acceptance checks when it has them), look, art hookup and frame time on each target in parallel, fix, document in the same PR, and push it as a handoff for engineering-practices deliver-package or land-pr. Perf with no device can be deferred to a named benchmark or measurement package as a follow-up. Use when a feature already has a design spec and logic events; kind "backdrop" presents a non-interactive background element driven by time instead (no events or input; a check that it does not compete with foreground play). args: { feature: "short name, e.g. item pickup", spec?: "path to the design spec", kind?: "event" | "backdrop", targets?: ["weakest supported phone", "desktop"], capture?: true, perf?: { defer_to?: "<benchmark or measurement package that will measure it>", hook?: "<existing measurement command or scene>" } }',
  phases: [
    { title: 'Plan', detail: 'presentation plan, look-dev frames, measurement, placeholder art and docs plan (compass)' },
    { title: 'Before', detail: 'capture the look-dev frames on the base commit (technical-artist lookdev-capture, headless-rendering)' },
    { title: 'Build', detail: 'one agent implements the plan, placeholder art behind manifest keys' },
    { title: 'Capture', detail: 'capture the same frames on the working tree, each verify round' },
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

const USAGE = 'usage: present-feature { feature: "short name", spec?: "path/to/spec.md", kind?: "event" | "backdrop", targets?: ["weakest supported phone", "desktop"], capture?: true, perf?: { defer_to?: "<benchmark or measurement package>", hook?: "<existing measurement command or scene>" } }'
if (!args || !args.feature) return USAGE
const feature = args.feature
const spec = args.spec ? `The design spec is at ${args.spec}.` : 'Find the design spec for this feature through the project profile; if none exists, stop and say so.'
const targets = Array.isArray(args.targets) && args.targets.length ? args.targets : ['the weakest supported device in the project profile', 'desktop']
const wantCapture = args.capture !== false
const backdrop = args.kind === 'backdrop'
const perfArg = args.perf && typeof args.perf === 'object' ? args.perf : {}
const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map(String) : [])

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLACEHOLDER = {
  type: 'object',
  properties: {
    key: { type: 'string', description: 'stable manifest key the code loads it by; final art keeps the key' },
    path: { type: 'string', description: 'placeholder file path, named by the convention' },
    manifest: { type: 'string', description: 'manifest or override file the key is registered in' },
    stands_for: { type: 'string', description: 'the final art it stands for and what the code depends on: size, pivot, material slots, animation or marker names' },
  },
  required: ['key', 'path', 'manifest', 'stands_for'],
}
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
    lookdev: {
      type: 'object',
      properties: {
        possible: { type: 'boolean' },
        why: { type: 'string', description: 'why frames cannot be captured, when possible is false' },
        frames: { type: 'array', items: { type: 'string' }, description: 'each "scene / camera / beat and frame / renderer or tier"' },
        command: { type: 'string', description: 'the headless capture command, with size and frame' },
        outDir: { type: 'string', description: 'where frames go, outside the repository unless the project says otherwise' },
      },
      required: ['possible'],
    },
    acceptance: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', description: 'true if the project has automated visual acceptance checks' },
        command: { type: 'string', description: 'the command that runs them on frames' },
        criteria: { type: 'array', items: { type: 'string' }, description: 'readability criteria from the visual target that apply to this feature' },
      },
      required: ['exists'],
    },
    measurement: {
      type: 'object',
      properties: {
        hook: { type: 'string', description: 'existing benchmark scene, frame-time capture command or profiler markers the perf checks run; empty if none' },
        newHooks: { type: 'array', items: { type: 'string' }, description: 'profiler markers or scoped timers this work adds around the feature' },
        defer_to: { type: 'string', description: 'benchmark or measurement package (work package id or tool) that measures this feature on real targets; empty if none' },
      },
    },
    placeholders: { type: 'array', items: PLACEHOLDER, description: 'one per visual asset whose final art does not exist yet' },
    naming: { type: 'string', description: 'the placeholder naming convention used (project convention plus placeholder marker)' },
    docsPlan: { type: 'array', items: { type: 'string' }, description: 'each entry: kind + page path + what changes' },
    missing: { type: 'array', items: { type: 'string' }, description: 'contract gaps that block the work' },
    shader_only: { type: 'boolean', description: 'backdrop only: true when the work is only the shader look, with nothing to wire into scene, layers, settings or budget' },
  },
  required: ['events', 'beats', 'files', 'lookdev', 'acceptance', 'placeholders', 'docsPlan', 'missing'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    area: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
    minor: { type: 'array', items: { type: 'string' } },
    measured: { type: 'boolean', description: 'true if numbers or judgements came from a real run (a device for perf, rendered frames for look and readability), false if estimated' },
  },
  required: ['area', 'blockers', 'minor', 'measured'],
}
const FRAMES = { type: 'object', properties: { frames: { type: 'array', items: { type: 'string' }, description: 'each "path: what it shows, size, renderer and driver"' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['frames'] }

phase('Plan')
const plan = await agent(
  `You are the graphics-programmer. Onboard first (engineering-practices project-onboarding). Plan the presentation of "${feature}". ${spec}
Follow the graphics-programmer skills event-presentation (event contract, event-to-beat table), scene-composition, camera-systems, input-handling and frame-budget-profiling. Targets: ${targets.join('; ')}.
${backdrop ? 'This is a backdrop: a non-interactive environment or background element driven by time, not by game events. Consume no logic events and map no input (leave events and inputActions empty, and missing empty unless the spec lacks what the look needs). In beats, give its time-driven motion from the spec (loop period, speeds, parameters) and the fixed times across the loop to capture. Plan its layer and draw order behind the play area, its time source (the presentation clock, paused with the game), a reduced-motion setting, a cheaper or static fallback per quality tier, and its full-screen cost. When the work is only the shader\'s look, with nothing to wire into scene, layers, settings or budget, set shader_only true: that work belongs to technical-artist author-shader.' : 'List the logic events you will consume and any data they lack (put contract gaps in "missing"; never plan to read live logic state).'} List the files you will change.
Look-dev frames${wantCapture ? '' : ' (capture is off for this run; set lookdev.possible false with why "capture: false")'}: plan them with the technical-artist lookdev-capture skill (what to frame and judge) and the graphics-programmer headless-rendering skill (getting frames out of a machine with no GPU or display). Frame the gameplay camera on the feature's key beats held at fixed times (for example the start, peak and settle of each beat), in the scene the feature plays in, on every renderer or quality tier the project ships. Give the capture command, size, frame and output directory. Set possible false with the reason only if the project or this machine cannot render after following headless-rendering.
Visual acceptance: find the project's automated visual acceptance checks (its visual target, checks built with technical-artist calibrate-visual-checks or graphics-programmer build-measurement-tool) and the command that runs them on frames; list the readability criteria that apply to this feature. Set exists false if the project has none.
Measurement: name an existing measurement hook the perf checks can run for this feature (benchmark scene, frame-time capture command, profiler markers), any markers or timers this work adds around the feature's update and draw, and the benchmark or measurement package that measures it on the real targets when no device is reachable here${perfArg.defer_to ? ` (the caller names "${perfArg.defer_to}")` : ''}${perfArg.hook ? `; the caller names the hook "${perfArg.hook}"` : ''}. Leave a field empty when none exists; never invent one.
Placeholder art: for every visual asset the feature needs whose final art does not exist yet (meshes, textures, materials, effects, sprites), plan a placeholder. Register each under a stable key in the project's asset manifest (project profile; the technical-artist owns its format) or, if the project has none, in an override manifest next to the feature's presentation data that the code reads first. The code loads every visual asset by key, never by path, so final art replaces a placeholder by changing its file and manifest entry with no code change. Name placeholder files by the project's asset naming convention with a placeholder marker (fallback when the project has none: <key>.placeholder.<ext>). For each, say what the final art must keep for the code to work (size or bounds, pivot, material slots, animation or marker names). An empty list is fine when all art exists.
Docs plan: ${DOCS_FRAGMENT} Here only plan: list each page (kind, path, change). Do not edit anything yet.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' },
)
if (!plan) return 'blocked: planning failed (no plan returned)'
if (backdrop && plan.shader_only === true) return `blocked: "${feature}" is shader-only work (the look, with nothing to wire into scene, layers, settings or budget); it belongs to the technical-artist: /technical-artist:author-shader`
if (plan.missing && plan.missing.length) return `blocked: the event contract is incomplete; ask the gameplay-programmer for:\n- ${plan.missing.join('\n- ')}`

const look = plan.lookdev || { possible: false }
const capturing = wantCapture && !!look.possible
const acceptance = plan.acceptance || { exists: false }
const measurement = plan.measurement || {}
const hook = String(perfArg.hook || measurement.hook || '')
const deferTo = String(perfArg.defer_to || measurement.defer_to || '')
const placeholders = Array.isArray(plan.placeholders) ? plan.placeholders.filter((p) => p && p.key) : []
const notes = []
if (wantCapture && !look.possible) notes.push(`look-dev frames not captured: ${look.why || 'the plan found no way to render'}`)
if (!wantCapture) notes.push('look-dev capture off by the caller (capture: false); readability judged from scene and code')

const captureBrief = (before) => `Capture the look-dev frames for "${feature}" ${before ? 'before the change' : 'after the change'}, following the technical-artist lookdev-capture skill (frames, determinism, verification) and the graphics-programmer headless-rendering skill (binary, software driver, virtual display): ${JSON.stringify(strings(look.frames))} with ${look.command || 'the project\'s headless render command'}, into ${look.outDir || 'a frames directory outside the repository'}. Name each file <scene>-<camera>-<beat>-<renderer or tier>-${before ? 'before' : 'after'}. ${before ? 'Render from the base commit (a separate worktree of the default branch) so the frames show the state before this work; where the feature does not exist there yet, capture the same scene and camera so the after frames show what it adds. ' : 'Render from the working tree with the same command, size, frame and driver as the before frames. '}Check every frame is the requested size and is not black, blank or captured before the scene settled; re-capture any that fail. Write a greyscale copy of each. Change no project files except the frames. Return the frame files with what each shows and the driver that rendered it, and anything you could not capture in problems.`

let before = null
if (capturing) {
  phase('Before')
  before = await agent(captureBrief(true), { schema: FRAMES, phase: 'Before', label: 'capture before' })
  if (!before || !strings(before.frames).length) notes.push(`before frames missing: ${before ? strings(before.problems).join('; ') : 'capture step returned nothing'}`)
}

phase('Build')
const built = await agent(
  `You are the graphics-programmer. Implement this presentation plan for "${feature}" exactly, following the skills event-presentation, scene-composition, camera-systems, input-handling and frame-budget-profiling. Logic must never wait on animation; timings live in data; skip and reduced motion must give the same final state.${backdrop ? ' The backdrop reads no game state or events: drive it from the presentation clock, paused with the game, with its parameters in data.' : ''}
Load every visual asset by its manifest key, never by path. Create each planned placeholder (simple, clearly temporary, with the bounds, pivot, slots and names the plan says final art must keep), name it by the convention "${plan.naming || '<key>.placeholder.<ext>'}", and register it in its manifest marked as a placeholder. Add the planned measurement markers or timers.
Plan: ${JSON.stringify(plan)}
Commit on the work-package branch following engineering-practices git-workflow. Return a short summary of files changed.`,
  { phase: 'Build', label: 'build' },
)
if (!built) return 'blocked: build agent returned nothing; no changes are confirmed'

const readabilityTask = (frames) => {
  const base = `Check the readable set at the smallest supported resolution and the narrowest and widest aspect ratios, inside safe areas, in grayscale.${backdrop ? ' The backdrop must not compete with foreground play: at every captured time the play pieces and their states read over it, it stays lower in contrast and saturation than the play area, and no motion or highlight in it draws the eye into the play area.' : ''} Skills: scene-composition, camera-systems.`
  if (!frames.length && !wantCapture) return `${base} Capture is off for this run, so judge from the scene and code and set measured=true.`
  if (!frames.length) return `${base} No look-dev frames were captured, so judge from the scene and code and set measured=false.`
  const auto = acceptance.exists
    ? `Run the project's visual acceptance checks (${acceptance.command || 'the command the project profile names'}) on these frames: ${JSON.stringify(frames)}. Report each failing criterion as a blocker with its frame, measured value and threshold; the check may write its report, but change no project files and never adjust a threshold. Then judge what the checks do not cover by eye.`
    : `The project has no automated visual acceptance checks; judge by eye on these frames and their greyscale copies: ${JSON.stringify(frames)}, and say in minor that the criteria are unchecked by script.`
  return `${base} ${auto} Criteria: ${JSON.stringify(strings(acceptance.criteria))}. Set measured=true. Skill: technical-artist visual-acceptance-checks.`
}
const perfTask = (t) => `Measure frame time (median, p95, p99) for the feature on ${t} in a release-like build against the project budget.${backdrop ? ' For the backdrop, include its full-screen fragment cost and overdraw at the highest supported resolution, and each quality tier\'s fallback.' : ''} ${hook ? `Use the measurement hook: ${hook}. ` : ''}Frame times from a software renderer or a container are not device numbers (headless-rendering skill): report them, but set measured=false. If no device or build is available, estimate from the scene and code, put the estimate in minor and set measured=false. If the backend reports no GPU timing (e.g. Metal, some web and mobile drivers), record gpu_timing unavailable: CPU frame time then includes the drawable, vsync or present wait, so judge the budget on total frame time (uncapped where possible), take GPU cost from the platform GPU profiler if reachable, and mark the bound side as inferred. Skill: frame-budget-profiling.`

let round = 0
let open = []
let unverified = []
let estimated = []
let after = null
// The run.only labels that rerun what the last Verify round left unverified
// or estimated.
let rerun = []
while (true) {
  let frames = []
  const tag = (name) => (round ? `${name} round ${round + 1}` : name)
  if (capturing) {
    phase('Capture')
    after = await agent(captureBrief(false), { schema: FRAMES, phase: 'Capture', label: tag('capture') })
    frames = after ? strings(after.frames) : []
  }
  const checks = [
    backdrop
      ? ['feel', 'Compare the backdrop\'s motion (loop period, speeds, parameters) with the spec; check it loops with no visible seam, pauses with the game, stills or slows under reduced motion, and reads no game state or events. Skill: event-presentation.']
      : ['feel', 'Compare every beat\'s timing and easing with the feel targets in the spec; check skip, fast-forward and reduced motion leave the view equal to logic state. Skill: event-presentation.'],
    ...(backdrop ? [] : [['input', 'Check every input action on every supported device family, including cancel, focus loss and disconnect; check touch target sizes and picking during camera motion. Skill: input-handling.']]),
    ['readability', readabilityTask(frames)],
    ...(frames.length ? [['look', `Give an independent look review. Open every frame and its greyscale copy (technical-artist lookdev-capture skill, "Judge"). Before frames: ${JSON.stringify(before ? strings(before.frames) : [])}. After frames: ${JSON.stringify(frames)}. Compare before and after from the same camera; check each beat against the spec and the project's art direction and visual target: the feature reads at game speed, nothing washed out, too dark, blown out, noisy or aliased, and higher tiers add to the base look rather than change what reads. A software-rendered frame judges values and readability, not GPU-only features; say which those are in minor. Set measured=true.`]] : []),
    ...(placeholders.length ? [['art hookup', `Check the placeholder art can be replaced without code changes. Placeholders: ${JSON.stringify(placeholders)}. Every visual asset of the feature is loaded by manifest key, never by path; every placeholder is registered in its manifest, marked as a placeholder and named by the convention "${plan.naming || '<key>.placeholder.<ext>'}"; what final art must keep (bounds, pivot, slots, names) is documented. Read the loading code; set measured=true.`]] : []),
    ...targets.map((t) => [`perf: ${t}`, perfTask(t)]),
  ]
  phase('Verify')
  const results = await parallel(checks.map(([area, task]) => () =>
    agent(`You are a graphics-programmer reviewer. Read only; do not edit any file. Feature: "${feature}". ${task} Return blockers (must fix before merge) and minor issues, each with file and concrete change.`,
      { schema: FINDINGS, phase: 'Verify', label: tag(area), independent: true }).then((r) => (r ? { ...r, area } : { area, crashed: true }))))
  unverified = results.filter((r) => r.crashed).map((r) => r.area)
  if (capturing && !frames.length) unverified.push(`look: after frames missing (${after ? strings(after.problems).join('; ') || 'none returned' : 'capture step returned nothing'})`)
  open = results.filter((r) => !r.crashed).flatMap((r) => r.blockers.map((b) => `${r.area}: ${b}`))
  estimated = results.filter((r) => !r.crashed && r.measured === false).map((r) => r.area)
  rerun = [
    ...(capturing && !frames.length ? [tag('capture'), tag('look')] : []),
    ...results.filter((r) => r.crashed || r.measured === false).map((r) => tag(r.area)),
  ]
  if (estimated.length) log(`estimated, not measured: ${estimated.join(', ')}`)
  if (!open.length || round >= 2) break
  round += 1
  phase('Fix')
  const fixed = await agent(
    `You are the graphics-programmer. Fix these blockers for "${feature}" in one pass, following the relevant skills, then commit. Fix art by its manifest entry or placeholder, never by a hard-coded path; never change a visual acceptance threshold to pass:\n- ${open.join('\n- ')}`,
    { phase: 'Fix', label: `fix round ${round}` },
  )
  if (!fixed) return `blocked: fix agent returned nothing; open blockers:\n- ${open.join('\n- ')}`
}
if (open.length) return `blocked after ${round} fix rounds; open blockers:\n- ${open.join('\n- ')}${unverified.length ? `\nunverified: ${unverified.join(', ')}` : ''}`

// A perf check estimated here is a follow-up when a named benchmark or
// measurement package will measure it on the real target; without one it
// stays unverified.
const isPerf = (a) => a.startsWith('perf: ')
const followUps = deferTo ? estimated.filter(isPerf).map((a) => `${a}: estimated here; measure on the target with ${deferTo}`) : []
const notMeasured = estimated.filter((a) => !(deferTo && isPerf(a)))
const rerunLabels = rerun.filter((l) => !(deferTo && isPerf(l)))

phase('Docs')
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
const docs = await agent(
  `You are the graphics-programmer. Write the documentation for "${feature}" in the same PR. Planned pages: ${JSON.stringify(plan.docsPlan)}.
${DOCS_FRAGMENT}${placeholders.length ? ` Document the placeholder art in reference (key, placeholder path, manifest, what final art must keep) next to the feature's other reference, so the technical-artist can replace it: ${JSON.stringify(placeholders)}.` : ''}${after && strings(after.frames).length ? ` Where the project shows look-dev frames in its docs, use small compressed copies of the after frames, captioned with renderer or tier and driver: ${JSON.stringify(strings(after.frames))}.` : ''} Commit the docs on the same branch. Return the page paths you touched and each change left undocumented with why.`,
  { schema: DOCS, phase: 'Docs', label: 'docs' },
)
if (!docs) return 'blocked: docs agent returned nothing; the feature is not done without its docs'

phase('Docs check')
const DOCCHECK = { type: 'object', properties: { ok: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['ok', 'problems'] }
const check = await agent(
  `Review the docs pages touched for "${feature}" (read only; do not edit anything). Check: each page holds one Diataxis kind only; nothing instructional in reference or explanation; how-to titles name a user goal and explanation titles read "About ..."; reference structure matches the code; pages link to the related pages of the other kinds; every user-visible change from this work is documented${placeholders.length ? '; the placeholder art is listed with key, path, manifest and what final art must keep' : ''}. Docs report: ${JSON.stringify(docs)}`,
  { schema: DOCCHECK, phase: 'Docs check', label: 'docs check', independent: true },
)
if (!check) return `unverified: docs checker returned nothing. Build: ${built}\nDocs: ${JSON.stringify(docs)}`
if (!check.ok) return `blocked: docs check failed:\n- ${check.problems.join('\n- ')}`

// The handoff is what engineering-practices deliver-package takes as
// prior, so the presentation ships without being built again.
phase('Handoff')
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, recorded: { type: 'array', items: { type: 'string' }, description: 'where each perf follow-up was recorded' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }
const pages = Array.isArray(docs.pages) ? docs.pages : []
const hand = await agent(
  `Hand off the presentation for "${feature}". If you are on the default branch, cut a Conventional branch (feat/<slug>) from the latest remote default branch; otherwise stay on the current feature branch. Commit everything this run wrote (the presentation code, scene, camera, animation and input data, placeholder art and manifest entries, measurement markers, fixes and their tests, and the docs pages ${pages.join(', ') || 'as written'}) as Conventional Commits, and push. Do not commit look-dev frames unless a docs page shows a small compressed copy. ${followUps.length ? `Record each perf follow-up where the project tracks follow-ups for ${deferTo} (its work-package row's notes, or the follow-up list or tracker the project profile names), in the same commits, and return where in recorded; if the project names no such place, record nothing and say so in problem without failing: ${JSON.stringify(followUps)}. ` : ''}Run the project's checks that apply (test suite, headless or scene checks, asset validator and the docs link check the project profile names) on the pushed head. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether the checks pass on that head, and the problem if not.`,
  { schema: HANDOFF, phase: 'Handoff', label: 'handoff' },
)
if (!hand || !hand.branch) return `blocked: handoff step returned nothing; the presentation for "${feature}" may not be committed or pushed${hand && hand.problem ? `: ${hand.problem}` : ''}`
if (!hand.tests_pass) return `blocked: checks fail on ${hand.branch}${hand.head_sha ? ` at ${hand.head_sha}` : ''}: ${hand.problem || 'no details'}`

const placeholderLines = placeholders.map((p) => `placeholder art: ${p.key} at ${p.path} in ${p.manifest}; final art must keep ${p.stands_for}`)
const frames = { before: before ? strings(before.frames) : [], after: after ? strings(after.frames) : [] }
const pushed = { branch: hand.branch, pr: hand.pr || '', head_sha: hand.head_sha || '' }
const partial = unverified.length || notMeasured.length
// An unverified run returns no handoff, so deliver-package cannot ship it
// as if every check had passed; rerunning the missing checks gives one.
if (partial) {
  return {
    status: 'unverified',
    summary: `unverified: presentation for "${feature}" built, documented and pushed to ${hand.branch}, but not fully verified.${unverified.length ? `\nchecks that returned nothing: ${unverified.join(', ')}` : ''}${notMeasured.length ? `\nestimated, not measured: ${notMeasured.join(', ')}` : ''}\nNo handoff: rerun the missing checks before shipping.\nBuild: ${built}\nDocs: ${JSON.stringify(docs)}`,
    build: built,
    docs,
    unverified,
    estimated: notMeasured,
    follow_ups: followUps,
    placeholders,
    frames,
    pushed,
    notes,
    next: `rerun the checks listed with run.only: ${JSON.stringify(rerunLabels)} and run.results from this run${notMeasured.some(isPerf) ? '; for perf with no device, pass perf.defer_to naming the benchmark or measurement package that will measure it, or build one with /graphics-programmer:build-measurement-tool' : ''}; the run that verifies them returns the handoff`,
  }
}
return {
  status: 'done',
  summary: `done: presentation for "${feature}" built, verified and documented.${followUps.length ? `\nperf deferred to ${deferTo}: ${followUps.join('; ')}` : ''}${placeholders.length ? `\nplaceholder art for the technical-artist: ${placeholders.map((p) => p.key).join(', ')}` : ''}\nBuild: ${built}\nDocs: ${JSON.stringify(docs)}`,
  build: built,
  docs,
  unverified: [],
  estimated: [],
  follow_ups: followUps,
  placeholders,
  frames,
  notes,
  handoff: {
    from: 'graphics-programmer:present-feature',
    branch: hand.branch,
    pr: hand.pr || '',
    head_sha: hand.head_sha || '',
    tests_pass: true,
    docs: pages,
    undocumented: Array.isArray(docs.undocumented) ? docs.undocumented : [],
    follow_ups: followUps,
    placeholders,
    notes: [
      ...followUps.map((f) => `follow-up: ${f}${strings(hand.recorded).length ? ` (recorded in ${strings(hand.recorded).join(', ')})` : ''}`),
      ...placeholderLines,
      ...notes,
    ],
  },
  next: `${placeholders.length ? 'send the placeholder list to the technical-artist (engineering-practices peer-coordination) to replace through its manifest entries, e.g. with /technical-artist:asset-batch; ' : ''}${followUps.length && !strings(hand.recorded).length ? `record the perf follow-ups on ${deferTo}; ` : ''}ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "${hand.branch}" }`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
