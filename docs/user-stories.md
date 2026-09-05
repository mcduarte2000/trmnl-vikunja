# Vikunja TRMNL Plugin User Stories

## Purpose

This document is the single functional contract for the Vikunja TRMNL plugin. It describes what a user can configure, what data the plugin must show, and how each display layout should behave. New implementation work should add or update acceptance criteria here before changing the plugin.

## Product outcome

As a Vikunja user, I want a reliable, glanceable view of the tasks that matter to me on my TRMNL e-paper display, so that I can understand what needs attention without opening Vikunja.

## Domain rules

- The source of truth is the Vikunja tasks API.
- A Vikunja task is considered completed when `done` is `true`.
- Vikunja priority values are `0` none, `1` low, `2` medium, `3` high, `4` highest, and `5` urgent.
- Vikunja's `0001-01-01T00:00:00Z` due date means that no due date is set.
- `percent_done` is a decimal from `0` to `1` and is displayed as a whole-number percentage.
- Multiple values in a comma-separated filter use OR logic within that filter.
- All configured filters combine with AND logic across different filter types.
- Tasks are sorted by most recently updated first, then limited to the configured number of tasks.
- Empty results are a valid state and must produce a useful message rather than a broken layout.

## US-001: Connect a Vikunja instance

**As a** TRMNL plugin user  
**I want** to configure my Vikunja instance and API token  
**So that** the display can retrieve my tasks securely.

### Acceptance criteria

```gherkin
Feature: Connect to Vikunja

  Scenario: Configure a standard Vikunja instance
    Given I enter a base URL without the /api/v1 suffix
    And I enter a valid Vikunja API token
    When the plugin polls for tasks
    Then it requests the Vikunja tasks endpoint using the configured base URL
    And it sends the API token as a bearer token
    And it renders the returned tasks

  Scenario: Configure a Vikunja instance behind Cloudflare Access
    Given I enter a base URL and API token
    And I enter a Cloudflare Access client ID and client secret
    When the plugin polls for tasks
    Then it includes both Cloudflare Access headers in the request

  Scenario: Leave Cloudflare Access credentials empty
    Given I do not enter Cloudflare Access credentials
    When the plugin polls for tasks
    Then it does not require those optional credentials to be present

  Scenario: Reject an unsuccessful API response
    Given the Vikunja API returns a non-success HTTP status
    When the plugin processes the response
    Then it reports an error containing the HTTP status
    And it does not render the response as task data
```

## US-002: Filter by completion status

**As a** user managing active work  
**I want** to choose active, completed, or all tasks  
**So that** the display reflects my current focus.

### Acceptance criteria

```gherkin
Feature: Filter by completion status

  Scenario: Show active tasks
    Given the status filter is "active"
    When tasks are processed
    Then only tasks with done equal to false are shown

  Scenario: Show completed tasks
    Given the status filter is "completed"
    When tasks are processed
    Then only tasks with done equal to true are shown

  Scenario: Show all tasks
    Given the status filter is "all"
    When tasks are processed
    Then both completed and active tasks may be shown
```

## US-003: Filter by priority and progress

**As a** user prioritizing important work  
**I want** minimum priority and progress filters  
**So that** low-value or insufficiently progressed tasks can be excluded.

### Acceptance criteria

```gherkin
Feature: Filter by priority and progress

  Scenario: Apply a minimum priority
    Given the minimum priority is High
    When tasks are processed
    Then tasks with priority High, Highest, or Urgent are shown
    And tasks with lower priority are excluded

  Scenario: Do not filter priority when Any is selected
    Given the minimum priority is Any
    When tasks are processed
    Then tasks are not excluded based on priority

  Scenario: Apply a minimum progress percentage
    Given the minimum progress is 50
    When tasks are processed
    Then tasks with progress of 50 percent or greater are shown
    And tasks with progress below 50 percent are excluded

  Scenario: Do not filter progress at zero
    Given the minimum progress is 0
    When tasks are processed
    Then tasks are not excluded based on progress
```

## US-004: Filter by project, assignee, and keywords

**As a** user with multiple projects and collaborators  
**I want** to narrow tasks by project number, assignee, or search terms  
**So that** the display shows a specific slice of my work.

### Acceptance criteria

