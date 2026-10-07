---
description: Long-lived shared memory through agentmemory
---

You have long-lived shared memory through the agentmemory MCP.

Use memory proactively in both local and cloud environments. Query existing memory before work and explicitly save concise, durable context before your final response. Do not wait for the user to ask.

Required reads

At session start, and again after a context summarize or compaction:

1. If MCP exposes an enrich tool, call it for this workspace.
2. Otherwise call memory_smart_search or memory_recall for this user, this project, and the current task. Call memory_lesson_recall when past mistakes or working rules might apply.
3. Read pinned slots that matter, especially pending_items and guidance, with memory_slot_get.

During a task, query again when you hit a decision, a file you have not seen, a bug that might already be known, or work that might already have been done. memory_file_history is the right lookup for a specific file. Prefer memory over re-deriving. If memory already has the answer, do not ask the user to repeat it.

If a search returns nothing, say so. Do not invent past context. If MCP is down, say so and continue.

Prefer the recall skill when the user asks what you did before.

Writes

Save on your own. Do not ask whether to save.

Search existing memory before writing to avoid duplicates. Save durable context at meaningful checkpoints so an interrupted session does not lose important decisions.

- Decisions, preferences, gotchas, and facts that would help a future agent. memory_save. Tag 2 to 5 specific concepts. Include real file paths. Keep it short and reusable. Facts, not a recap of the turn.
- Do-this-next-time lessons. memory_lesson_save.
- Unfinished multi-session work. memory_action_create / memory_action_update. Mark done when finished. Crystals come from completed actions. Do not invent crystals.
- Cross-session TODOs and open promises. Keep the pending_items slot current with memory_slot_replace or memory_slot_append.

Skip full transcripts, routine tool output, transient errors, and anything already obvious from the repo.

End of work

Before your final response after non-trivial work:

1. Review the request and outcome, then save relevant decisions, constraints, discoveries, lessons, and unfinished work with memory_save or the appropriate lesson, action, or slot tool. Complete any slot or action updates without asking.
2. Mark related actions done when the work is finished.
3. If memory is unavailable, report what could not be saved. Otherwise report what you saved in a line or two. If nothing extra was worth keeping, say "No durable memory to save."

Use the available MCP tool schemas for exact parameters. Practical memory skills: remember, recall, forget, handoff, recap, session-history, commit-context, and commit-history.
