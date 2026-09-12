# AGENTS.md

## Project

Vikunja is a TRMNL e-paper plugin. It retrieves task data from Vikunja and renders Task View or Kanban View using Liquid and TRMNL Framework 3.3.

## Shared references

Before changing behavior, consult:

- `docs/user-stories.md`: functional requirements and Gherkin acceptance criteria.
- `docs/architecture.md`: data flow, API boundaries, runtime requirements, and technology decisions.
- `docs/ui-specifications.md`: frame-specific visual rules and UI acceptance checklist.
- `docs/view-behavior.md`: per-frame Kanban column direction and typography.
- `docs/testing.md`: regression-test checklist for validating behavior changes.
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
- Do not change settings.xml without asking user explicit permission and proposing exact changes first.
- Use the https://github.com/usetrmnl/trmnlp tool to help in development.

## Reference Liquid Documentation

Use these references to ground future Liquid work and resolve presentation questions without guessing:

- [Official Liquid Docs](https://shopify.github.io/liquid/) — the authoritative reference for **core Liquid tags, filters, and objects** (`assign`, `if`, `for`, `include`, `capture`, `case`, etc.). Consult it first when writing or debugging standard Liquid logic; it defines how the template language behaves before any TRMNL filter is applied.
- [Custom TRMNL plugin filters](https://help.trmnl.com/en/articles/10347358-custom-plugin-filters) — the **TRMNL-specific filters** mixed into the render context (e.g. date/time formatting, string helpers). Use these when a presentation problem is not solvable with core Liquid and a supported custom filter exists; this is the source for what filters exist and what they accept.
- [Liquid for Designers — Standard Filters](https://github.com/shopify/liquid/wiki/liquid-for-designers#standard-filters) — a concise cheat sheet for **parsing and re-formatting liquid-injected data** (e.g. formatting dates, truncation, number formatting). Refer to it when you need to shape transformed data inside the template rather than in `src/transform.js`.
- [TRMNL Framework 3.3](https://trmnl.com/framework/docs/3.3/v3_overview) — the **official TRMNL Framework 3.3 reference** for available classes, layout utilities, and conventions. Consult it to confirm a presentation requirement is expressible with a supported framework class before considering custom CSS (which this project avoids).

Rule of thumb: prefer core Liquid first, then a supported TRMNL custom filter, and keep any `src/transform.js` data reformatting out of the templates.

## Plugin Structure

This is the plugin structure, you are not allowed to create more files than these, unless requested by the user:
```
.
├── .github
│   └── workflows
│       └── trmnl.yml
├── .gitignore
├── .trmnlp.yml
├── bin
│   └── trmnlp
├── docs
│   ├── architecture.md
│   ├── filters.md
│   ├── testing.md
│   ├── ui-specifications.md
│   ├── user-stories.md
│   └── view-behavior.md
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
| `docs/` | Requirements, architecture, and regression-test documentation (see **Shared references** above) |
| `src/full.liquid` | Markup for the full screen |
| `src/half_horizontal.liquid` | Top or bottom half of a stacked mashup |
| `src/half_vertical.liquid` | Left or right half of a side-by-side mashup |
| `src/quadrant.liquid` | One quarter of a 2x2 mashup |
| `src/shared.liquid` | Reusable markup included by the other templates |
| `src/settings.yml` | Plugin configuration — uploaded to TRMNL |

## Creating a New Plugin

You can start building a plugin locally, then `push` it to the TRMNL server for display on your device.

```sh
trmnlp init [my_plugin]  # generate
cd [my_plugin]
trmnlp serve             # develop locally
trmnlp login             # authenticate
trmnlp push              # upload
```

## Modifying an Existing Plugin

If you have built a plugin with the web-based editor, you can `clone` it, work on it locally, and `push` changes back to the server.

```sh
trmnlp login                   # authenticate
trmnlp clone [my_plugin] [id]  # first download
cd [my_plugin]
trmnlp serve                   # develop locally
trmnlp push                    # upload
```

## Commands

| Command | Description |
|---|---|
| `trmnlp init NAME` | Start a new plugin project |
| `trmnlp serve` | Start a local dev server |
| `trmnlp build` | Generate static HTML files, or PNGs with `--png` |
| `trmnlp lint` | Check plugin code against TRMNL best practices |
| `trmnlp login` | Authenticate with TRMNL server |
| `trmnlp list` | List private plugins from TRMNL server |
| `trmnlp clone NAME ID` | Copy a plugin project from TRMNL server |
| `trmnlp pull` | Download latest plugin settings from TRMNL server |
| `trmnlp push` | Upload latest plugin settings to TRMNL server |
| `trmnlp version` | Show version |

`trmnlp lint` exits non-zero when it finds issues, so you can gate CI on it. Run `trmnlp help` for all flags.

## Building Static Files

`trmnlp build` renders every view to a static file under `_build/` — handy for exporting a snapshot or feeding the output into another pipeline. Run it from inside a plugin project:

```sh
trmnlp build        # writes _build/full.html, _build/half_horizontal.html, ...
trmnlp build --png  # also writes a PNG for each view
```

`--png` renders each view through the same screenshot pipeline `serve` uses. By default a PNG is 800×480 at the bit depth declared by the markup's `screen--Nbit` class (1-bit if none). Override any of those:

```sh
trmnlp build --png --color-depth 2
```

| Flag | Purpose |
|---|---|
| `--png` | Render a PNG per view alongside the HTML |
| `--width` | PNG width in pixels (default 800) |
| `--height` | PNG height in pixels (default 480) |
| `--color-depth` | PNG bit depth — 1-8 — overriding the markup |

`--width`, `--height`, and `--color-depth` apply only with `--png`. PNG rendering needs Firefox and ImageMagick installed; plain `trmnlp build` needs neither.

## Authentication

The `trmnlp login` command saves your API key to `~/.config/trmnlp/config.yml`.

If an environment variable is more convenient (for example in a CI/CD pipeline), you can set `$TRMNL_API_KEY` instead.

## Continuous Integration

`trmnlp init` and `trmnlp clone` scaffold a `.github/workflows/trmnl.yml`
workflow and initialize a Git repository, so a fresh project is ready to push
to GitHub. The workflow runs in GitHub Actions without `trmnlp login` — set the
`TRMNL_API_KEY` environment variable and it's used in place of the saved
config. Add it as a repository secret to activate the workflow; it looks like
this:

```yaml
name: TRMNL
on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "4.0"
      - run: gem install trmnl_preview
      - run: trmnlp lint

  push:
    needs: lint
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "4.0"
      - run: gem install trmnl_preview
      - run: trmnlp push --force
        env:
          TRMNL_API_KEY: ${{ secrets.TRMNL_API_KEY }}
```

The `lint` job gates every pull request — `trmnlp lint` exits non-zero on
issues, so a failing check blocks the merge. The `push` job uploads to TRMNL
only on `main`.

> **Make sure `src/settings.yml` has an `id`.** `trmnlp push` updates the
> plugin with that id; without one it creates a *new* plugin on every run.
> Projects made with `trmnlp clone` or `trmnlp pull` already have it.

## Running trmnlp

The `bin/trmnlp` script is provided as a convenience. It will use the local Ruby gem if available, falling back to the `trmnl/trmnlp` Docker image.

You can modify the `bin/trmnlp` script to set up environment variables (plugin secrets, etc.) before running the server.

**Gem or Docker?** Install the gem if you already have Ruby >= 3.4 — it has the fastest startup. Use Docker for zero local setup.

### Installing via RubyGems

Prerequisites:

- Ruby >= 3.4
- For PNG rendering (optional):
  - Firefox
  - ImageMagick

```sh
gem install trmnl_preview
trmnlp serve
```

## View modes

- `Task View` is the default and uses the existing task-list layouts.
- `Kanban View` requires a project number.
- Kanban data must preserve the API-defined bucket order.
- Kanban columns must preserve empty buckets and show visible task counts.
- Full (landscape), and Half Horizontal use horizontal, top-aligned columns with vertical dividers.
- Full (portrait), Half Vertical, and Quadrant stack statuses vertically in API order with horizontal dividers.
- The Full frame detects its orientation at runtime from `trmnl.device.{width,height}` (portrait when `height > width`).
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
