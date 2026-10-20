# Interface resilience

Design the states the feature can actually encounter. Follow existing validation, data, and persistence patterns; a visual task does not authorize adding offline support, autosave, or a new state-management system.

## Let content vary

Check long names, unbroken identifiers, missing values, large numbers, and translated labels where relevant. Let text containers grow and flex or grid children shrink. Truncate only when losing that information is acceptable, and provide an accessible way to read the full value when needed.

Check text zoom and narrow layouts with realistic content. Do not solve overflow by clipping actions or essential values. For supported locales, use the project's formatting and pluralization tools; account for text expansion and direction without assuming English label lengths.

## Keep submissions recoverable

Preserve entered values after validation or network errors. Put specific errors near the affected fields, and use a summary when it helps people find multiple problems. Keep labels and useful constraints visible before submission.

Show which action is pending and prevent accidental duplicate submission. Announce completion or failure appropriately without moving focus unnecessarily. A timeout does not prove a write failed: avoid offering a blind retry for an operation that may already have succeeded. Use the application's existing status or recovery mechanism.

When authentication expires or permission changes, explain the next available step. Preserve recoverable work through the established flow without adding persistence of sensitive inputs. If navigation would discard unsaved edits, follow the product's existing warning or draft behavior.

## Handle asynchronous state honestly

Distinguish initial loading, refreshing, empty results, and failure. A failed request should not look like an empty collection. Keep existing results during refresh only when doing so will not mislead; make pending or stale state clear when it affects decisions.

For changing searches or filters, prevent an older response from replacing newer results. Optimistic changes need a clear failure and rollback path; otherwise wait for confirmation. Concurrent edits should follow the application's conflict behavior rather than silently overwriting work.

For custom dragging controls, handle cancellation, lost pointer capture, and release outside the control. Clear transient interaction state so the next interaction works without a reload. Prefer established controls when they already meet the need.

## Exercise the relevant boundaries

Verify the changed flow with realistic long or empty content, a failed request, and an interrupted action where those states apply. Check that recovery preserves input, focus remains useful, and the next attempt works. Scope these checks to the feature; do not turn a small change into a full application audit.

---

Adapted and substantially rewritten for this catalog from [Impeccable's hardening guidance](https://github.com/pbakaus/impeccable/blob/main/plugin/skills/impeccable/reference/harden.md), by Paul Bakaus and contributors. Licensed under [Apache 2.0](../LICENSE.txt).
