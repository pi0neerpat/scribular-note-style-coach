# Scribular Note-Style Coach

**Your note style. Your device. Improvements you control.**

Hackathon project for the Claude Impact Lab, Seattle, October 25, 2026.

## Status — read this first

This repository is a **public project foundation and evidence pack**, not a completed coach application. It contains a de-identified current customer journey, product requirements, a lean canvas, a local evaluation plan, a sanitized reference prompt, and a demo/submission checklist. No working coach, validated local judge, benchmark results, or demo video is claimed.

The existing Scribular product and private custom-prompt tool predate this hackathon. This repo does not include their code or represent them as new work.

## The problem

A therapist can describe exactly how their notes should read, but translating those preferences into a reliable local-model prompt currently requires founder assistance, email correspondence, model testing, and manual installation. Future changes repeat that support loop.

## Hackathon scope

Improve **only the note-style workflow**: create, preview, refine, save, inspect, update, and roll back a reusable style. Do not build another scribe, recorder, transcription engine, EHR integration, or clinical decision tool.

## Proposed experience

1. Choose a starter or provide an example note locally.
2. Confirm inferred preferences: sections, length, perspective, quotes, and omission rules.
3. Compile a prompt from tested instruction blocks.
4. Preview a note from a bundled fictional transcript using local Ollama.
5. Give targeted feedback and review the proposed change.
6. Check additional examples; approve and save a version.
7. See the active style and version on **My Note Style**.
8. Later, flag recurring issues or explicitly use an edit as feedback. Preview a proposed update, approve or reject it, and retain rollback.

Continuous improvement means explicit preference learning and tested prompt revisions, **not silent weight training or automatic clinical changes**.

## Read the project

- [Discovery synthesis and decisions](docs/discovery-notes.md).
- [Customer journey today](docs/customer-journey-today.md) — de-identified evidence and its limits.
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

Read the customer journey, scope, and evaluation plan; then implement the smallest vertical slice described in the hackathon checklist. No installation is required to read this evidence pack. **There is no application launch command yet.** Do not present this repository as plug-and-play until setup and the core flow have been implemented and verified.

Planned runtime: a local interface plus Ollama, with no cloud fallback. Inspect AI is the recommended development evaluation harness; Phoenix is optional, not a required end-user dependency.

## Deadline and submission

User-supplied deadline, also listed on the event website: **October 25, 2026, 5:30 p.m. America/Los_Angeles** (00:30 UTC October 26).
A public repository alone is not a complete hackathon submission. The event asks for a working tool with a README, a repository, and a demo video.

[Event and judging rubric](https://hack.claudeseattle.org/).

## Evidence handling

This repo contains editorial summaries, not the original customer email/PDF or meeting transcripts. Customer names, contact information, credentials, exact correspondence dates, and session-specific clinical examples are excluded. Synthetic examples are labeled as synthetic. Findings from one customer are not generalized into validated market-wide results.

## License

New repository material is available under the [MIT License](LICENSE). Referenced third-party tools retain their own licenses.
