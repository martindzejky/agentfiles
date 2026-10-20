# Video Recording

Capture browser automation sessions as video for debugging, documentation, or verification. Produces WebM (VP8/VP9 codec).

## Basic Recording

```bash
# Open a session before recording
playwright-cli open https://example.com
playwright-cli video-start

# Perform actions
playwright-cli snapshot
playwright-cli click e1
playwright-cli fill e2 "test input"

# Stop and save
playwright-cli video-stop
```

Use the saved artifact path printed by the CLI. Check the installed command help before passing recording options; do not assume `video-stop` accepts a filename. Inspect the recording before sharing it.

## Tracing vs Video

| Feature  | Video                | Tracing                                  |
| -------- | -------------------- | ---------------------------------------- |
| Output   | WebM file            | Trace file (viewable in Trace Viewer)    |
| Shows    | Visual recording     | DOM snapshots, network, console, actions |
| Use case | Demos, documentation | Debugging, analysis                      |
| Size     | Larger               | Smaller                                  |

## Limitations

- Recording adds slight overhead to automation
- Large recordings can consume significant disk space
