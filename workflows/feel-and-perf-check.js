export const meta = {
  name: 'feel-and-perf-check',
  description: 'Check presentation against feel targets and frame budgets per target device, in parallel',
  whenToUse: 'Before marking presentation work done. args: { targets: ["<device or platform>", ...] }',
  phases: [{ title: 'Measure', detail: 'feel timings and frame cost' }, { title: 'Report', detail: 'deltas and fixes' }],
}
const targets = (args && args.targets) || ['weakest mobile target', 'desktop']
const M = { type: 'object', properties: { area: { type: 'string' }, deltas: { type: 'array', items: { type: 'string' } } }, required: ['area', 'deltas'] }
const checks = [
  ['feel', 'Compare every animation timing and easing in the code to the feel targets in the design docs; list each delta as "beat: actual vs target".'],
  ...targets.map(t => [`perf:${t}`, `Estimate or measure frame cost for ${t} against the project budgets (draw calls, triangles, per-frame allocations, overdraw). Profile if a build is available; otherwise inspect code and scenes. List each budget risk.`]),
  ['readability', 'Check the play area reads at the smallest target resolution: occlusion, contrast between gameplay colours, camera framing.'],
]
const res = await pipeline(checks, ([area, task]) => agent(`Following the graphics-programmer skills: ${task}`, { schema: M, phase: 'Measure', label: area }).then(r => r && { ...r, area }))
phase('Report')
return await agent(`Turn these findings into a prioritised fix list (biggest player-visible impact first), each with file and the concrete change:\n${JSON.stringify(res.filter(Boolean))}`, { label: 'report' })
