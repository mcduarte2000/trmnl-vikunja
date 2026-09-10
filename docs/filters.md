# Vikunja TRMNL Plugin Filters

## Purpose

This document describes every filter the Vikunja plugin can apply to tasks before they render on the TRMNL display. It is the reference for how a filter is configured, what it does, and how multiple filters combine.

For the formal behavior contract, see `docs/user-stories.md`. For the technical filter pipeline and ordering, see `docs/architecture.md`.

## How filters combine

- All configured filters combine with **AND logic** across different filter types. A task must satisfy every active filter to be shown.
- Multiple values inside a **single** filter (comma-separated) use **OR logic**. A task is shown if it matches any of the entered values.
- Filters are applied before sorting and limiting. The result is always sorted by most recently updated first, then capped to `tasks_per_view`.
- Empty filters do not exclude tasks. Leaving a filter unset means "show everything for this dimension."

## Filter order (data pipeline)

Filters are applied in `src/transform.js` in this order, from cheapest to most expensive:

1. Status
2. Favorites
3. Minimum priority
4. Minimum progress
5. Due date window
6. Project IDs
7. Assignee names
8. Search keywords

This order keeps inexpensive boolean and numeric checks ahead of string-heavy operations.

## The available filters

Each filter section lists the display label and the attributes defined in `src/settings.yml`: **Description**, **Help Text**, **Default**, and **Placeholder** (when present).

### Completion status

| Property | Value |
| --- | --- |
| Setting (keyname) | `status_filter` |
| Label | Task Status |
| Description | Filter tasks by completion status |
| Help text | — |
| Type | Select |
| Options | Active (`active`), Completed (`completed`), All (`all`) |
| Default | `active` |
| Placeholder | — |

**Behavior**

- `active`: only tasks where `done` is `false`.
- `completed`: only tasks where `done` is `true`.
- `all`: both completed and active tasks may be shown.

### Favorites only

| Property | Value |
| --- | --- |
| Setting (keyname) | `show_favorites_only` |
| Label | Favorites Only |
| Description | Show only starred/favorite tasks |
| Help text | — |
| Type | Boolean |
| Default | `false` |
| Placeholder | — |

**Behavior** When enabled, only tasks where `is_favorite` is `true` are shown.

### Minimum priority

| Property | Value |
| --- | --- |
| Setting (keyname) | `priority_filter` |
| Label | Minimum Priority |
| Description | Show tasks at or above this priority level |
| Help text | — |
| Type | Select |
| Options | Any (`0`), Low (`1`), Medium (`2`), High (`3`), Highest (`4`), Urgent (`5`) |
| Default | `0` (Any) |
| Placeholder | — |

**Behavior** Shows tasks at or above the selected level using Vikunja's numeric priority scale (`0` none, `1` low, `2` medium, `3` high, `4` highest, `5` urgent). `Any` performs no exclusion.

### Minimum progress

| Property | Value |
| --- | --- |
| Setting (keyname) | `min_progress` |
| Label | Min Progress (%) |
| Description | Only show tasks with at least this much progress |
| Help text | — |
| Type | Number |
| Range | 0–100 |
| Default | `0` |
| Placeholder | — |

**Behavior** Shows only tasks with progress at least this percentage. Vikunja stores progress as a decimal from `0` to `1`; the plugin compares after converting to a whole-number percentage. A value of `0` performs no exclusion.

### Due within

| Property | Value |
| --- | --- |
| Setting (keyname) | `due_within_days` |
| Label | Due Within |
| Description | Filter by upcoming due dates |
| Help text | — |
| Type | Select |
| Options | Anytime (`0`), Today (`1`), This Week (`7`), Next 2 Weeks (`14`), This Month (`30`) |
| Default | `0` (Anytime) |
| Placeholder | — |

**Behavior** Shows only tasks with a valid due date from now through the cutoff. `Anytime` performs no exclusion. Tasks without a due date, or with the Vikunja no-date sentinel `0001-01-01T00:00:00Z`, are excluded when a positive value is set.

