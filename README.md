# Scribular Note-Style Coach

**Your note style. Your device. Improvements you control.**

Hackathon project for the Claude Impact Lab, Seattle, October 25, 2026.

## Status — read this first

This repository contains a **working local demo** of the four-screen note-style flow (`app/`) plus the original evidence pack (`docs/`). The demo runs real local inference through Ollama on fictional transcripts. It does **not** include a validated local judge, clinician-reviewed results, measured time savings, or integration into the Scribular desktop apps. See [Verification](#verification) and [Limitations](#limitations) for what has actually been tested.

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

## Run the demo

### Quick start for teammates (macOS/Linux)

1. Install or update **Ollama** from https://ollama.com/download and open it. Gemma 4 needs a recent version; 0.5.x is too old.
2. Run:
   ```bash
   git clone https://github.com/pi0neerpat/scribular-note-style-coach.git
   cd scribular-note-style-coach
   git checkout local-demo-app        # until the PR is merged
   ./start-demo.sh
   ```
   The script checks Python 3.9+ and Ollama, downloads `gemma4:e4b` the first time (~6.6 GB), starts the server, and opens http://127.0.0.1:8765. If something is missing, it prints what to install.
3. Click **Create my note style → Load a fictional sample note → Read my style → Create my template** and continue through the four steps.

Tested on macOS (Apple M5, 16 GB). Plan for about 8 GB of free memory for the model. Windows has not been tested; run `python app\server.py` with Ollama running if you want to try.

### Manual start

Requirements: macOS/Linux with Python 3.9+ (standard library only, nothing to `pip install`) and a current [Ollama](https://ollama.com/download) with the pinned model:

```bash
ollama pull gemma4:e4b                 # ~6.6 GB, needs a recent Ollama (tested: 0.40.11)
python3 app/server.py                  # http://127.0.0.1:8765
```

If your Ollama runs somewhere other than `127.0.0.1:11434` (for example a second Ollama next to the one bundled in Scribular.app), set it explicitly. Only loopback addresses are accepted:

```bash
OLLAMA_URL=http://127.0.0.1:11435 python3 app/server.py
```

Options: `COACH_MODEL` (default `gemma4:e4b`), `COACH_PORT` (default `8765`), `COACH_DATA_DIR` (default `app/data/`, which is git-ignored). Delete the data directory to reset the demo.

### What you can do

0. **Why**: problem statement, value proposition, and solution.
1. **Upload documents**: paste a note or load a `.txt`/`.md` file (or pick one of four fictional samples in `examples/sample-notes/`), pick the note type, and confirm the extracted preferences. Only structure and style are kept. Or start from a built-in default.
2. **Preparing your template**: real phases, attempt count (up to 3: one first try plus at most two targeted revisions), elapsed time, and cancel/retry. Runs on fictional development transcript **A**.
3. **Template Control**: the draft and its practice checks, a preference editor, an advanced prompt editor (the fixed grounding rules can't be removed), version history, approve/activate, and restore.
4. **Main Meeting: Simulation**: fictional transcript **B** (never used for refinement) and a real local note. From there you can accept (and activate), *edit this note only*, or *improve my template*. Choosing *Apply to future notes* creates a **proposed** version, which is previewed against the current version on untouched transcript **C**. You then approve, defer, or reject it. Once feedback on B shapes the template, B is recorded as development evidence.

Supported input: pasted text, `.txt`, `.md`. PDF/Word are not supported.

### Fictional sample content

All of the following was written for this demo. None of it describes a real person or session.

- **Sample notes** for the upload step (`examples/sample-notes/`, also available from the *Load a fictional sample note* dropdown):
  - narrative three-part
  - DAP (Data/Assessment/Plan)
  - SOAP (Subjective/Objective/Assessment/Plan)
  - brief CBT with Homework

  The style reader detects each one's sections, and in each the last plan-like section is optional.
- **Transcripts** (`fixtures/`): three note types, each with a development transcript A, a simulation transcript B, and a fresh transcript C:
  - narrative therapy
  - general/CBT-informed
  - couples therapy

- **Session library**: the team's 10 AI-generated fictional transcripts in `examples/sample-transcripts/`, covering brainspotting, couples sex therapy, EFT, executive coaching, Gottman, IFS, narrative, pain-rehab PT, team facilitation, and a telehealth couple. Choose one from the session picker next to *Try in a simulated session*. Library runs are labeled `library` and are not held-out checks. The library transcripts aren't annotated for agreed next steps, so the omission check asks the clinician to confirm instead of guessing. Known personal names are listed in `fixtures/fixtures.json` for the name check. All 10 ran with real Gemma 4 notes in 4–9 s each.

  B transcripts never include an agreed next step, so they test the omission rule. Gemma 4 sometimes writes a placeholder ("Homework: Omitted", "Plan: No plan was explicitly stated") and the check flags it. This is a useful moment to demonstrate *Improve my template*.

### Repository layout

- `app/server.py` — loopback HTTP server, background jobs (prepare / simulate / proposal preview) with cancellation.
- `app/coach.py` — preference extraction, prompt compiler with fixed grounding block, code checks, targeted revisions, feedback-to-proposal mapping.
- `app/store.py` — local JSON store: styles, versions (content fixed after creation; approval-state history appended), runs with prompt snapshot + runtime + fixture provenance + purpose, content-free event log.
- `app/ollama.py` — loopback-only Ollama client, context-budget check, pinned options.
- `app/static/` — the UI (plain HTML/CSS/JS, no external requests).
- `fixtures/` — nine newly written **fictional** transcripts (A/B/C for three note types).
- `examples/sample-notes/` — four fictional example notes in different styles.
- `tests/`, `scripts/e2e_demo_check.py` — automated checks (below).

Inspect AI and Phoenix are not used in this demo. They remain optional development-evaluation tools.

## Verification

Run on October 25, 2026. Machine: Apple M5, 16 GB RAM, macOS 26.6. Runtime: Ollama 0.40.11 with `gemma4:e4b` (digest `eb2177adf764…`). Settings: temperature 0.2, top_p 0.9, seed 42, num_ctx 8192, num_predict 700, thinking off.

```bash
python3 -m unittest discover -s tests          # 24 tests, OK (no model needed)
COACH_DATA_DIR=/tmp/coach-e2e python3 app/server.py &   # fresh data dir
python3 scripts/e2e_demo_check.py              # ALL E2E CHECKS PASSED (real inference)
```

The end-to-end script drives the HTTP API through this sequence:

- extract preferences
- cancel a preparation (no template is created)
- prepare on A (draft, not active)
- simulate on B with a real local note
- accept and activate explicitly
- make a note-only edit (template unchanged)
- give *future notes* feedback, which proposes a version previewed on untouched C; the active version is unchanged and B is marked as development evidence
- approve, then restore v1 (the historical run keeps its prompt snapshot)
- try to remove the grounding rules in a prompt edit (rejected)
- confirm run counts: real = 0

Observed on this machine (single runs, not benchmarks):

- Preparation took 5–7 s with 2 attempts. The first attempt failed a formatting check and one targeted revision fixed it.
- A simulated note took about 2.5 s.
- A proposal preview (two generations) took about 4.5 s.

On fictional transcript B, Gemma 4 wrote `Next Actions: None` instead of omitting the section. The omission check flags this, and the *Improve my template* flow produces a proposed fix. An earlier trial with `gemma2:2b` showed more failures, including numbered headings and a therapist/client attribution mix-up that no code check catches.

## Limitations

- Checks are deterministic formatting/consistency checks: section structure, the omission rule, length, exact quotes, **who said each quote**, names, pronouns, and preamble. They **cannot** verify clinical accuracy, or attribution of paraphrased (unquoted) statements; that needs clinician review. There is no local LLM judge.
- Observed on the session library: Gemma 4 credited a client's words to the therapist in 2 of 10 notes (telehealth couple, pain-rehab PT). The quote-attribution check catches these. It was added after a manual review found the first case.
- Results come from a small set of fictional transcripts on one machine and one model. They are not validated with clinicians, and they say nothing about time saved.
- Preference extraction is heuristic: it detects headings, sentence counts, quotes, voice, and pronouns. Uncertain readings are shown to the clinician for confirmation.
- "Preparing" changes prompt text and preferences only. No model weights are trained.
- Standalone demo: it is not integrated with the Scribular Electron or Tauri apps, and Tauri (llama.cpp) compatibility is not tested.
- Notes and feedback are stored unencrypted in `app/data/` on this machine. Retention and deletion policies are not defined beyond deleting that folder.

## Deadline and submission

User-supplied deadline, also listed on the event website: **October 25, 2026, 5:30 p.m. America/Los_Angeles** (00:30 UTC October 26).
A public repository alone is not a complete hackathon submission. The event asks for a working tool with a README, a repository, and a demo video.

[Event and judging rubric](https://hack.claudeseattle.org/).

## Evidence handling

This repo contains editorial summaries, not the original customer email/PDF or meeting transcripts. Customer names, contact information, credentials, exact correspondence dates, and session-specific clinical examples are excluded. Synthetic examples are labeled as synthetic. Findings from one customer are not generalized into validated market-wide results.

## License

New repository material is available under the [MIT License](LICENSE). Referenced third-party tools retain their own licenses.
