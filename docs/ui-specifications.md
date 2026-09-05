# Vikunja TRMNL Plugin UI Specifications

## Purpose

This document is the visual and interaction contract for the Vikunja TRMNL plugin. It complements `docs/user-stories.md` and `docs/architecture.md` by defining how the plugin should look and behave across TRMNL frames.

Update this document before making visual changes so each iteration remains consistent.

## Design principles

- Optimize for fast e-paper scanning rather than dense application-style controls.
- Use Framework 3.3 classes and utilities instead of custom CSS.
- Prefer high-contrast grayscale and semantic Framework treatments.
- Keep the first visible content at the top of the frame.
- Keep status order supplied by Vikunja.
- Use truncation only where necessary to preserve layout stability.
- Never allow a long task title to resize or displace neighboring content.
- Preserve empty columns in Kanban View so the workflow structure remains recognizable.

## View modes

The `View Mode` setting appears immediately below `Projects` in the plugin settings.

| Mode | Value | Purpose |
| --- | --- | --- |
| Task View | `task` | Shows a bounded list of tasks using the frame-specific task layout |
| Kanban View | `kanban` | Shows one selected project's Vikunja buckets as status columns |

Task View is the default. Kanban View requires exactly one project number.

## Frame specifications

### Full

- Target: 800x480; scale up for TRMNL X where supported.
- Task View: two-column task grid with title, optional description, assignee, due date, and progress.
- Kanban View: horizontal status columns, top-aligned.
- Kanban separators: vertical `divider--v` between adjacent columns.
- Kanban header: bucket title and visible task count, for example `To-Do (2)`.
- Use `title--small lg:title--base` for Kanban headers where appropriate.
- Use `data-clamp="1"` for task titles, but do not clamp the header count.

### Half Horizontal

- Target: 800x240.
- Task View: compact two-column-capable task queue.
- Kanban View: horizontal status columns, top-aligned.
- Kanban separators: vertical `divider--v` between adjacent columns.
- Keep task titles to one line and prioritize title visibility over secondary metadata.
- Use the smaller title scale and compact gaps to protect the shallow frame.

### Half Vertical

- Target: 400x480.
- Task View: one-column stacked task queue.
- Kanban View: status columns stacked vertically in API order.
- The first status is at the top; each following status is below it.
- Kanban separators: horizontal `divider--h` between adjacent status sections.
- Use full available width for each status section.
- Columns are left‑aligned within the frame (flex `flex--left`).
- Keep task titles clamped to one line where possible.

### Quadrant

- Target: 400x240.
- Task View: minimal compact task list.
- Kanban View: horizontal status columns, top-aligned.
- Kanban separators: vertical `divider--v` between adjacent columns.
- Keep only the title and essential status information.
- Use the smallest practical title scale and avoid descriptions.
- **Task titles are rendered in a block element without `data-clamp="1"` to enable natural word‑wrapping for long titles.**

## Kanban structure

Each Kanban column follows this structure:

```text
STATUS (N)

Task title

due 12 Feb

Task title

Task title
```

Where:

- `STATUS` is the Vikunja bucket title.
- `N` is the number of visible tasks after configured filters.
- Tasks remain in the API-defined order within each bucket.
- Empty columns still show their header and `(0)` count.
- The done bucket uses the API-defined `done_bucket_id`.
- Each task row uses the Framework `.item` structure with an empty `.meta` element, producing a left gray meta bar without numbering.
- The title is the primary row content. When `due_date` is valid, show a compact `due DD Mon` label below it.
- Kanban headers are left-aligned within their columns, uppercase, and include the visible task count.
- Kanban task meta bars use high-contrast Framework emphasis rather than a faint gray marker.
- Done-column task titles use a line-through treatment, and done-column due dates are omitted.

## Kanban spacing

Use Framework 3.3 utilities only:

