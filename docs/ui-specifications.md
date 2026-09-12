# Vikunja TRMNL Plugin UI Specifications

## Purpose

This document is the visual and interaction contract for the Vikunja TRMNL plugin. It complements `docs/user-stories.md` and `docs/architecture.md` by defining how the plugin should look and behave across TRMNL frames. For the per-frame Kanban column direction and font rules, see `docs/view-behavior.md`.

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

Task View is the default. Kanban View requires a project number.

**Note:** Selecting `view_mode: "kanban"` does **not** create a separate URL such as `/kanban`. The Kanban layout is rendered on the same four routes used for Task View:

```
/full
/half_horizontal
/half_vertical
/quadrant
```

When `view_mode` is set to `kanban`, each of these routes will display the Kanban board appropriate for the chosen frame size.

## Frame specifications

### Full

- Target: 800x480 landscape, 480x800 portrait; scale up for TRMNL X where supported.
- Task View: two-column task grid with title, optional description, assignee, due date, and progress. Task View is unmasked by orientation.
- Kanban View: the Full frame always renders the standard horizontal Kanban, with columns flowing side by side regardless of orientation.
- Orientation is detected at runtime from `trmnl.device.{width,height}` (portrait when `height > width`).
- Kanban: horizontal status columns, top-aligned, vertical `divider--v` separators that span the full column height (`divider--v stretch-y`). Titles are centered with `text--center` (plus `w--full` so the centering spans the column) and a horizontal `divider--h` separates each title from its tasks. This matches Half Horizontal.
- Kanban headers: `title--small lg:title--base` in both orientations.
- Full (landscape), Full (portrait), and Half Horizontal Kanban task titles use `text--wrap` (no clamp) so long titles wrap within their columns instead of truncating. Do not clamp the header count.

### Half Horizontal

- Target: 800x240.
- Task View: compact two-column-capable task queue.
- Kanban View: horizontal status columns, top-aligned.
- Kanban separators: vertical `divider--v stretch-y` between adjacent columns, reaching the bottom edge.
- Column titles are centered (`text--center` + `w--full`); a horizontal `divider--h` separates each title from its tasks.
- Keep task titles to one line and prioritize title visibility over secondary metadata.
- Use the smaller title scale and compact gaps to protect the shallow frame.

### Half Vertical

- Target: 400x480.
- Task View: one-column stacked task queue.
- Kanban View: status columns stacked vertically in API order.
- The first status is at the top; each following status is below it.
- Kanban separators: horizontal `divider--h` between adjacent status sections.
- Use full available width for each status section (`w--full` on the container and each column) so stacked buckets span the frame instead of sizing to their content.
- Columns are left‑aligned within the frame (flex `flex--left`).
- Task titles use `text--wrap` (no clamp) so long titles wrap within the full-width stacked columns instead of truncating.

### Quadrant

- Target: 400x240.
- Task View: minimal compact task list.
- Kanban View: status columns stacked vertically in API order, matching Half Vertical.
- Kanban separators: horizontal `divider--h` between adjacent status sections.
- Keep only the title and essential status information.
- Use the smallest practical title scale and avoid descriptions.
- **Task titles are rendered in a block element without `data-clamp="1"` to enable natural word‑wrapping for long titles.**

> **Orientation note:** Quadrant is a portrait frame. Kanban columns stack vertically, not horizontally. See `docs/view-behavior.md` for the frame-by-frame column direction and font rules.

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
- Kanban task items use priority-mapped Framework emphasis (`item--emphasis-1/2/3`) so high-priority tasks stand out against a plain meta bar, matching Task View.
- Done-column task titles use a line-through treatment, and done-column due dates are omitted.

## Kanban spacing

Use Framework 3.3 utilities only:

- Outer status arrangement: `gap` between horizontal columns or vertical status sections.
- Header-to-task spacing: `mt--small` on the task group.
- Task-to-task spacing: `gap--small` on the task group flex container.
- Horizontal frame separators (Landscape Full, Half Horizontal): `divider--v stretch-y`, filling the full column height.
- Vertical-stacked frame separators (Half Vertical, Quadrant): `divider--h`.

Spacing must be visible but compact enough for e-paper. If a frame overflows, reduce secondary metadata before reducing the separation between the header and task rows.

## Typography

