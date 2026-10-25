# Scribular Note-Style Coach

**Your note style. Your device. Improvements you control.**

Hackathon project for the Claude Impact Lab, Seattle, October 25, 2026.

## Status — read this first

This repository is a **public project foundation and evidence pack**, not a completed coach application. It contains a de-identified current customer journey, product requirements, a lean canvas, a local evaluation plan, a sanitized reference prompt, and a demo/submission checklist. A narrow conversational prompt-writing CLI spike using local Ollama is available; it does not establish a complete coach application, validated local judge, benchmark result, or clinical quality. It defaults to loopback, while an explicit `--host` can send content to a user-selected private LAN inference host. No cloud fallback is used, but this does not prove content stays on the client VM. See the [spike instructions and measured results](spikes/001-local-prompt-chat/README.md).

The existing Scribular product and private custom-prompt tool predate this hackathon. This repo does not include their code or represent them as new work.

## The problem

A therapist can describe exactly how their notes should read, but translating those preferences into a reliable local-model prompt currently requires founder assistance, email correspondence, model testing, and manual installation. Future changes repeat that support loop.

## Hackathon scope

Improve **only the note-style workflow**: create, preview, refine, save, inspect, update, and roll back a reusable style. Do not build another scribe, recorder, transcription engine, EHR integration, or clinical decision tool.

## Proposed experience — latest brainstorm

1. Upload/paste a preferred document; confirm note-type selection and preferences (or choose a default).
2. Internally refine a prompt on one selected fictional development transcript A. This is not weight training.
3. Open **Template Control** to inspect the draft, edit, choose defaults, and manage active versions.
4. Open **Main Meeting: Simulation** with a different fictional transcript B and a real Ollama summary.
5. Continue learning through explicit feedback, tested proposed updates, approval, version history, and rollback.

No customer-style shopping/marketplace. Distinguish fictional development/simulation from real sessions. Once feedback from B informs revision, use a fresh C for the next generalization check.

## Read the project

- [Claude development instructions](CLAUDE.md).

- [Discovery synthesis and decisions](docs/discovery-notes.md).
- [Customer journey today](docs/customer-journey-today.md) — de-identified evidence and its limits.
- [UI screens](docs/ui-screens.md), [data capture](docs/data-capture.md), and [current app findings](docs/current-app-findings.md).
- [Proposed user workflow](docs/user-workflow.md) — onboarding and continued updates.
- [Scope and acceptance criteria](docs/product-scope.md).
- [Lean Canvas](docs/lean-canvas.md).
- [Local architecture and existing tools](docs/architecture.md).
- [Evaluation and improvement plan](docs/evaluation-plan.md).
- [Judging rubric and submission checklist](docs/hackathon.md).
- [Team contributions](TEAM.md) — actual roles must be recorded, not invented.
- [Privacy and publication boundaries](docs/privacy.md).
- [De-identified delivered reference prompt](examples/delivered-note-style-reference.md).
- [Proposed clarified starter prompt](examples/narrative-style-starter.txt).
- [Synthetic preferences](examples/style-preferences.json).

## Getting started today

Read the customer journey, scope, and evaluation plan. The CLI spike can be run with Python 3.9+ and an already-installed local Ollama model; setup and invocation are documented in [Spike 001](spikes/001-local-prompt-chat/README.md). **There is no full coach application launch command.** The spike is not production infrastructure and does not meet the product acceptance checklist.

Planned runtime: a local interface plus Ollama, with no cloud fallback. Inspect AI is the recommended development evaluation harness; Phoenix is optional, not a required end-user dependency.

## Deadline and submission

User-supplied deadline, also listed on the event website: **October 25, 2026, 5:30 p.m. America/Los_Angeles** (00:30 UTC October 26).
A public repository alone is not a complete hackathon submission. The event asks for a working tool with a README, a repository, and a demo video.

[Event and judging rubric](https://hack.claudeseattle.org/).

## Evidence handling

This repo contains editorial summaries, not the original customer email/PDF or meeting transcripts. Customer names, contact information, credentials, exact correspondence dates, and session-specific clinical examples are excluded. Synthetic examples are labeled as synthetic. Findings from one customer are not generalized into validated market-wide results.

## License

New repository material is available under the [MIT License](LICENSE). Referenced third-party tools retain their own licenses.
