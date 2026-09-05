# Vikunja TRMNL Plugin Architecture

## Purpose and scope

This document defines the technical boundaries for the Vikunja TRMNL plugin. It is the implementation guide that keeps future iterations consistent with the user stories in `docs/user-stories.md`.

The plugin has three responsibilities:

1. Retrieve task data from a configured Vikunja instance.
2. Apply user-selected filtering and ordering before rendering.
3. Render the resulting task collection in TRMNL-compatible Liquid layouts.

It is not responsible for creating, editing, or completing Vikunja tasks. The display is read-only.

## Required technology and external references

### Liquid

All plugin views must be developed in Liquid. Liquid is the template language used to transform the prepared task data into the TRMNL display markup.

- Liquid reference: https://shopify.github.io/liquid/
- Keep business data preparation out of templates when it requires API calls, complex filtering, or error handling.
- Use Liquid for presentation decisions such as conditional metadata, truncation, date formatting, and layout markup.
- Escape or safely handle user/API text according to the capabilities of the TRMNL Liquid runtime.
- Avoid introducing JavaScript into display templates.

### TRMNL Liquid filters

Use the extra filters and runtime behavior supplied by `trmnl-liquid` whenever a supported filter solves the presentation problem.

- Reference: https://github.com/usetrmnl/trmnl-liquid
- Verify filter names and behavior against the version supported by the target TRMNL environment before use.
- Prefer supported filters over custom string manipulation in Liquid.
- Keep custom transformation logic in `src/transform.js` when the operation is not a presentation concern.
- Document any non-obvious TRMNL-specific filter in the shared template or this document.

### TRMNL Framework 3.3 UI System

All rendered markup must follow Framework 3.3 UI System conventions.

- Reference: https://trmnl.com/framework/docs/3.3
- Use Framework 3.3 layout, typography, item, label, spacing, and responsive utility classes.
- Keep the shared title bar in `src/shared.liquid` so all layouts have consistent identity and context.
- Use `lg:` responsive variants for larger TRMNL X frames where appropriate.
- Use `item--meta-emphasis-*` classes to communicate priority in compact layouts.
- Prefer grayscale and semantic Framework classes for e-paper readability and device compatibility.
- Do not add a parallel CSS system unless Framework 3.3 cannot express the required behavior.
- Every layout must remain readable at 800x480, 800x240, 400x480, and 400x240 respectively.

## Component boundaries

```text
Vikunja API
    |
    v
src/transform.js
  - build endpoint and request headers
  - fetch and validate response
  - normalize the task collection
  - apply filters
  - sort and limit
    |
    v
TRMNL data context
    |
    +--> src/shared.liquid
    |      shared title bar and template guidance
    |
    +--> src/full.liquid
    +--> src/half_horizontal.liquid
    +--> src/half_vertical.liquid
    +--> src/quadrant.liquid
           layout-specific Framework 3.3 markup
```

### Settings: `src/settings.yml`

The settings file is the user-facing contract for configuration. It defines the polling strategy, refresh interval, credentials, and filter controls.

Required settings:

- `api_token`: secret Vikunja bearer token.
- `base_url`: Vikunja instance URL without `/api/v1`.

Optional settings:

- `cf_access_client_id` and `cf_access_client_secret`: Cloudflare Access credentials.
- `project_ids`, `view_mode`, `status_filter`, `priority_filter`, `assignee_names`, and `search_query`.
- `show_favorites_only`, `min_progress`, `due_within_days`, and `tasks_per_view`.

The `project_ids` field accepts one or more comma-separated Vikunja project numbers. An empty value means all projects. Users find a project number by hovering over the project name in Vikunja's left menu. The task's `project_id` value is compared to the configured numbers.

The configured `base_url` is the source for the API endpoint. Avoid duplicating or appending `/api/v1` in the user-entered value. Secrets must remain password fields and must never be rendered into Liquid output.

### Data preparation: `src/transform.js`

The transformation layer owns network access and deterministic task preparation.

#### Request contract

- Build the default task endpoint as `<base_url>/api/v1/tasks`.
- Send `Authorization: Bearer <api_token>`.
- Add Cloudflare Access headers only when configured.
- Treat non-2xx responses as errors.
- Treat a non-array JSON payload as an empty task collection unless the TRMNL runtime requires a hard failure.

#### Filter pipeline

Apply filters in this order unless profiling or a requirement changes it:

1. Status.
2. Favorites.
3. Minimum priority.
4. Minimum progress.
5. Due-date window.
6. Project IDs.
7. Assignee names.
8. Search keywords.

When `view_mode` is `kanban`, the data preparation layer must also resolve exactly one selected project, retrieve its available view and bucket metadata, and associate tasks with buckets. The API-defined bucket order is the source of truth for column order. If the API cannot provide that metadata, return an explicit unavailable-board state.