- Framework titles are used for status headers and task titles.
- Full Kanban headers use `title--small lg:title--base` (landscape and portrait).
- Half Vertical/Quadrant Kanban headers use `title--small`.
- Compact Kanban headers and task titles use `title--small`.
- Task titles use `text--wrap` (no clamp) so long titles wrap within their columns instead of truncating. No Kanban frame clamps task titles.
- Kanban headers must not be clamped together with their counts. The count must remain visible.
- Avoid adding decorative typography or custom font declarations.

## Task semantics

### Completion

- Completed tasks remain visible when the status filter is `all`.
- Task View uses the established muted and line-through treatment for completed tasks.
- Kanban View communicates completion primarily through the done bucket and its position.

### Priority

### Priority

- Compact Task View and Kanban View communicate priority with Framework item emphasis classes (`item--emphasis-1/2/3`) applied to the task item.
- Urgent (4) uses `item--emphasis-3` (strongest).
- High (3) uses `item--emphasis-2` (medium).
- Medium (2) uses `item--emphasis-1` (light).
- Low (1) and none use default emphasis (no class).

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

If Kanban View has no project number selected:

- Show a clear configuration message.
- Explain that a project number is required.

## Shared elements

- Keep the Vikunja title bar consistent across all four templates.
- Keep the shared title bar in `src/shared.liquid`.
- Do not duplicate or customize title-bar identity per layout.
- Keep credentials out of visible markup, metadata, and task content.

## Framework 3.3 implementation rules

Use these established classes and patterns:

- Layout alignment: `layout layout--col layout--top` for top-anchored content.
- Horizontal Kanban flow: `flex flex--row flex--top w--full gap` (Full, Half Horizontal). `w--full` makes the row span the frame instead of sizing to its content, so the columns are not compressed to the width of the tasks.
- Vertical Kanban flow: `flex flex--col flex--left w--full gap` (Half Vertical, Quadrant). `w--full` is applied to both the container and each stacked column so the buckets span the full frame width instead of sizing to their content.
- Flexible horizontal status widths: `stretch-x` (`flex: 1 1 0%`) on Kanban columns (Full, Half Horizontal). Using `grow` alone would let a long `nowrap` task title expand its column's `flex-basis: auto` width, overflowing the divider; `stretch-x` with `min-width: 0` keeps columns equal-width regardless of content so each column shares the full-width row evenly.
- Kanban task titles (Full in both orientations, Half Horizontal) do **not** clamp; they use `text--wrap` so multi-word titles wrap within each column instead of truncating.
- Half Vertical Kanban task titles use `text--wrap` (no clamp) so long titles wrap within the full-width stacked columns instead of truncating.
- Vertical separators: `divider--v stretch-y` (landscape frames), spanning the full column height.
- Horizontal separators: `divider--h` (vertical-stacked frames).
- Orientation detection: compare `trmnl.device.height` and `trmnl.device.width` in Liquid.
- Repeated task spacing: `gap--small`.
- Header-to-task spacing: `mt--small`.
- Text clamping: `data-clamp="1"` is used only in Task View title rows, never in Kanban View. All Kanban frames use `text--wrap`.
- Small gray text/labels on 1-bit devices: any `--small`/`--xsmall` text or label that uses a gray treatment (`text--gray-50`, `label--gray`) must also carry `1bit:text--black 1bit:text--regular` so it stays readable on 1-bit palettes.

Do not add custom CSS for spacing, borders, alignment, or colors unless Framework 3.3 cannot express the requirement and the exception is documented here first.

## Visual acceptance checklist

Before accepting a UI change, verify all four templates:

- [ ] Kanban headers include complete task counts.
- [ ] Header-to-task spacing is visible.
- [ ] Task-to-task spacing is visible.
- [ ] Full (landscape and portrait) and Half Horizontal columns are horizontal and top-aligned.
- [ ] Half Vertical and Quadrant statuses are stacked in API order.
- [ ] The Full frame renders the standard horizontal Kanban in both orientations (verified in landscape and portrait).
- [ ] Separators use the correct direction.
- [ ] Empty columns remain visible with `(0)`.
- [ ] Long titles do not break column geometry.
- [ ] Small gray text/labels in all frames carry the `1bit:text--black 1bit:text--regular` overrides.
- [ ] Task View still renders correctly.
- [ ] The preview is checked in both HTML and PNG mode when available.
- [ ] `trmnlp lint` passes.
- [ ] `git diff --check` passes.