### Projects

| Property | Value |
| --- | --- |
| Setting (keyname) | `multi_string_0385` |
| Label | Project Number |
| Description | One or more project numbers, separated by commas |
| Help text | Hover your mouse over the link to the project in Vikunja to get the project number. Leave empty to show tasks from all projects. |
| Type | Multi string (comma-separated values) |
| Default | `''` (all projects) |
| Placeholder | `1` |

**Behavior** Shows a task when its `project_id` matches any entered project number (OR logic). An empty value shows tasks from all projects.

> **Note:** this setting also feeds the Kanban polling URL (`/api/v1/projects/{id}/tasks`). Kanban View requires **exactly one** project number.

### Assignees

| Property | Value |
| --- | --- |
| Setting (keyname) | `assignee_names` |
| Label | Assignee Names |
| Description | Filter by assignee. Leave empty for all assignees. |
| Help text | Enter one or more assignee names separated by commas (e.g. "Miguel,Ana"). Matches against task assignees. Leave empty to show all tasks regardless of assignee. |
| Type | Text |
| Default | `''` (all assignees) |
| Placeholder | `Miguel` |

**Behavior** Shows a task when any assignee name or username matches any entered value (OR logic). Matching is case-insensitive. An empty value shows all tasks regardless of assignee.

### Search keywords

| Property | Value |
| --- | --- |
| Setting (keyname) | `search_query` |
| Label | Search Keywords |
| Description | Filter by task title or description. Multiple terms = OR logic. |
| Help text | Enter one or more keywords separated by commas (e.g. "bug,fix,critical"). A task matches if any keyword is found in its title or description. Leave empty for no search filter. |
| Type | Text |
| Default | `''` (no search) |
| Placeholder | `bug,fix,critical` |

**Behavior** Shows a task when any keyword occurs in its title or description (OR logic). Matching is case-insensitive and ignores HTML markup in the description. An empty value applies no search filter.

## Filters that affect layout only

### View Mode

| Property | Value |
| --- | --- |
| Setting (keyname) | `view_mode` |
| Label | View Mode |
| Description | Choose how tasks are displayed |
| Help text | — |
| Type | Select |
| Options | Task View (`task`), Kanban View (`kanban`) |
| Default | `task` |
| Placeholder | — |

This is not a task filter but chooses the rendering layout:

- `task` uses the task-list layouts for the selected frame.
- `kanban` requires exactly one project number and renders the selected project's buckets as status columns.

### Tasks per view

| Property | Value |
| --- | --- |
| Setting (keyname) | `tasks_per_view` |
| Label | Tasks Per View |
| Description | Maximum number of tasks to display |
| Help text | — |
| Type | Number |
| Range | 1–10 |
| Default | `6` |
| Placeholder | — |

This caps the number of tasks shown after all filters. It is a limit, not a filter.

## Examples

Given these settings:

```yaml
status_filter: active
priority_filter: "3"      # High
min_progress: 50
due_within_days: "14"
multi_string_0385: "3, 7"
assignee_names: Miguel,Ana
search_query: api,fix
tasks_per_view: 6
```

A task is shown only if **all** of these hold:

- `done` is `false`
- `priority` is `3`, `4`, or `5`
- progress is `50%` or more
- `due_date` is valid and within the next 14 days
- `project_id` is `3` or `7`
- an assignee is `Miguel` or `Ana` (case-insensitive)
- `api` or `fix` appears in the title or description

The result is then sorted by `updated` descending and limited to `6` tasks.

## Empty results

Empty results are a valid state. When no tasks pass the filters, the layouts render a concise no-task message and, where space allows, suggest checking the filters.

## Related documents

- `docs/user-stories.md` — functional contract and Gherkin acceptance criteria.
- `docs/architecture.md` — data flow, filter pipeline, and output contract.
- `docs/ui-specifications.md` — how filtered results render on each frame.