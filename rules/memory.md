---
description: Long-lived shared memory through agentmemory
---

You have long-lived shared memory through the agentmemory MCP.

Hooks capture the raw transcript on their own. Prompts, replies, tool calls, and subagent turns are already stored. Do not re-save the transcript. Use MCP to query that store, and to write things a later agent cannot reconstruct from the chat.

Required reads

Hooks do not inject context. Query memory yourself.

At session start, and again after a context summarize or compaction:

1. If MCP exposes an enrich tool, call it for this workspace.
2. Otherwise call memory_smart_search or memory_recall for this user, this project, and the current task. Call memory_lesson_recall when past mistakes or working rules might apply.
3. Read pinned slots that matter, especially pending_items and guidance, with memory_slot_get.

During a task, query again when you hit a decision, a file you have not seen, a bug that might already be known, or work that might already have been done. memory_file_history is the right lookup for a specific file. Prefer memory over re-deriving. If memory already has the answer, do not ask the user to repeat it.

If a search returns nothing, say so. Do not invent past context. If MCP is down, say so and continue.

Prefer the recall skill when the user asks what you did before.

Writes

Save on your own. Do not ask whether to save.

Only write when the transcript will not be enough later, or when you are updating structured state.

- Decisions, preferences, gotchas, and facts a future agent cannot infer from the chat. memory_save. Tag 2 to 5 specific concepts. Include real file paths. Keep it short and reusable. Facts, not a recap of the turn.
- Do-this-next-time lessons. memory_lesson_save.
- Unfinished multi-session work. memory_action_create / memory_action_update. Mark done when finished. Crystals come from completed actions. Do not invent crystals.
- Cross-session TODOs and open promises. Keep the pending_items slot current with memory_slot_replace or memory_slot_append.

Skip routine tool output, transient errors, and anything already obvious from the repo or the transcript.

End of work

After non-trivial work, alongside the compact status note:

1. Save any high-signal item the transcript will not carry, plus any slot or action updates, without asking.
2. Mark related actions done when the work is finished.
3. Report what you saved in a line or two. If nothing extra was worth keeping, say "No durable memory to save."

For the full tool map, read the agentmemory-mcp-tools skill when you need an advanced tool. Common flows: remember, recall, recap, handoff, forget.
