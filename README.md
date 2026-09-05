# Vikunja TRMNL Plugin

A **TRMNL** plugin that renders **Vikunja** tasks and Kanban boards on e‑paper displays. It connects to a Vikunja instance via the public API, fetches projects, buckets, and tasks, and presents them using TRMNL Framework 3.3 Liquid templates.

> **Built with AI assistance** – the core UI layout, documentation, and many implementation details were generated and refined using AI.

<img width="150" alt="Works with TRMNL badge" src="https://trmnl.com/images/brand/badges/light/works-with-trmnl/trmnl-badge-works-with-light.svg" />

### What the plugin does

- Shows a **Task View** (grid or list) with title, description, assignee, due date, and progress.
- Provides a **Kanban View** that displays Vikunja buckets as status columns, with task counts, priority‑based emphasis, and optional due‑date labels.
- Supports four frame sizes (Full, Half Horizontal, Half Vertical, Quadrant) and adapts the layout for e‑paper constraints (top‑aligned content, minimal spacing, no custom CSS).
- Handles empty columns, error states, and respects Vikunja’s bucket order.

### Develop locally

Templates and settings live in the [`src/`](src/) directory and are rendered with the **TRMNL preview** tool:

```sh
gem install trmnl_preview
trmnlp serve
```

### Discoverability

Add the `trmnl` topic to this repository so other TRMNL plugin developers can find it.

## Further Reading

- **Documentation**: see the files in the [`docs/`](docs/) folder for detailed specifications, architecture, and user stories.
	- [Architecture](docs/architecture.md)
	- [UI Specifications](docs/ui-specifications.md)
	- [User Stories](docs/user-stories.md)
- **Changelog**: view the project history and recent changes in the [CHANGELOG.md](CHANGELOG.md).
- **Agent Configuration**: details about the Copilot agent setup are in [AGENTS.md](AGENTS.md).
