# Vikunja TRMNL Plugin — View Behavior Specification

## Purpose

This document specifies how each TRMNL frame renders the Kanban View columns and their typography. It complements `docs/ui-specifications.md` (general visual contract) and `docs/user-stories.md` (functional contract) by pinning down the directional and typographic rules that differ per frame.

Read `docs/ui-specifications.md` for general Framework 3.3 rules, spacing utilities, empty states, and the shared title bar. This document focuses on Kanban column flow and font treatment.

## Frame orientation

TRMNL frames fall into two orientations. The **Full** frame is orientation-aware and adapts to whichever orientation it is mounted in; every other frame has a fixed target orientation. Kanban columns must follow the frame's primary flow direction.

| Orientation | Frame | Target | Column flow |
| --- | --- | --- | --- |
| Landscape (adaptive) | Full | 800x480 | Horizontal (side by side) |
| Portrait (adaptive) | Full | 480x800 | Vertical (stacked) |
| Landscape | Half Horizontal | 800x240 | Horizontal (side by side) |
| Portrait | Half Vertical | 400x480 | Vertical (stacked) |
| Portrait | Quadrant | 400x240 | Vertical (stacked) |

The plugin detects the **Full** frame's orientation at runtime from the device dimensions exposed to Liquid (`trmnl.device.width` / `trmnl.device.height`): the frame is portrait when `height > width`, otherwise landscape. The preview's orientation toggle updates these dimensions, so the same markup renders both layouts.

### Landscape — horizontal columns

Full (in landscape) and Half Horizontal arrange Kanban buckets side by side, top-aligned.

- Wrap columns in `flex flex--row flex--top gap`.
- Each column uses `grow` so widths are shared evenly.
- Use `divider--v` between adjacent columns.
- Columns start at the same top position.
- The done bucket keeps its API position among the columns.

### Portrait — vertical columns

Full (in portrait), Half Vertical, and Quadrant stack Kanban buckets vertically in API-defined order.

- Wrap columns in `flex flex--col flex--left gap` (no outer `flex--row`).
- Each column uses the full available width.
- Use `divider--h` between adjacent status sections.
- The first status appears at the top; each following status appears below it.
- Columns are left-aligned within the frame.

## Column anatomy

Each Kanban column (in any frame) is built from:

```text
STATUS (N)

<task title>
due 12 Feb    <- only when the task has a valid due date
<task title>
```

Rules that apply to every frame:

- `STATUS` is the Vikunja bucket title, uppercase.
- `N` is the number of visible tasks after configured filters, in parentheses.
- Tasks remain in API-defined order inside each bucket.
- Empty columns keep their header and `(0)` count, and keep their separator position.
- The done bucket is identified by the API-defined `done_bucket_id`.
- Each task row uses the Framework `.item` structure with an empty `.meta`, producing a left gray meta bar without numbering.
- Done-column task titles use line-through and a muted (`text--gray-50`) treatment; done-column due dates are omitted.

## Font styles and sizes

Use Framework 3.3 title and label utilities — never custom font declarations.

| Element | Landscape (Full) | Portrait (Full) | Half Horizontal | Half Vertical | Quadrant |
| --- | --- | --- | --- | --- | --- |
| Column header | `title--small lg:title--base` | `title--small` | `title--small lg:title--base` | `title--small` | `title--small` |
| Task title | `title--small` with `data-clamp="1"` | `title--small` with `data-clamp="1"` | `title--small` with `data-clamp="1"` | `title--small` with `data-clamp="1"` | `title--small` with `text--wrap` (no clamp) |
| Task due label | `label--small label--gray` | `label--small label--gray` | `label--small label--gray` | `label--small label--gray` | `label--xsmall label--gray` |

Every small gray element (the muted done-column title via `text--gray-50`, and the gray due label via `label--gray`/`label--xsmall`) also carries `1bit:text--black 1bit:text--regular`. This keeps small gray text readable on 1-bit device palettes without escalating those labels to `label--inverted`. The override is applied in every frame and in both Task View and Kanban View.

Notes:

- Full (landscape) and Half Horizontal use the larger `lg:title--base` for column headers so headers are readable across a wide board.
- Full (portrait), Half Vertical, and Quadrant use `title--small` headers because of the narrower, taller flow. The Full frame's header and task-title typography switch with its layout, exactly like the column flow, at runtime.
- Half Vertical clamps task titles (`data-clamp="1"`) to keep the stacked layout stable.
- Quadrant does **not** clamp task titles; it uses `text--wrap` so long titles wrap naturally within the minimal frame.
- Kanban headers must never be clamped together with their counts. The count must always remain visible.
- Header-to-task spacing uses `mt--small`; task-to-task spacing uses `gap--small`.
- The done-column title line-through applies in all frames.

## Orientation summary

```
Landscape  │ Full (oriented) ......  flex--row  + divider--v  ── horizontal
           │ Half Horizontal ......  flex--row  + divider--v  ── horizontal
Portrait   │ Full (oriented) ......  flex--col  + divider--h  ── vertical (stacked)
           │ Half Vertical ........  flex--col  + divider--h  ── vertical (stacked)
           │ Quadrant .............  flex--col  + divider--h  ── vertical (stacked)
```

Orientation is detected at runtime from `trmnl.device.{width,height}`; portrait is `height > width`. The single `src/full.liquid` template chooses its classes accordingly, so no separate portrait template is needed.