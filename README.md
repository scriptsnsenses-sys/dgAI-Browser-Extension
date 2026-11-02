# dgAI — AI Browser Agent for Firefox

dgAI is a Firefox WebExtension that turns the browser into an AI-driven workspace.
Ask in natural language; dgAI reads the active page, plans the work, and performs
actions — Gmail triage and replies, meeting/calendar lookups, and closed-loop
multi-step form filling — while keeping the user in control.

## Permission model (non-negotiable)

- **Reading is free.** dgAI may read any page silently: text, DOM, accessibility
  tree, form metadata, links, tables. No prompts, no nagging.
- **Interacting requires permission.** Clicks, typing, selects, toggles, submits,
  uploads and navigation are gated per domain (host), never global by default.
- Grant scopes: `once` (single action), `session` (until browser restart),
  `forever` (persisted). Default and recommended: `once`.
- Passwords are never typed. `input[type="password"]` is hard-blocked in the
  content layer and returns "Passwords are protected".
- Every tool call — allowed, blocked or denied — is appended to an audit log
  visible in Settings.

## Features

- Chat with the active page as context, streaming responses.
- Page summarisation and readable-text extraction.
- Element finding and clicking behind the permission gate.
- Closed-loop form filling from an editable user profile.
- Table extraction to Markdown/CSV in chat.
- Gmail: summarise thread, draft reply, insert draft (interaction-gated).
- Calendar: extract next meeting details and attendees.
- Providers: OpenAI-compatible (custom base URL), Anthropic, Ollama (local),
  and Mock (offline, no key).
- Full permission system with grant management and audit log.
- Light and dark themes (System / Light / Dark).

## Configure a provider

Open the sidebar → settings gear (or `Ctrl/Cmd+K`):

1. **Provider** — choose OpenAI / Anthropic / Ollama / Mock.
2. **API key** — paste your key (stored locally in `browser.storage.local`,
   never logged). Leave empty for Mock or Ollama.
3. **Base URL** — override for OpenAI-compatible endpoints or Ollama
   (`http://localhost:11434`).
4. **Model** — pick or type a model name.
5. **Temperature** — slider.

### Ollama (local, privacy-first)

```bash
ollama serve
ollama pull llama3.1
```

Then set Base URL to `http://localhost:11434` and Model to `llama3.1`. Page
content never leaves the machine when using Ollama or Mock.

## Keyboard shortcuts

- `Alt+Shift+D` — focus the composer.
- `Ctrl/Cmd+K` — open Settings.
- `Enter` — send message; `Shift+Enter` — newline.
- In a permission card: `Enter` = Allow once, `Esc` = Deny.

## Project structure

```
dgai/
├── manifest.json
├── README.md
├── icons/
└── src/
    ├── sidebar/        # UI, styles, components
    ├── background/     # orchestrator, agent loop, tools, permissions, audit
    ├── content/        # DOM snapshot, event simulator, form kit, adapters
    └── shared/         # constants, messages, schema
```

## Security & privacy

- No remote code, no `eval`, no inline scripts or handlers — CSP-clean.
- Zero runtime dependencies, no CDN, no bundler step.
- API keys, page text and audit entries are never written to `console.log`.
- Obvious secrets are redacted from snapshots before they leave the content script.
- Page content is wrapped as untrusted data in the system prompt.

## AMO submission checklist

- Re-verify `browser_specific_settings.gecko.data_collection_permissions`
  against the current AMO schema before submission.
- Confirm permission justifications for `storage`, `tabs`, `activeTab`, `menus`.
- Run a full manual pass: 320/400/600px widths, light + dark, Mock provider.
- Verify no console errors/warnings during a normal run.

## License

The software is Apache 2.0 licensed, before using, modifying or copying the code refer to the license. Please follow the license to help us keep this software open source.
