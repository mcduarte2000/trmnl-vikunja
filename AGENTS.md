# AGENTS.md

## Project

Vikunja is a TRMNL e-paper plugin. It retrieves task data from Vikunja and renders Task View or Kanban View using Liquid and TRMNL Framework 3.3.

## Shared references

Before changing behavior, consult:

- `docs/user-stories.md`: functional requirements and Gherkin acceptance criteria.
- `docs/architecture.md`: data flow, API boundaries, runtime requirements, and technology decisions.
- `docs/ui-specifications.md`: frame-specific visual rules and UI acceptance checklist.
- `src/settings.yml`: public TRMNL plugin settings.
- `src/transform.js`: API retrieval, filtering, sorting, and view-mode data preparation.

## Technology rules

- Use Liquid for all TRMNL view templates.
- Use supported filters from `trmnl-liquid` when they solve a presentation problem.
- Follow TRMNL Framework 3.3 classes and conventions.
- Keep API access, network errors, filtering, sorting, and normalization in `src/transform.js`.
- Keep presentation and layout decisions in the Liquid templates.
- Preserve the shared title bar in `src/shared.liquid`.
- Do not add custom CSS when Framework 3.3 utilities can express the requirement.
- Do not change settings.xml. Only the user is allowed to change this file directly in TRMNL.
- Use the https://github.com/usetrmnl/trmnlp tool to help in development.

## Plugin Structure

- This is the plugin structure, you are not allowed to create more files than these:
```
.
├── .github
│   └── workflows
│       └── trmnl.yml
├── .gitignore
├── .trmnlp.yml
├── bin
│   └── trmnlp
└── src
    ├── full.liquid
    ├── half_horizontal.liquid
    ├── half_vertical.liquid
    ├── quadrant.liquid
    ├── shared.liquid
    └── settings.yml
```

| File | Purpose |
|---|---|
| `.github/workflows/trmnl.yml` | GitHub Actions workflow — lints every PR, deploys to TRMNL on `main` |
| `.gitignore` | Keeps `trmnlp build` output out of version control |
| `.trmnlp.yml` | Local dev-server config — not uploaded to TRMNL |
| `src/full.liquid` | Markup for the full screen |
| `src/half_horizontal.liquid` | Top or bottom half of a stacked mashup |
| `src/half_vertical.liquid` | Left or right half of a side-by-side mashup |
| `src/quadrant.liquid` | One quarter of a 2x2 mashup |
| `src/shared.liquid` | Reusable markup included by the other templates |
| `src/settings.yml` | Plugin configuration — uploaded to TRMNL |

## View modes

- `Task View` is the default and uses the existing task-list layouts.
- `Kanban View` requires exactly one project number.
- Kanban data must preserve the API-defined bucket order.
- Kanban columns must preserve empty buckets and show visible task counts.
- Full, Half Horizontal, and Quadrant use horizontal, top-aligned columns with vertical dividers.
- Half Vertical stacks statuses vertically in API order with horizontal dividers.
- Keep spacing between column headers and tasks, and between task rows.

## Editing rules

- Update the relevant user story before changing behavior.
- Update `docs/ui-specifications.md` before changing visual behavior.
- Keep changes focused and avoid unrelated refactoring.
- Preserve existing public setting keys and APIs unless a requirement explicitly changes them.
- Never commit tokens, API credentials, Cloudflare secrets, or local machine addresses intended only for development.
- Do not place secrets in `src/settings.yml`.
- Local preview credentials belong in the ignored `.trmnlp.yml` file.

## Validation

Run these checks after changes:

```sh
node --check src/transform.js
ruby -e 'require "yaml"; YAML.safe_load_file("src/settings.yml"); puts "settings YAML OK"'
/opt/homebrew/lib/ruby/gems/4.0.0/gems/trmnl_preview-0.11.0/bin/trmnlp lint
git diff --check
```

For layout changes, run the local preview:

```sh
/opt/homebrew/lib/ruby/gems/4.0.0/gems/trmnl_preview-0.11.0/bin/trmnlp serve
```

Check all four routes:

- `/full`
- `/half_horizontal`
- `/half_vertical`
- `/quadrant`

Verify populated, empty, filtered, completed, and error states when relevant.

## Scope discipline

Do not commit changes, create branches, or modify unrelated user work unless explicitly requested. Never use destructive Git commands to discard existing changes.
