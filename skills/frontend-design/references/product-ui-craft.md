# Product UI craft

Help people understand their current state and complete the next action. Preserve the project's interaction patterns and scope; these considerations do not imply adding features the task did not request.

## Structure around the work

Make location, selection, and available actions easy to distinguish. Keep navigation stable between related screens. Preserve filters, sorting, and pagination across detail-and-back navigation when the existing flow supports that expectation.

Use density appropriate to the work. A table can make many records easier to compare than a spacious card grid. Align comparable values, keep units clear, and give row actions a predictable location. On narrow screens, preserve the relationships needed for the task: intentional table scrolling or a focused record view may work better than stacking every cell.

Show active filters and a clear way to reset them. Distinguish an empty collection from a search with no matches. For existing bulk actions, make selection scope explicit, especially across pages: selected rows, the current page, and every matching record are different promises.

## Keep a consistent component vocabulary

Reuse established controls, type roles, spacing, and semantic colors. Familiar patterns and a compact type scale often serve working interfaces well. Brand character can live in precise details without making standard controls unfamiliar.

Make selected, focused, disabled, and pending states distinct where applicable. Explain an unavailable action when its cause is not obvious. Reserve strong emphasis for the current task rather than making every control compete.

Prefer inline editing or disclosure when it keeps the task understandable. Use a dialog when the action needs a focused decision or separate context. Menus and popovers must escape clipping ancestors and remain reachable by keyboard; use the project's existing overlay primitive or an appropriate platform feature before inventing one.

## Keep people in flow

Keep useful content visible during refresh when it still represents valid data. Use a skeleton when the loading structure is predictable, or a simple progress indicator when it is not. Feedback should identify the affected action or region without blocking unrelated work.

Motion should clarify a state change or preserve spatial continuity. Keep repeated interactions responsive; avoid making users wait through an entrance sequence every time they navigate. Match confirmation to the consequence of the action, using established undo or recovery patterns where available.

Review the main task through navigation, selection, editing, and return. Check that terminology, control behavior, and state remain consistent across the touched screens.

---

Adapted and substantially rewritten for this catalog from [Impeccable's product UI guidance](https://github.com/pbakaus/impeccable/blob/main/plugin/skills/impeccable/reference/operate.md), by Paul Bakaus and contributors. Licensed under [Apache 2.0](../LICENSE.txt).
