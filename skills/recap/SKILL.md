---
name: recap
description: Summarize recorded work and decisions from Notion memory over a requested period.
argument-hint: '[today | this week | date range]'
user-invocable: true
---

Use the data sources and scope rules in [the global memory rule](../../rules/memory.md).

1. Resolve the project and period in the user's timezone. If no period is given, use the past seven days and state that range.
2. Search Memories within the requested scope and fetch relevant pages. Use event dates in the content, not page creation or edit dates, to place work in the requested period. Report missing dates or coverage.
3. Read Slots to check which next steps remain open. Consult Observations only if the user asks for original accounts or supporting evidence; use `Observed at` for those dates. Summarize each outcome once.
4. Summarize outcomes, decisions, and unfinished work with source links. Use a timeline when requested. Separate completed work from plans and unverified reports.

This is a recap of saved evidence, not a complete activity log. If the user wants commit coverage, inspect Git history separately and identify it as another source.