```gherkin
Feature: Filter task ownership and content

  Scenario: Discover a project number
    Given I am viewing the Vikunja project list
    When I hover over a project name in the left menu
    Then I can find that project's number

  Scenario: Filter by one or more project numbers
    Given I enter one or more project numbers separated by commas
    When tasks are processed
    Then a task is shown when its project number matches any entered number
    And tasks from other projects are excluded

  Scenario: Show tasks from all projects
    Given I leave the Projects filter empty
    When tasks are processed
    Then tasks from all projects remain eligible

  Scenario: Filter by assignee name or username
    Given I enter one or more assignee names separated by commas
    When tasks are processed
    Then a task is shown when any assignee name or username matches any entered value
    And matching is case-insensitive

  Scenario: Search task title and description
    Given I enter keywords separated by commas
    When tasks are processed
    Then a task matches when any keyword occurs in its title or description
    And matching is case-insensitive
    And HTML markup in the description is ignored

  Scenario: Leave optional content filters empty
    Given I leave Projects, assignee, and search filters empty
    When tasks are processed
    Then those filters do not exclude tasks
```

## US-005: Select the display view

**As a** TRMNL plugin user  
**I want** to choose between Task View and Kanban View  
**So that** I can see my Vikunja work in the format that best matches how I plan it.

### Acceptance criteria

```gherkin
Feature: Select the display view

  Scenario: Configure Task View
    Given I select "Task View" in the View Mode setting
    When the plugin renders
    Then it uses the task-list layouts for the selected TRMNL frame
    And it applies the configured task filters

  Scenario: Configure Kanban View
    Given I select "Kanban View" in the View Mode setting
    When the plugin renders
    Then it uses the Kanban layout for the selected TRMNL frame
    And it applies the configured project selection

  Scenario: Use Task View by default
    Given I do not change the View Mode setting
    When the plugin renders
    Then it uses Task View

  Scenario: Keep the view setting below project selection
    Given I open the TRMNL plugin settings
    Then View Mode appears immediately below Projects
```

## US-006: Render a Vikunja Kanban board

**As a** user managing work on a project board  
**I want** Kanban columns that match my Vikunja project view  
**So that** the TRMNL display reflects the same workflow as Vikunja.

### Acceptance criteria

```gherkin
Feature: Render a Vikunja Kanban board

  Scenario: Load the selected project's Kanban structure
    Given Kanban View is selected
    And exactly one project number is selected
    When the plugin polls Vikunja
    Then it retrieves the project's configured view and buckets when the API exposes them
    And it retrieves the tasks associated with those buckets
    And it preserves the API-defined column order

  Scenario: Render Kanban columns
    Given the selected project has ordered buckets
    When the Kanban layout is rendered
    Then each bucket is shown as a column
    And each column header includes the number of visible tasks in parentheses
    And each task appears in the column matching its bucket
    And an empty bucket remains visible as an empty column

  Scenario: Separate Kanban headers and tasks
    Given a Kanban column contains visible tasks
    When the column is rendered
    Then there is visible spacing between the column header and its first task
    And there is visible spacing between each pair of tasks
    And the spacing remains readable on e-paper

  Scenario: Render compact Kanban task rows
    Given a Kanban task has a title
    When the task row is rendered
    Then it has a left Framework item meta bar without a number
    And the task title appears above its metadata
    And a due date appears only when the task has a due date

  Scenario: Align wide Kanban columns at the top
    Given the selected TRMNL frame is Full, Half Horizontal, or Quadrant
    When Kanban View is rendered
    Then columns are arranged side by side horizontally
    And all columns start at the same top position
    And a vertical separator appears between adjacent columns

  Scenario: Stack Kanban columns in Half Vertical
    Given the selected TRMNL frame is Half Vertical
    When Kanban View is rendered
    Then columns are stacked vertically in API order
    And the first status appears at the top
    And each following status appears below the previous one
    And a horizontal separator appears between adjacent columns

  Scenario: Match Vikunja board semantics
    Given a bucket is marked as the done bucket by the API
    When the Kanban layout is rendered
    Then the column is visually identified as completed using Framework 3.3 semantic styling
    And completed tasks remain distinguishable from active tasks

  Scenario: Keep Kanban content readable on e-paper
    Given a column contains more tasks than fit in the frame
    When the Kanban layout is rendered
    Then task titles are clamped or truncated
    And the layout does not overflow its target frame
    And the most important task information remains visible

  Scenario: Handle unavailable Kanban metadata
    Given the API does not expose the selected project's view or bucket metadata
    When Kanban View is rendered
    Then the plugin shows a clear unavailable-board state
    And it does not silently present Task View as Kanban View

  Scenario: Handle an invalid Kanban project selection
    Given Kanban View is selected
    And zero or multiple project numbers are selected
    When the plugin renders
    Then it shows a clear configuration message requiring exactly one project
```

