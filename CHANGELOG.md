# Changelog

All notable changes to this project will be documented in this file.

## [v1.2.3] - 2026-09-12

### Feature
- Milestone: Kanban View now renders the correct visualization across **all** frame views and orientations — portrait and landscape — and has been validated in TRMNL OG, TRMNL X, and Kindle-class devices.
- Portrait **Full** frame now uses the same standard side-by-side Kanban as Landscape Full and Half Horizontal: top-aligned, equal-width columns (`stretch-x`) separated by full-height `divider--v stretch-y` vertical separators, centered full-width headers, and a horizontal `divider--h` under each header. Previously the portrait branch stacked columns vertically with horizontal dividers.

### Change
- Made the **Quadrant** Kanban task titles smaller for the minimal compact frame: task cards now use `text--small` (12px) instead of `title--small` (16px). Column headers remain at `title--small` (16px), and the Task View quad/layout is unchanged.
- Made the **Quadrant** Kanban and Task View due-date labels smaller too: they now use `label--gray text--small` instead of the invalid `label--xsmall` class (which fell back to the 16px base label size). They stay visually distinct from the normal task text via the gray color.
- Unified Kanban column classes through Liquid variables in `src/full.liquid` so the portrait and landscape branches share one markup block. Both now use the row container `flex flex--row flex--top h--full w--full gap`, so the board spans the full frame in every orientation.
- All Kanban frames (Full in both orientations, Half Horizontal, Half Vertical, Quadrant) now use `text--wrap` on task titles instead of `data-clamp="1"`, so long titles wrap naturally within their columns instead of truncating. Only Task View still uses `data-clamp`.
- Half Vertical and Quadrant Kanban containers and stacked columns now use `w--full` so the buckets span the full frame width instead of sizing to their content (done in the prior working tree).
- Half Horizontal now uses `w--full` on its row and `stretch-x` on its columns for shared equal widths, matching Landscape Full.

### Fix
- Corrected the local preview config values in `.trmnlp.yml` — the `select` custom fields (`view_mode`, `status_filter`, etc.) were storing the literal string `"[object Object]"`, which caused the View Mode dropdown to display "object Object" and the Kanban view to fall back to Task View. They now hold the real option values (`view_mode: kanban`, `status_filter: all`, …).
- Clarified that `status_filter: ''` behaves like `active` (keeps only `done === false` tasks), which silently strips done tasks from the Kanban Done column; `status_filter: all` keeps every status.

### Documentation
- Updated `docs/ui-specifications.md`, `docs/view-behavior.md`, `docs/architecture.md`, `docs/testing.md`, and `docs/user-stories.md` to describe Portrait Full as a standard horizontal (side-by-side) Kanban in both orientations, matching Half Horizontal and Landscape Full. Half Vertical and Quadrant remain vertically stacked with horizontal dividers.

## [v1.2.2] - 2026-09-12

### Change
- In Kanban View, the horizontal frames (Full landscape and Half Horizontal) now draw each column's vertical separator with `divider--v stretch-y` so the separators span the full column height and reach the bottom edge of the screen.
- The Kanban column header now has a visible separation from its tasks: a horizontal `divider--h` sits between the column title and the first task in the horizontal frames. Portrait frames are unchanged.
- Column titles in the horizontal Kanban frames are now centered on their columns. The header span uses `text--center` together with `w--full` so the centering spans the full column width.

### Documentation
- Updated `docs/ui-specifications.md`, `docs/view-behavior.md`, `docs/architecture.md`, and `docs/testing.md` to describe the full-height vertical separators (`divider--v stretch-y`) for the horizontal Kanban frames and the horizontal `divider--h`/centered full-width header pattern.

## [v1.2.1] - 2026-09-12

### Fix
- Fixed a rendering failure where `src/shared.liquid` contained stray control bytes that broke the Liquid comment blocks, producing an `Unknown tag 'endcomment'` error on all view routes. The file was restored to a clean state and the guidance comment edits were re-applied.

