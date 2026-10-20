---
name: godot-playtesting
description: Playtest Godot scenes through input, check runtime errors, and capture results. Use when verifying gameplay or scene flows, including tests that need temporary staging.
---

# Godot playtesting

Use the project's testing tools. See `godot-cli` for import, parse, and export checks.

## Before starting

Respect the user's testing instructions. If they paused tests or are testing the scene themselves, wait.

When agents share a Godot session or desktop input, agree who controls it. Only one tester drives that session at a time. Keep imports and exports separate from tests running against the same project files.

Choose the smallest scene that supplies the required game context. For loading, pause, retry, or transitions, start through the real entry scene. Missing dependencies in an isolated object scene are not automatically a game bug.

Decide what action to test and what result would confirm it. Read the actual input bindings and inspect the current viewport before choosing keys or click coordinates.

## Play the change

- Start the scene and wait until loading finishes. Check a screenshot and the runtime output before sending input.
- Perform the action through the input or UI tools. Observe the result before continuing. A tool accepting an input call does not prove the game received it.
- Check the visible response and the gameplay state. Test relevant alternatives, such as releasing a drag early or clicking while the action is unavailable. Cursors and button states should match what the game allows.
- Try interruptions that affect the changed behavior, such as pause, death, retry, or leaving the scene. Look for stuck input locks, effects that keep playing, and state that fails to reset.
- Read runtime errors after the action too. For fast animations or transitions, combine images with event timing or logs. One still image cannot establish that motion works.

Judge framing, scale, obstruction, and click areas through the gameplay camera at a representative viewport size. Editor views and staging cameras can hide problems.

## Staging and screenshots

Set up prerequisites when that saves a long replay, then test the action itself through input. Setting a weapon to loaded skips the loading test. Teleporting past an obstacle skips the navigation test. Say what you staged.

Keep temporary scenes, captures, and logs in the project's ignored artifact location. Prefer runtime staging over edits to saved scenes. If a test needs source edits, keep them separate and restore only those edits afterward, preserving the user's work.

Inspect screenshots before delivering them. Check that they show the requested subject or moment, use the requested aspect ratio, and have usable file links. Promotional captures can be staged, but do not count them as gameplay tests.

## Report and stop

Release held keys and mouse buttons, stop the test runtime, and tell other testers the session is free.

Report the scene, actions, results, and any staging or skipped checks. Include reproduction steps for failures. A smoke check, targeted interaction test, and complete playthrough prove different things. If a tool cannot exercise the interaction, state that limit.

Agents can check audio triggers and routing, but cannot hear the result in this workflow. Leave listening and mix approval to the user. See `godot-audio`.
