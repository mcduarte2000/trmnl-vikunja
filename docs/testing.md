# Vikunja TRMNL Plugin — Regression Testing

## Purpose

This document is the executable checklist for verifying that a change to the plugin does not introduce regressions. It is used before a release (`trmnlp push` / CI deploy) and after any change to `src/transform.js`, `src/settings.yml`, a Liquid template, or the filter pipeline.

Each section maps back to a functional requirement. Mark every applicable check against a **clean** local preview (fresh server, see §3).

> **If you changed `src/transform.js`, `src/settings.yml`, or `.trmnlp.yml`, always start with §3.** A stale preview server keeps the previously-mounted config and markup in memory and produces misleading results.

## 1. Validation commands

Run these static checks first — they are cheap and catch the most common mistakes.

| Check | Command | Pass |
| --- | --- | --- |
| JavaScript syntax | `docker run --rm -v "$PWD:/plugin" -w /plugin --entrypoint node trmnl/trmnlp --check src/transform.js` | exits 0 |
| Settings YAML | `docker run --rm -v "$PWD:/plugin" -w /plugin --entrypoint ruby trmnl/trmnlp -e 'require "yaml"; YAML.safe_load_file("src/settings.yml"); puts "settings YAML OK"'` | prints `settings YAML OK` |
| Plugin lint | `docker run --rm -v "$PWD:/plugin" -w /plugin --entrypoint /app/bin/trmnlp trmnl/trmnlp lint` | prints `✓ All checks passed!` |
| Whitespace | `git diff --check` | only known pre-existing CRLF notes in `src/shared.liquid` |
| Line endings | `file src/shared.liquid` | `with CRLF line terminators` (this file is CRLF by convention; other `src/*.liquid` are LF) |

> **Lint note:** `trmnlp lint` checks that every custom field in `src/settings.yml` is referenced in a form field or markup. After renaming a setting key, ensure the new keyname is used everywhere and the old keyname is gone from `.trmnlp.yml` too.

## 2. Render routes

Every TRMNL frame must render without an HTTP error. Start a clean preview server (see §3) and request each route.

| Route | Endpoint |
| --- | --- |
| Full | `http://localhost:4567/render/full.html` |
| Half Horizontal | `http://localhost:4567/render/half_horizontal.html` |
| Half Vertical | `http://localhost:4567/render/half_vertical.html` |
| Quadrant | `http://localhost:4567/render/quadrant.html` |

Each must return **HTTP 200**. Save each response to a file and assert:

- `grep -c "requires a project\|configuration message\|kanban_error" <file>` is `0` when configured correctly.
- The title bar carries the project filter: `grep -o 'data-project-filter="[^"]*"' <file>` reflects the configured `project_id` (or the value the template expects).

## 3. Starting a clean preview (IMPORTANT)

The Docker preview server (`trmnlp serve`) loads `src/*.liquid`, `src/transform.js`, and `.trmnlp.yml` at startup and caches them in memory.

- **Do NOT** reuse a server started before your edits — it still runs the old transform/config and will produce false errors.
- To restart the server:

```sh
# stop the stale container (find its PID first)
ps aux | grep -i trmnlp | grep -v grep
kill <PID>

# start a fresh one in the background
cd "/Users/miguelduarte/Documents/AI Projects/TRMNL Vikunja" && \
  docker run --rm -v "$PWD:/plugin" -w /plugin -p 4567:4567 \
    --entrypoint /app/bin/trmnlp trmnl/trmnlp serve
```

- Confirm the startup log fetches the configured project, e.g. `GET https://<host>/api/v1/projects/3/tasks — 200`. That line proves the server read the expected `project_id`/`polling_url`.

## 4. Task View regression checks

Configure `.trmnlp.yml`/settings for Task View (`view_mode: "task"`) and verify:

- [ ] Filters combine with AND logic; empty filters do not exclude tasks.
- [ ] Tasks sort by `updated` descending.
- [ ] Output capped to `tasks_per_view`.
- [ ] The title bar renders the configured `project_id` in the `data-project-filter` attribute (empty when "all projects").
- [ ] Each frame (Full, Half Horizontal, Half Vertical, Quadrant) renders the task list within bounds.
- [ ] The no-date sentinel (`0001-01-01T00:00:00Z`) is not displayed as a due date.
- [ ] `percent_done` is displayed as a whole-number percentage.

## 5. Kanban View regression checks

Configure `view_mode: "kanban"` with a valid `project_id` and verify:

