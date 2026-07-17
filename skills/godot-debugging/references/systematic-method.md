# Systematic debugging method

Back to [SKILL.md](../SKILL.md).

## 1. Reproduce

Capture exact steps. For intermittent bugs, log frame counters or state near the failure until it triggers.

## 2. Isolate

Minimal scene with only suspect nodes. Prefer the smallest valid context — isolated object scenes may fail for missing world setup (see `godot-cli`); that is not automatically the bug.

Binary-search: disable half the scripts/process callbacks, narrow until the failure vanishes.

```gdscript
# temporary isolation
$suspect.set_process(false)
# or
$suspect.set_script(null)
```

## 3. Hypothesis

Write one sentence: "X causes Y because Z." Do not drift.

## 4. Trace

Breakpoints, targeted `print`, `get_signal_connection_list`, `print_tree_pretty`. Confirm or kill the hypothesis before editing.

## 5. Fix

Smallest change to the root cause. Avoid symptom patches (`call_deferred` everywhere, extra null guards on required deps).

## 6. Verify

Re-run the repro. Smoke via `godot-cli`. Check related paths for regressions. Add a regression test only if the project already has a test harness.
