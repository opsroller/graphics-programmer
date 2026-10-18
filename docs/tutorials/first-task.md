*Tutorial, for someone using the graphics-programmer plugin for the first time.*

# Build your first presented event

In this tutorial we will take one game event that the logic already
publishes, show it on screen as a short animation, and confirm that it holds
the frame budget on the weakest target. We will use the
`graphics-programmer` agent and three of its skills. It takes about an hour.

We will use a neutral example throughout: a **"door opened"** event in any
project. Substitute the name of an event your project's logic already
publishes.

## Before we start

You need:

- the plugin installed (see the [README](../../README.md));
- a project with a `CLAUDE.md` and project profile that name the target
  devices, the frame budget and the docs location;
- one logic event that already exists, and a design note saying how it
  should look and how long it should take.

## 1. Onboard the agent

First, start the agent and ask it to onboard:

```
Use the graphics-programmer agent. Onboard on this project and tell me the
target devices, the frame budget per target, and where presentation code and
docs live.
```

The output should look something like:

```
Targets: low-tier phone (30 fps, 33.3 ms), desktop (60 fps, 16.7 ms)
Presentation code: <path from your profile>
Docs: docs/ (Diataxis)
```

Notice that the agent quotes budgets in milliseconds, not frames per second.
If your profile has no budget, the agent proposes one; agree it before going
on.

## 2. Write the event contract

Now ask:

```
Following the event-presentation skill, write the contract for the
"door opened" event: the fields it carries, and the beat it should play.
```

The output should be a short table like:

| Field | Meaning |
|---|---|
| `door_id` | which door |
| `from_state`, `to_state` | closed -> open |
| `seq`, `group` | ordering |

and one beat: *door rotates 90 degrees over 0.35 s, ease-out; dust particle
burst at 0.3 s*.

Notice that every value the animation needs is in the event. The animation
will never look up the door's state in the logic.

## 3. Build it

Next, ask the agent to implement the beat:

```
Implement the "door opened" beat from the contract. Put the timing in data.
Support skip and reduced motion.
```

Run the project and trigger the event. You should see the door swing open
with a short dust puff. Now trigger it with reduced motion on: the door
should simply appear open.

Notice that in both cases the door ends in the same place. That is the rule:
presentation changes how things look, never what happened.

## 4. Check the frame budget

Now ask:

```
Following frame-budget-profiling, measure frame time while the door opens on
the weakest target, in a release-like build. Report median, p95 and p99.
```

The output should look something like:

```
low-tier phone: median 24.1 ms, p95 27.9 ms, p99 31.0 ms (budget 33.3 ms)
```

If p95 is over budget, the agent says whether the frame is CPU- or GPU-bound
and proposes one change. Let it apply the change and measure again.

## 5. Document it

Finally, ask:

```
Document this work: classify the change with the Diataxis compass and update
the project's docs.
```

The agent adds the "door opened" event and its beat to the event reference
page, in the same branch as the code.

## What we did

You have built a presented event the right way: a contract first, an
animation driven only by event data, skip and reduced motion that keep the
same outcome, a measured frame time, and a reference page.

Next steps: see [How to present a game feature](../how-to/how-to-present-a-game-feature.md)
for running the whole job with the `present-feature` workflow, and
[About the graphics programmer role](../explanation/about-the-role.md) for
why the role works this way.
