/**
 * Vikunja Tasks Plugin — TRMNL Backend
 * Fetches tasks from Vikunja API and applies user-defined filters
 * before returning data to the Liquid template renderer.
 */

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Parses a comma-separated string into a trimmed array.
 * "2,5,7" → ["2","5","7"]
 * "" → [] (empty, meaning "no filter")
 */
function parseCommaList(str) {
  if (!str || str.trim() === "") return [];
  return str
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

/**
 * Vikunja uses "0001-01-01T00:00:00Z" as a sentinel for "no date set".
 * Returns true if the date is actually set (not the sentinel).
 */
function hasValidDate(dateString) {
  return dateString && dateString !== "0001-01-01T00:00:00Z";
}

/**
 * Returns the number of milliseconds for N days from now.
 * Used for the "due within X days" filter.
 */
function daysFromNowMs(days) {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

// ── Filter Functions ─────────────────────────────────────────────

/**
 * Filter 1: Status (active = undone, completed = done, all = no filter)
 */
function filterByStatus(tasks, statusFilter) {
  if (statusFilter === "all") return tasks;
  const isDone = statusFilter === "completed";
  return tasks.filter((task) => task.done === isDone);
}

/**
 * Filter 2: Minimum priority threshold
 * Vikunja priorities: 0=none, 1=low, 2=medium, 3=high, 4=highest, 5=urgent
 */
function filterByPriority(tasks, minPriority) {
  const min = parseInt(minPriority, 10) || 0;
  if (min === 0) return tasks; // "Any" = no filter
  return tasks.filter((task) => task.priority >= min);
}

/**
 * Filter 3: Project IDs (comma-separated, OR logic)
 * If empty, shows tasks from all projects.
 */
function filterByProject(tasks, projectIdsStr) {
  const ids = parseCommaList(projectIdsStr);
  if (ids.length === 0) return tasks;
  return tasks.filter((task) => ids.includes(String(task.project_id)));
}

/**
 * Filter 4: Assignee names (comma-separated, OR logic)
 * A task matches if ANY of the provided names match ANY of its assignees.
 * Matching is case-insensitive.
 */
function filterByAssignee(tasks, assigneeNamesStr) {
  const names = parseCommaList(assigneeNamesStr);
  if (names.length === 0) return tasks;

  return tasks.filter((task) => {
    if (!task.assignees || task.assignees.length === 0) return false;
    return task.assignees.some((assignee) =>
      names.some(
        (name) =>
          assignee.name.toLowerCase() === name.toLowerCase() ||
          assignee.username.toLowerCase() === name.toLowerCase()
      )
    );
  });
}

/**
 * Filter 5: Search keywords (comma-separated, OR logic)
 * A task matches if ANY keyword is found in its title OR description.
 * Strips HTML tags from description before searching (Vikunja stores HTML).
 * Matching is case-insensitive.
 */
function filterBySearch(tasks, searchQueryStr) {
  const keywords = parseCommaList(searchQueryStr);
  if (keywords.length === 0) return tasks;

  return tasks.filter((task) => {
    const title = (task.title || "").toLowerCase();
    // Strip HTML tags from description — Vikunja stores rich text like "<p>...</p>"
    const descRaw = task.description || "";
    const descPlain = descRaw.replace(/<[^>]*>/g, "").toLowerCase();

    return keywords.some((kw) => {
      const cleanKw = kw.toLowerCase();
      return title.includes(cleanKw) || descPlain.includes(cleanKw);
    });
  });
}

/**
 * Filter 6: Favorites only
 * Simple boolean gate — if enabled, only tasks where is_favorite === true.
 */
function filterByFavorites(tasks, showFavoritesOnly) {
  if (!showFavoritesOnly) return tasks;
  return tasks.filter((task) => task.is_favorite === true);
}

/**
 * Filter 7: Minimum progress percentage
 * Vikunja stores percent_done as a decimal (0.3 = 30%).
 * The form field gives us a whole number (0-100), so we compare apples-to-apples.
 */
function filterByProgress(tasks, minProgressNum) {
  const min = parseFloat(minProgressNum) || 0;
  if (min === 0) return tasks; // 0% = no filter
  return tasks.filter((task) => task.percent_done * 100 >= min);
}

/**
 * Filter 8: Due within N days
 * Excludes tasks with no due date (the Vikunja sentinel value).
 * Only shows tasks whose due_date falls between now and now+N days.
 */
function filterByDueWithin(tasks, dueWithinDaysStr) {
  const days = parseInt(dueWithinDaysStr, 10) || 0;
  if (days === 0) return tasks; // "Anytime" = no filter

  const cutoffMs = daysFromNowMs(days);
  const nowMs = Date.now();

  return tasks.filter((task) => {
    // Skip tasks with no due date (Vikunja's sentinel value)
    if (!hasValidDate(task.due_date)) return false;

    const dueMs = new Date(task.due_date).getTime();
    // Include tasks due between now and the cutoff
    return dueMs >= nowMs && dueMs <= cutoffMs;
  });
}

// ── Main: Fetch & Process ────────────────────────────────────────

/**
 * Main plugin entry point.
 * Fetches tasks from Vikunja and applies all user-configured filters.
 *
 * @param {Object} config - All form field values keyed by keyname
 * @returns {Promise<Object>} - { tasks: [...], meta: {...} }
 */
async function fetchAndFilterTasks(config) {
  // Build the API endpoint — base_url already excludes /api/v1
  const apiUrl = `${config.base_url}/api/v1/tasks/all`;

  // Fetch with auth + optional CF headers
  const response = await fetch(apiUrl, buildRequestOptions(config));

  if (!response.ok) {
    throw new Error(`Vikunja API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Vikunja returns an array of task objects directly
  let tasks = Array.isArray(data) ? data : [];

  // ── Apply filters in sequence ────────────────────────────────
  // Order matters: cheapest filters first to reduce work for expensive ones.
  // Status, favorites, and priority are O(n) checks with no string ops.
  // Search and assignee involve string matching — better on smaller sets.

  // 1. Status (done/undone/all) — fastest boolean check
  tasks = filterByStatus(tasks, config.status_filter);

  // 2. Favorites only — another fast boolean
  tasks = filterByFavorites(tasks, config.show_favorites_only);

  // 3. Priority threshold — numeric comparison
  tasks = filterByPriority(tasks, config.priority_filter);

  // 4. Min progress — numeric conversion + comparison
  tasks = filterByProgress(tasks, config.min_progress);

  // 5. Due within N days — date parsing (moderate cost)
  tasks = filterByDueWithin(tasks, config.due_within_days);

  // 6. Project IDs — array membership check
  tasks = filterByProject(tasks, config.project_ids);

  // 7. Assignee names — nested array iteration with string comparison
  tasks = filterByAssignee(tasks, config.assignee_names);

  // 8. Search keywords — string matching with HTML stripping (most expensive)
  tasks = filterBySearch(tasks, config.search_query);

  // ── Sort: most recently updated first ────────────────────────
  // Vikunja API usually returns in this order, but enforce it to be safe
  tasks.sort((a, b) => new Date(b.updated) - new Date(a.updated));

  // ── Limit to tasks_per_view ─────────────────────────────────
  const limit = parseInt(config.tasks_per_view, 10) || 6;
  tasks = tasks.slice(0, limit);

  return {
    tasks,
    meta: {
      total_shown: tasks.length,
      filters_applied: {
        status: config.status_filter,
        priority_min: config.priority_filter,
        project_ids: config.project_ids || "all",
        assignee_names: config.assignee_names || "all",
        search: config.search_query || "none",
        favorites_only: config.show_favorites_only,
        min_progress: config.min_progress,
        due_within_days: config.due_within_days,
      },
    },
  };
}

module.exports = { fetchAndFilterTasks };