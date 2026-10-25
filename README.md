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
- [Ten additional fictional sample transcripts](examples/sample-transcripts/README.md), separate from the A/B/C evaluation fixtures.

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
3. Click **Create my note style → Use a fictional example → Read my style → Create my template** and continue through the four steps.

Tested on macOS (Apple M5, 16 GB). Plan for about 8 GB of free memory for the model. Windows has not been tested; run `python app\server.py` with Ollama running if you want to try.

### Manual start

Requirements: macOS/Linux with Python 3.9+ (standard library only, nothing to `pip install`) and a current [Ollama](https://ollama.com/download) with the pinned model:

```bash
ollama pull gemma4:e4b                 # ~6.6 GB, needs a recent Ollama (tested: 0.40.11)
python3 app/server.py                  # http://127.0.0.1:8765
```

If Ollama runs on another loopback port, set it explicitly. Loopback is the default. An explicitly opted-in private host is also supported; inference content is sent to that configured host, and its hardware is unmeasured:

```bash
OLLAMA_URL=http://127.0.0.1:11435 python3 app/server.py
# Private endpoint only when explicitly opted in:
COACH_ALLOW_PRIVATE_OLLAMA=1 OLLAMA_URL="http://${OLLAMA_PRIVATE_HOST}:${OLLAMA_PORT}" python3 app/server.py
```

The imported host variant `gemma-4-E2B-it.gguf:latest` (Q4_K_M) on Ollama 0.20.5 is a separate, explicitly selected model. It differs from the README default `gemma4:e4b`; results from these variants are not interchangeable. The inference host hardware is unmeasured. Options: `COACH_MODEL` (default `gemma4:e4b`), `COACH_PORT` (default `8765`), `COACH_DATA_DIR` (default `app/data/`, which is git-ignored). Delete the data directory to reset the demo.

### What you can do

0. **Why**: problem statement, value proposition, and solution.
1. **Upload documents**: paste a note or load a `.txt`/`.md` file (or click *Use a fictional example*), pick the note type, and confirm the extracted preferences. Only structure and style are kept. Or start from a built-in default.
2. **Preparing your template**: real phases, attempt count (up to 3: one first try plus at most two targeted revisions), elapsed time, and cancel/retry. Runs on fictional development transcript **A**.
3. **Template Control**: the draft and its practice checks, a preference editor, an advanced prompt editor (the fixed grounding rules can't be removed), version history, approve/activate, and restore.
4. **Main Meeting: Simulation**: fictional transcript **B** (initially separate from refinement) and a real local note. From there you can accept (and activate), *edit this note only*, or *improve my template*. Choosing future-style feedback marks B as development evidence and asks the local model for a bounded patch. Vague feedback gets a focused clarification. Review and confirm the patch before it creates a proposed version; only then is a fresh fixture selected for preview. Activation remains a separate explicit action. *Retry this note* regenerates the same source with an ephemeral correction, marks it as development evidence, and leaves style versions/activation intact.

Supported input: pasted text, `.txt`, `.md`. PDF/Word are not supported.

### Repository layout

- `app/server.py` — loopback HTTP server, background jobs (prepare / simulate / proposal preview / note retry) with cancellation.
- `app/coach.py` — preference extraction, authoritative deterministic compiler with fixed grounding block, code checks, and strict typed feedback patch validation.
- `app/store.py` — local JSON store: styles, versions (content fixed after creation; approval-state history appended), runs with prompt snapshot + runtime + fixture provenance + purpose, content-free event log.
- `app/ollama.py` — local/private-opt-in Ollama client, context-budget check, redirects/proxies disabled, pinned options.
- `app/static/` — the UI (plain HTML/CSS/JS, no external requests).
- `fixtures/` — six newly written **fictional** transcripts (A/B/C for two note types).
- `tests/`, `scripts/e2e_demo_check.py` — automated checks (below).

Inspect AI and Phoenix are not used in this demo. They remain optional development-evaluation tools.

The feedback/retry API contract is documented in [docs/coach-backend.md](docs/coach-backend.md).

## Verification

### Verification commands

```bash
python3 -m unittest discover -s tests          # 38 tests passed in the parent verification run (fake inference for control paths)
node --check app/static/app.js
python3 -m py_compile app/*.py scripts/smoke_conversational.py
git diff --check
COACH_DATA_DIR=/tmp/coach-e2e python3 app/server.py &
python3 scripts/e2e_demo_check.py              # full real-inference E2E
python3 scripts/smoke_conversational.py        # real conversational feedback/retry smoke
```

### Existing E4B run

The earlier teammate verification used a client machine with Apple M5, 16 GB RAM, macOS 26.6, Ollama 0.40.11, and the default `gemma4:e4b` (digest prefix `eb2177adf764…`). Its runtime settings were temperature 0.2, top_p 0.9, seed 42, num_ctx 4096, num_predict 700, thinking off. Keep this result separate from the imported E2B run below.

Earlier E4B single-run timings were preparation 5–7 s (two attempts), simulation about 2.5 s, and preview about 4.5 s; these were not benchmarks. Its B output wrote `Next Actions: None`, which the omission check flagged. An earlier `gemma2:2b` trial had additional formatting and attribution failures; that is a separate model result.

### Imported E2B run

The parent ran both scripts with imported `gemma-4-E2B-it.gguf:latest`, digest `1bcd4e9d158c7cdf00143a107500990cb94f957a1ab0de57de9a2a3b9cf0c5d2`, on Ollama 0.20.5. The client VM reported Apple M2 (Virtual), 8 GB RAM, macOS 26.2. **Inference-host hardware was not measured.** Both the full real E2E and the real conversational smoke passed. The smoke verified vague feedback clarification without a version, a validated pending future-style patch followed by confirmation to a proposed but inactive version, and a retry linked to the same source/version while preserving the original.

The full E2E drove the HTTP API through this sequence:

- extract preferences
- cancel a preparation (no template is created)
- prepare on A (draft, not active)
- simulate on B with a real local note
- accept and activate explicitly
- make a note-only edit (template unchanged)
- request future-style feedback, which creates a separate pending patch; confirm it to create a proposed version and preview against C; the active version is unchanged and B is marked as development evidence
- approve, then restore v1 (the historical run keeps its prompt snapshot)
- try to remove the grounding rules in a prompt edit (rejected)
- confirm run counts: real = 0

Observed during the E2B run (single runs, not benchmarks):

- Preparation took 3.9 s with one attempt.
- Simulation on B took 4.4 s.
- Confirmed preview on C took 10.5 s.

The E2B output on B passed 6 of 8 checks; `optional_omission` and `no_names` failed. These format checks do not establish clinical accuracy or clinician acceptance. There has been no clinician validation or acceptance and no measured time savings.

The ten files in [examples/sample-transcripts](examples/sample-transcripts/README.md) are additional fictional examples, separate from fixtures A/B/C. Their presence does not make them held-out evidence; they are not automatically used by the E2E or conversational smoke.

## Limitations

- Checks are deterministic formatting/consistency checks: section structure, the omission rule, length, exact quotes, names, pronouns, and preamble. They **cannot** verify clinical accuracy or attribution; that needs clinician review. There is no local LLM judge.
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