- Outer status arrangement: `gap` between horizontal columns or vertical status sections.
- Header-to-task spacing: `mt--small` on the task group.
- Task-to-task spacing: `gap--small` on the task group flex container.
- Horizontal frame separators: `divider--v`.
- Half Vertical separators: `divider--h`.

Spacing must be visible but compact enough for e-paper. If a frame overflows, reduce secondary metadata before reducing the separation between the header and task rows.

## Typography

- Framework titles are used for status headers and task titles.
- Full Kanban headers use `title--small lg:title--base`.
- Compact Kanban headers and task titles use `title--small`.
- Task titles use `data-clamp="1"` where the frame requires bounded height.
- Kanban headers must not be clamped together with their counts. The count must remain visible.
- Avoid adding decorative typography or custom font declarations.

## Task semantics

### Completion

- Completed tasks remain visible when the status filter is `all`.
- Task View uses the established muted and line-through treatment for completed tasks.
- Kanban View communicates completion primarily through the done bucket and its position.

### Priority

- Compact Task View uses Framework item meta emphasis for meaningful priority levels.
- Urgent/highest uses the strongest emphasis.
- High uses medium emphasis.
- Medium uses light emphasis.
- Low and none use default emphasis.

### Dates and progress

- Never display Vikunja's no-date sentinel `0001-01-01T00:00:00Z`.
- Full Task View may show assignee, due date, description, and progress.
- Compact Task View may show relative due labels such as `Today`, `Tomorrow`, or an overdue label.
- Progress is converted from Vikunja's decimal value to a whole-number percentage.
- Kanban View prioritizes status, title, and count; secondary metadata must not crowd the board.

## Empty and error states

### Empty column

Show the column header with `(0)` and retain its separator position. Do not remove an empty status column.

### No filtered tasks

Task View shows a concise no-task message. Where space permits, it suggests checking filter settings.

Kanban View shows the board structure if bucket metadata exists, even when all columns are empty.

### Kanban unavailable

If the selected project has no usable Kanban view or the API cannot provide its bucket data:

- Show `Kanban unavailable`.
- Show a concise diagnostic message.
- Do not silently fall back to Task View.

### Invalid Kanban selection

If Kanban View has zero or multiple project numbers selected:

- Show a clear configuration message.
- Explain that exactly one project number is required.

## Shared elements

- Keep the Vikunja title bar consistent across all four templates.
- Keep the shared title bar in `src/shared.liquid`.
- Do not duplicate or customize title-bar identity per layout.
- Keep credentials out of visible markup, metadata, and task content.

## Framework 3.3 implementation rules

Use these established classes and patterns:

- Layout alignment: `layout layout--col layout--top` for top-anchored content.
- Horizontal Kanban flow: `flex flex--row flex--top gap`.
- Vertical Kanban flow: `flex flex--col gap`.
- Flexible horizontal status widths: `grow` on status sections.
- Vertical separators: `divider--v`.
- Horizontal separators: `divider--h`.
- Repeated task spacing: `gap--small`.
- Header-to-task spacing: `mt--small`.
- Text clamping: `data-clamp="1"` on task titles only.

Do not add custom CSS for spacing, borders, alignment, or colors unless Framework 3.3 cannot express the requirement and the exception is documented here first.

## Visual acceptance checklist

Before accepting a UI change, verify all four templates:

- [ ] Kanban headers include complete task counts.
- [ ] Header-to-task spacing is visible.
- [ ] Task-to-task spacing is visible.
- [ ] Full, Half Horizontal, and Quadrant columns are horizontal and top-aligned.
- [ ] Half Vertical statuses are stacked in API order.
- [ ] Separators use the correct direction.
- [ ] Empty columns remain visible with `(0)`.
- [ ] Long titles do not break column geometry.
- [ ] Task View still renders correctly.
- [ ] The preview is checked in both HTML and PNG mode when available.
- [ ] `trmnlp lint` passes.
- [ ] `git diff --check` passes.