### Change
- In Task View, priority is now rendered with the framework's valid emphasis classes. Each task item uses `item--emphasis-1/2/3` (Urgent=4 → `item--emphasis-3`, High=3 → `item--emphasis-2`, Medium=2 → `item--emphasis-1`, otherwise no class) instead of the non-existent `item--meta-emphasis-*` class, which had no visual effect. This applies across the Full, Half Horizontal, Half Vertical, and Quadrant frames.

### Change
- Kanban column priority emphasis is now consistent across all four frames, replacing the previous mix of plain items (Full, Half Horizontal) and hardcoded `item--emphasis-3` (Half Vertical, Quadrant) with the same priority-to-emphasis mapping used in Task View.

### Documentation
- Updated `docs/architecture.md`, `docs/ui-specifications.md`, `docs/user-stories.md`, and the `src/shared.liquid` guidance comments to reference the valid `item--emphasis-1/2/3` classes instead of `item--meta-emphasis-*`.
- Clarified the `src/shared.liquid` filter-pipeline guidance: the due-date filter excludes the sentinel and overdue tasks, and project filtering uses a single project ID (empty = all projects).

## [v1.2.0] - 2026-09-11

### Documentation
- Added `docs/testing.md` — regression test checklist covering validation commands, render routes, Task/Kanban View checks, per-filter behavior, 1-bit accessibility, the single-project-ID change, and document-sync checks.

### Change
- Simplified project selection to a single project ID. The `multi_string_0385` (multi-string) field is replaced with a single `project_id` `number` field in `src/settings.yml`, and `polling_url` now uses `{{ project_id }}`. This removes the comma-separated multi-project logic, eliminates Kanban ambiguity (a single field satisfies Kanban View's requirement), and simplifies production configuration.

### Documentation
- Updated `docs/architecture.md`, `docs/filters.md`, `docs/ui-specifications.md`, `docs/user-stories.md`, and `AGENTS.md` to describe the single `project_id` setting.

## [v1.1.1] - 2026-09-11

### Change
- Improved readability of small gray text on 1-bit devices. Every small gray element — the muted done-column title (`title--small text--gray-50`) and the gray due-date label (`label--small label--gray` / `label--xsmall label--gray`) — now carries `1bit:text--black 1bit:text--regular` in all four frames and in both Task View and Kanban View. The `1bit:bg--`… `1bit:text--black` override restores full-contrast text on 1-bit palettes, and `1bit:text--regular` keeps the weight-based visual distinction rather than escalating to `label--inverted`.

### Documentation
- Updated `src/shared.liquid` color policy, `docs/ui-specifications.md`, and `docs/view-behavior.md` to document the `1bit:` override rule.

## [v1.1.0] - 2026-09-10

### Feature
- Kanban View now supports the Full frame in portrait orientation (480×800). The Full template detects its orientation at runtime from `trmnl.device.{width,height}` (portrait when `height > width`) and stacks Kanban columns vertically with horizontal dividers; landscape (800×480) keeps horizontal, top-aligned columns with vertical dividers.

### Change
- Quadrant Kanban columns are now stacked vertically (previously horizontal) to match Half Vertical/Full-portrait behavior.
- Rewrote `src/transform.js` with the full filtering pipeline (status, favorites, priority, progress, due-within, project, assignee, search), Kanban bucket retrieval for exactly one project, and `meta` output.
- Replaced the `Multi String` placeholder in `src/settings.yml` with a clear `Project Number` field.

### Documentation
- Added `docs/filters.md` documenting the transform filtering pipeline.
- Added `docs/view-behavior.md` (per-frame Kanban column direction and typography, including Full orientation).
- Updated `docs/architecture.md`, `docs/ui-specifications.md`, `docs/user-stories.md`, and `AGENTS.md` to reflect the orientation-aware Full frame and vertical Quadrant layout.

## [v1.0.1] - 2026-09-05
- Align Kanban views (Full, Half Horizontal, Half Vertical, Quadrant) to top.
- Added left‑alignment for Half Vertical columns.
- Enabled word‑wrap for Quadrant task titles by rendering titles in block elements without `data-clamp="1"`.
- Updated UI specifications to reflect the above changes.
- Updated documentation files (`AGENTS.md`, `docs/ui-specifications.md`).

## [v1.0.0] - 2026-09-05
- Initial release of the plugin with basic Kanban and Task View layouts.
