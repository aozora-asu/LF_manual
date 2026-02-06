# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds all Python packages.
- `src/wiki_app/` is the end‑user Flask app (routes in `routes/`, domain logic in `services/`, models in `models/`).
- `src/admin_app/` is the admin Flask app with its own `routes/`.
- `src/watcher/` contains schedulers, fetchers, and parsers for monitoring.
- `web/` and `web/admin/` contain Jinja templates and static assets.
- `config/` stores JSON configuration (`app.json`, `admin.json`, `watcher.json`, `alert.json`).
- `data/` stores wiki content; `state/` stores runtime state (both are mostly ignored by Git).
- `alert_ui/` defines alert window layout (`layout.json`).

## Build, Test, and Development Commands
- `python main.py` runs the wiki app, admin app, watcher, and alert polling locally.
- Ports and hostnames are configured in `config/app.json` (default `127.0.0.1:8080`) and `config/admin.json` (default `127.0.0.1:8081`).
- `pyinstaller wiki_suite.spec` produces a bundled desktop build.

## Coding Style & Naming Conventions
- Use 4‑space indentation and keep modules small and focused.
- Naming: snake_case for modules and functions, PascalCase for classes.
- Follow existing patterns: `*_service.py` for service layers, `*_parser.py` for watcher parsers, `*_mgmt.py` for admin tooling.
- Keep templates under `web/templates/` and static assets under `web/static/`.

## Testing Guidelines
- No automated test suite is configured in this repository.
- If you add tests, place them under `tests/` and document the runner command (e.g., `pytest`).
- Manual verification: start the app and check the main UI and admin UI load correctly, and watcher events write to `state/watcher/`.

## Commit & Pull Request Guidelines
- Recent commit messages are short, descriptive Japanese phrases with no prefixes; keep that concise, single‑topic style.
- PRs should include: a brief summary, a note on any config changes, and screenshots for UI/template updates.
- Avoid committing generated runtime data in `data/` and `state/` unless explicitly required; keep `.gitkeep` files intact.
