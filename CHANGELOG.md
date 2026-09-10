# Changelog

All notable changes to this project will be documented in this file.

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