- [ ] The plugin fetches the project's kanban view and buckets via `<base_url>/api/v1/...`.
- [ ] API-defined bucket order is preserved.
- [ ] Each column header shows the visible task count in parentheses.
- [ ] Empty buckets remain visible as empty columns.
- [ ] Horizontal columns: Full (landscape) and Half Horizontal show side-by-side, top-aligned columns with vertical dividers.
- [ ] Vertical columns: Full (portrait), Half Vertical, and Quadrant stack statuses vertically with horizontal dividers.
- [ ] Spacing exists between a column header and its first task, and between task rows.
- [ ] Completed tasks remain distinguishable from active (semantic `label--success` handling).
- [ ] With no `project_id`, the render shows a clear configuration message and does **not** silently fall back to Task View.

## 6. Filter regression checks (Per-Filter)

Set one filter at a time (all others empty) and verify each matches `docs/filters.md`:

- [ ] **Status** — `active`/`completed`/`all` selects tasks by `done`.
- [ ] **Favorites only** — only `is_favorite === true` tasks remain when enabled.
- [ ] **Minimum priority** — only tasks `>=` the threshold remain; `0` (Any) excludes none.
- [ ] **Min progress** — only tasks with at least the configured percent; `0` excludes none.
- [ ] **Due within** — only valid due dates in the window; `0` (Anytime) excludes none.
- [ ] **Project ID** — **single project**: a task shows **only** when `String(task.project_id) === String(configured project_id)`; empty shows all projects. (No comma-separated/multi-project matching.)
- [ ] **Assignee** — case-insensitive OR match on name or username; empty shows all.
- [ ] **Search** — case-insensitive OR match, HTML ignored in description; empty shows all.

## 7. Accessibility regression checks (1-bit readability)

Framework 3.3 overrides for small gray text on 1-bit palettes. Verify across **all four frames** and in **both Task View and Kanban View**:

- [ ] Every small gray element — the muted done-column title (`title--small`/`title--base` with `text--gray-50`) and the gray due-date label (`label--small`/`label--xsmall` with `label--gray`) — carries **both** `1bit:text--black 1bit:text--regular`.
- [ ] The override count matches the source:
  - `src/full.liquid` → 3 occurrences
  - `src/half_horizontal.liquid` → 4
  - `src/half_vertical.liquid` → 4
  - `src/quadrant.liquid` → 4

```sh
grep -c "1bit:text--black 1bit:text--regular" src/full.liquid \
  src/half_horizontal.liquid src/half_vertical.liquid src/quadrant.liquid
```

- [ ] On a 1-bit device palette the small text remains readable (full-contrast) without escalating to `label--inverted`.

## 8. Regression check for the single-project-ID change

These cases verify the simplification from comma-separated multi-project (`project_ids`) to a single `project_id` number field (see `docs/filters.md`, `docs/architecture.md`).

- [ ] `src/settings.yml` uses `keyname: project_id`, `field_type: number`, with `min: 1`; **no** `multi_string_0385` / `project_ids` key remains.
- [ ] `polling_url` uses `{{ project_id }}` (singular), not `{{ project_ids }}`.
- [ ] `.trmnlp.yml` (local dev) uses `project_id`, not `project_ids`.
- [ ] `trmnlp lint` passes (the old `project_ids` keyname would be flagged as unused).
- [ ] A **single** numeric `project_id` (e.g. `3`) filters to that project's tasks and the title bar shows `data-project-filter="3"`.
- [ ] An **empty** `project_id` shows all projects, and the title bar honors that empty value.
- [ ] A **non-numeric or invalid** value produces no silent fallback; Task View treats it as a non-match, Kanban View surfaces a clear "requires a project number" message.
- [ ] Kanban View no longer rejects a valid single value with "exactly one project number" — a single field always satisfies the requirement.

## 9. Document-sync check

When behavior changes, confirm the supporting documentation was updated together with the code:

- [ ] `docs/user-stories.md` Gherkin scenarios reflect the change.
- [ ] `docs/architecture.md` data-flow / filter pipeline reflects the change.
- [ ] `docs/ui-specifications.md` visual rules and acceptance checklist reflect the change.
- [ ] `docs/filters.md` setting table matches `src/settings.yml`.
- [ ] `docs/view-behavior.md` per-frame rules reflect the change.
- [ ] `CHANGELOG.md` has a dated entry for the change.

## Related documents

- `docs/user-stories.md` — functional contract and Gherkin acceptance criteria.
- `docs/architecture.md` — data flow, filter pipeline, and output contract.
- `docs/ui-specifications.md` — how filtered results render on each frame.
- `docs/filters.md` — per-setting reference and filter behavior.
- `docs/view-behavior.md` — per-frame Kanban column direction and typography.