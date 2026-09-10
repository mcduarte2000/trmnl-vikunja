/**
 * Vikunja Tasks Plugin — TRMNL Backend (transform.js)
 *
 * Receives the merged TRMNL data on stdin and returns the prepared data
 * that the Liquid templates render.
 *
 * Input shape (from the assembly layer):
 *   {
 *     data: <polled payload>,                       // usually an array of tasks
 *     trmnl: {
 *       plugin_settings: {
 *         polling_url,
 *         polling_headers,
 *         custom_fields_values: {                   // user-configured values
 *           api_token, base_url, cf_access_client_id, cf_access_client_secret,
 *           status_filter, priority_filter, project_ids,
 *           assignee_names, search_query, show_favorites_only, min_progress,
 *           due_within_days, tasks_per_view, view_mode
 *         }
 *       }
 *     }
 *   }
 *
 * Responsibilities:
 *   1. Promote custom-field values to top-level merge variables so the
 *      Liquid templates can read `view_mode`, `status_filter`, `project_ids`,
 *      `tasks_per_view`, and `meta`.
 *   2. Apply the documented filter pipeline (status, favorites, priority,
 *      progress, due-within, project, assignee, search) in order.
 *   3. In Kanban View, resolve exactly one project, fetch its kanban buckets,
 *      filter each bucket's tasks, and shape the result into `data.buckets`
 *      as the templates expect: [{ id, title, tasks, done }].
 */

// ── Small helpers ─────────────────────────────────────────────────

/**
 * Parses a comma-separated string into a trimmed, non-empty array.
 * "3, 7" -> ["3","7"] ; "" -> []
 */