This order keeps inexpensive boolean and numeric checks ahead of string-heavy operations. Filters combine with AND logic; comma-separated values inside one filter use OR logic.

#### Output contract

Return an object with:

```js
{
  tasks: [],
  meta: {
    total_shown: 0,
    filters_applied: {}
  }
}
```

Sort by `updated` descending and apply `tasks_per_view` after all filters. Preserve task fields needed by the templates, including `title`, `description`, `done`, `percent_done`, `due_date`, `assignees`, `priority`, and `project_id`.

### Shared presentation: `src/shared.liquid`

The shared template is the presentation foundation for every view.

- Keep the title bar markup and Vikunja identity consistent across all layouts.
- Keep common data preparation and shared guidance here only when it is compatible with the TRMNL renderer.
- Do not put layout-specific markup into the title bar.
- Respect the no-date sentinel before displaying a due date.
- Convert `percent_done` from decimal form to a whole-number percentage for display.

### Layout templates

Each layout owns only its markup and density decisions. Layouts should consume the prepared `data` collection and should not perform API calls or duplicate business filtering.

| Template | Target frame | Intent | Expected density |
| --- | --- | --- | --- |
| `full.liquid` | 800x480 | Rich task overview | Two-column grid, descriptions and metadata |
| `half_horizontal.liquid` | 800x240 | Wide compact queue | Two-column-capable compact list |
| `half_vertical.liquid` | 400x480 | Tall compact queue | One-column stacked list |
| `quadrant.liquid` | 400x240 | Minimal glance view | Short titles and minimal due information |

All views must define a useful empty state. Long titles and descriptions must be clamped or truncated using Framework 3.3-compatible patterns so content cannot expand the display unexpectedly.

Task View and Kanban View share the same TRMNL frame variants. Task View uses the existing list templates. Kanban View uses columns based on Vikunja buckets, with a density strategy appropriate to each frame; it must not silently reuse a task list when Kanban data is unavailable.

Kanban layout rules are frame-specific:

- Full, Half Horizontal, and Quadrant use the Framework 3.3 `columns` system in horizontal flow. Columns are top-aligned by the framework and adjacent columns use `divider--v`.
- Half Vertical uses the Framework 3.3 `columns` system with `data-overflow-max-cols="1"`, preserving API order from top to bottom. Adjacent columns use `divider--h`.
- The column structure must remain visible when a bucket has no tasks.
- Each Kanban header renders the bucket title followed by the visible task count in parentheses, for example `Doing (3)`.
- Use Framework 3.3 gap and spacing utilities for header-to-task and task-to-task separation; do not add ad hoc CSS.

## Display semantics

### Priority

Compact layouts map meaningful priorities to Framework 3.3 emphasis:

- Urgent/highest: strongest available emphasis.
- High: medium emphasis.
- Medium: light emphasis.
- Low and none: default emphasis.

The mapping must be consistent across all compact layouts.

### Completion

Completed tasks remain visible when the status filter allows them. Compact layouts should use the established visual treatment: muted text and a line-through title. The treatment must remain legible on e-paper.

### Dates

Never display the Vikunja no-date sentinel. Compact views may use `Today`, `Tomorrow`, an overdue label, or a short date. Full views may use a month/day format. Date calculations must use one consistent timezone policy supplied by the runtime.

### Empty and error states

- Empty result: show a concise no-task message and, where space allows, suggest checking filters.
- API error: fail visibly through the TRMNL/plugin error path with enough status information to diagnose the problem, but never expose tokens or secret header values.

## Security and reliability

- Treat API tokens and Cloudflare credentials as secrets.
- Do not log or render authorization headers.
- Do not include credentials in `meta`, task objects, or generated markup.
- Validate dates before parsing them.
- Handle missing arrays such as `assignees` without throwing.
- Keep filtering deterministic for the same input and time.
- Preserve graceful empty states when the API returns no tasks.

## Development and verification workflow

1. Update the relevant user story and Gherkin scenario for behavior changes.
2. Implement data behavior in `src/transform.js` and presentation behavior in the appropriate Liquid file.
3. Reuse Framework 3.3 classes and the supported `trmnl-liquid` filters.
4. Run the local preview with:

   ```sh
   gem install trmnl_preview
   trmnlp serve
   ```

5. Check all four layouts at their target dimensions and verify populated, empty, overdue, completed, filtered, and API-error states.
6. Confirm `git diff` contains only the intended functional or documentation change.

## Architectural decisions to preserve

- Liquid is the view language.
- `trmnl-liquid` provides the supported extended Liquid filters.
- Framework 3.3 is the UI system and class vocabulary.
- JavaScript prepares remote data; Liquid renders it.
- Shared markup belongs in `src/shared.liquid`; layout markup belongs in the individual view.
- Filtering, sorting, and limiting happen before rendering.
- The plugin is read-only and must remain safe for unattended e-paper refreshes.