## US-007: Filter favorites and due dates

**As a** user planning near-term work  
**I want** favorite-only and due-date filters  
**So that** urgent or intentionally highlighted tasks are easy to see.

### Acceptance criteria

```gherkin
Feature: Filter favorites and due dates

  Scenario: Show favorites only
    Given Favorites Only is enabled
    When tasks are processed
    Then only tasks with is_favorite equal to true are shown

  Scenario: Show tasks due within a selected period
    Given Due Within is set to a positive number of days
    When tasks are processed
    Then tasks with a valid due date from now through the cutoff are shown
    And tasks without a due date are excluded
    And tasks due after the cutoff are excluded

  Scenario: Show tasks with no due-date restriction
    Given Due Within is set to Anytime
    When tasks are processed
    Then tasks are not excluded based on due date
```

## US-008: Show a bounded, predictable task list

**As a** display user  
**I want** tasks ordered and capped for the available screen  
**So that** the content remains readable and stable across refreshes.

### Acceptance criteria

```gherkin
Feature: Prepare the task list

  Scenario: Sort tasks by recency
    Given multiple tasks pass all filters
    When the result is prepared
    Then the most recently updated task appears first

  Scenario: Limit the number of tasks
    Given Tasks Per View is set to a valid value
    When the result is prepared
    Then no more than that number of tasks is returned

  Scenario: Use the default task limit
    Given Tasks Per View is missing or invalid
    When the result is prepared
    Then the plugin uses a safe default limit
```

## US-009: Read the full layout

**As a** user viewing a full-size TRMNL frame  
**I want** task context including descriptions and metadata  
**So that** I can understand more than just the task title.

### Acceptance criteria

```gherkin
Feature: Full layout

  Scenario: Render tasks in the full view
    Given tasks are available
    When the full layout is rendered
    Then tasks appear in a two-column grid
    And each task shows its title
    And available description, assignee, due date, and progress are shown
    And long content is clamped so it does not break the layout

  Scenario: Render no results in the full view
    Given no tasks pass the filters
    When the full layout is rendered
    Then it shows "No tasks found"
    And it suggests checking filter settings
```

## US-010: Read compact layouts

**As a** user viewing a half or quadrant frame  
**I want** a compact, glanceable task summary  
**So that** the most useful information fits the smaller display area.

### Acceptance criteria

```gherkin
Feature: Compact layouts

  Scenario: Render half-horizontal layout
    Given tasks are available
    When the half-horizontal layout is rendered
    Then tasks use a two-column-capable compact list
    And titles are clamped to one line
    And due dates use relative labels when practical

  Scenario: Render half-vertical layout
    Given tasks are available
    When the half-vertical layout is rendered
    Then tasks are stacked in one column
    And titles are clamped to one line
    And due dates use relative labels when practical

  Scenario: Render quadrant layout
    Given tasks are available
    When the quadrant layout is rendered
    Then no more than the configured compact list fits the frame
    And each task shows a title and compact due-date information when available

  Scenario: Communicate completion and priority
    Given a task is completed or has a meaningful priority
    When a compact layout is rendered
    Then completed titles are visually de-emphasized and struck through
    And priority uses the Framework 3.3 item meta emphasis classes

  Scenario: Render no results in a compact view
    Given no tasks pass the filters
    When a compact layout is rendered
    Then it shows a concise no-task message
```

## US-011: Refresh without exposing credentials

**As a** security-conscious user  
**I want** the plugin to refresh task data without displaying secrets  
**So that** my e-paper output remains safe to share.

### Acceptance criteria

```gherkin
Feature: Refresh and credential safety

  Scenario: Poll on the configured interval
    Given the plugin refresh interval is configured
    When the interval elapses
    Then the plugin requests fresh task data
    And the rendered output reflects the latest successful response

  Scenario: Keep credentials out of rendered content
    Given API and Cloudflare credentials are configured
    When any layout is rendered
    Then those credentials are absent from the rendered output
    And they are not copied into task metadata
```

## Definition of done for future changes

- The relevant story or a new story is updated before behavior changes.
- Every changed behavior has at least one Gherkin scenario.
- The four layout variants remain valid at their target dimensions.
- The implementation preserves the API, Liquid, TRMNL Liquid, and Framework 3.3 boundaries described in `docs/architecture.md`.
- The local preview is run with `trmnlp serve` when a view or layout changes.