function parseCommaList(str) {
  if (!str || String(str).trim() === "") return [];
  return String(str)
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

/** Vikunja uses "0001-01-01T00:00:00Z" as the "no date set" sentinel. */
function hasValidDate(dateString) {
  return !!dateString && dateString !== "0001-01-01T00:00:00Z";
}

/** Coerces boolean-ish custom field values ("true"/"false", true/false). */
function parseBool(value) {
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

/** Reads the user-configured values from the transform input. */
function getConfig(input) {
  return input?.trmnl?.plugin_settings?.custom_fields_values || {};
}

/**
 * Builds request headers directly from the resolved config values.
 *
 * Note: we must NOT parse the `polling_headers` Liquid template string from
 * the trmnl namespace. That raw string still contains `{{ api_token }}`
 * placeholders, which would yield a literal "Bearer {{ api_token }}" header.
 * Building from resolved config avoids that placeholder bug.
 */
function buildHeaders(config) {
  const headers = {};
  if (config.api_token) {
    headers.Authorization = `Bearer ${config.api_token}`;
  }
  if (config.cf_access_client_id) {
    headers["CF-Access-Client-Id"] = config.cf_access_client_id;
  }
  if (config.cf_access_client_secret) {
    headers["CF-Access-Client-Secret"] = config.cf_access_client_secret;
  }
  return headers;
}

/** Returns the base URL without a trailing slash. */
function cleanBaseUrl(config) {
  return (config.base_url || "").replace(/\/+$/, "");
}

async function fetchJson(url, config) {
  const response = await fetch(url, { headers: buildHeaders(config) });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Authentication failed (401 Unauthorized). " +
          "Verify the API token and, if applicable, the Cloudflare Access credentials."
      );
    }
    throw new Error(`Vikunja API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ── Filter functions (docs: docs/filters.md) ────────────────────

/** Filter 1 — Completion status. */
function filterByStatus(tasks, statusFilter) {
  if (statusFilter === "all") return tasks;
  const isDone = statusFilter === "completed";
  return tasks.filter((task) => task.done === isDone);
}

/** Filter 2 — Favorites only. */
function filterByFavorites(tasks, showFavoritesOnly) {
  if (!parseBool(showFavoritesOnly)) return tasks;
  return tasks.filter((task) => task.is_favorite === true);
}

/** Filter 3 — Minimum priority threshold (0 none ... 5 urgent). */
function filterByPriority(tasks, minPriority) {
  const min = parseInt(minPriority, 10) || 0;
  if (min === 0) return tasks; // "Any"
  return tasks.filter((task) => task.priority >= min);
}

/** Filter 4 — Minimum progress percentage (percent_done is 0..1). */
function filterByProgress(tasks, minProgress) {
  const min = parseFloat(minProgress) || 0;
  if (min === 0) return tasks; // 0% = no filter
  return tasks.filter((task) => (task.percent_done || 0) * 100 >= min);
}

/** Filter 5 — Due within N days (excludes the no-date sentinel). */
function filterByDueWithin(tasks, dueWithinDays) {
  const days = parseInt(dueWithinDays, 10) || 0;
  if (days === 0) return tasks; // "Anytime"
  const nowMs = Date.now();
  const cutoffMs = nowMs + days * 24 * 60 * 60 * 1000;
  return tasks.filter((task) => {
    if (!hasValidDate(task.due_date)) return false;
    const dueMs = new Date(task.due_date).getTime();
    return dueMs >= nowMs && dueMs <= cutoffMs;
  });
}

/** Filter 6 — Project IDs (comma-separated, OR logic). */
function filterByProject(tasks, projectIdsStr) {
  const ids = parseCommaList(projectIdsStr);
  if (ids.length === 0) return tasks;
  return tasks.filter((task) => ids.includes(String(task.project_id)));
}

/** Filter 7 — Assignee names (comma-separated, OR, case-insensitive). */
function filterByAssignee(tasks, assigneeNamesStr) {
  const names = parseCommaList(assigneeNamesStr);
  if (names.length === 0) return tasks;
  const lowerNames = names.map((n) => n.toLowerCase());
  return tasks.filter((task) => {
    if (!Array.isArray(task.assignees) || task.assignees.length === 0) {
      return false;
    }
    return task.assignees.some((assignee) => {
      const name = (assignee.name || "").toLowerCase();
      const username = (assignee.username || "").toLowerCase();
      return lowerNames.includes(name) || lowerNames.includes(username);
    });
  });
}

/** Filter 8 — Search keywords (comma-separated, OR, ignores HTML). */
function filterBySearch(tasks, searchQueryStr) {
  const keywords = parseCommaList(searchQueryStr);
  if (keywords.length === 0) return tasks;
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return tasks.filter((task) => {
    const title = (task.title || "").toLowerCase();
    const descPlain = (task.description || "").replace(/<[^>]*>/g, "").toLowerCase();
    return lowerKeywords.some(
      (kw) => title.includes(kw) || descPlain.includes(kw)
    );
  });
}

/**
 * Applies the documented filter pipeline in order. Returns filtered tasks
 * sorted by `updated` descending. The caller decides how to limit.
 */
function applyTaskFilters(tasks, config) {
  let result = Array.isArray(tasks) ? tasks : [];
  result = filterByStatus(result, config.status_filter);
  result = filterByFavorites(result, config.show_favorites_only);
  result = filterByPriority(result, config.priority_filter);
  result = filterByProgress(result, config.min_progress);
  result = filterByDueWithin(result, config.due_within_days);
  result = filterByProject(result, config.project_ids);
  result = filterByAssignee(result, config.assignee_names);
  result = filterBySearch(result, config.search_query);
  return result.sort((a, b) => new Date(b.updated) - new Date(a.updated));
}

// ── Kanban helpers ──────────────────────────────────────────────

function flattenBuckets(buckets) {
  return buckets.flatMap((bucket) => bucket.tasks || []);
}

/**
 * Fetches the project's kanban buckets. Returns { buckets, doneBucketId }.
 * The buckets are shaped as [{ id, title, tasks: [...], project_view_id }].
 */
async function getKanbanBuckets(config) {
  const projectIds = parseCommaList(config.project_ids);
  if (projectIds.length !== 1) {
    throw new Error("Kanban View requires exactly one project number");
  }
  const projectId = projectIds[0];
  const baseUrl = cleanBaseUrl(config);

  const views = await fetchJson(`${baseUrl}/api/v1/projects/${projectId}/views`, config);
  const kanbanView = (Array.isArray(views) ? views : []).find(
    (view) => view.view_kind === "kanban"
  );
  if (!kanbanView) {
    throw new Error("No Kanban view is available for the selected project");
  }

  const url = `${baseUrl}/api/v1/projects/${projectId}/views/${kanbanView.id}/tasks`;
  const buckets = await fetchJson(url, config);
  if (!Array.isArray(buckets)) {
    throw new Error("Kanban data is unavailable for the selected project");
  }

  return { buckets, doneBucketId: kanbanView.done_bucket_id };
}

/**
 * Builds the `data.buckets` array consumed by the templates. Filters each
 * bucket's tasks and distributes `tasks_per_view` across buckets (earlier
 * buckets take priority), matching the bounded task-list contract.
 */
function buildKanbanColumns(buckets, doneBucketId, config) {
  const limit = parseInt(config.tasks_per_view, 10) || 6;
  let remaining = limit;

  return buckets.map((bucket) => {
    const filtered = applyTaskFilters(bucket.tasks || [], config);
    const tasks = filtered.slice(0, Math.max(remaining, 0));
    remaining -= tasks.length;
    return {
      id: bucket.id,
      title: bucket.title,
      done: bucket.id === doneBucketId,
      tasks,
    };
  });
}

function buildMeta(tasks, config) {
  return {
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
  };
}

// ── Entrypoint ──────────────────────────────────────────────────

async function transform(input) {
  const config = getConfig(input);

  // Promote configured values to top-level merge variables so the Liquid
  // templates (which reference `view_mode`, `status_filter`, `project_ids`,
  // `tasks_per_view`, `meta`) can read them.
  const promoted = {};
  for (const [key, value] of Object.entries(config)) {
    promoted[key] = value;
  }

  if (config.view_mode === "kanban") {
    try {
      const { buckets, doneBucketId } = await getKanbanBuckets(config);
      const kanbanColumns = buildKanbanColumns(buckets, doneBucketId, config);
      const tasks = flattenBuckets(kanbanColumns);

      return {
        ...input,
        ...promoted,
        data: { buckets: kanbanColumns },
        view_mode: "kanban",
        kanban_error: "",
        meta: buildMeta(tasks, config),
      };
    } catch (error) {
      return {
        ...input,
        ...promoted,
        data: { buckets: [] },
        view_mode: "kanban",
        kanban_error: error.message,
        meta: buildMeta([], config),
      };
    }
  }

  const tasks = applyTaskFilters(input.data, config);
  const limit = parseInt(config.tasks_per_view, 10) || 6;

  return {
    ...input,
    ...promoted,
    data: tasks.slice(0, limit),
    view_mode: "task",
    kanban_error: "",
    meta: buildMeta(tasks.slice(0, limit), config),
  };
}