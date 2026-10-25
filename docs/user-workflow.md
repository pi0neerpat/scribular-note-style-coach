# Proposed clinician workflow

This is a product specification, not a claim of implemented behavior.

## First setup

1. **Show your style.** Choose a starter or paste an example note locally. A matching transcript is optional, not required.
2. **Confirm preferences.** Review suggested headings, brevity, reporter perspective, terminology, quote preferences, and when sections should be omitted. The example supplies style, not patient facts.
3. **Preview.** Generate a note with the actual supported local runtime using a bundled fictional session. Show the source transcript next to the result.
4. **Give feedback.** For example: “Shorter overall, but keep the interventions specific.”
5. **Confirm the change.** “Reduce background detail; retain explicitly supported interventions; keep headings and naming unchanged.”
6. **Try another session.** Run a fresh example; show objective checks and any unresolved concerns without declaring clinical accuracy from a model score.
7. **Save.** Save the prompt, confirmed preferences, version, and runtime metadata. Make copying the prompt possible; integration into Scribular settings is a separate implementation decision.

## My Note Style — continued visibility

Show active style name/version, last update, a plain-language preference summary, prompt access, change history, and restore controls. Record the generating style version on each note so later style changes do not rewrite history.

## Continued learning and improvement

1. The clinician flags a recurring issue or explicitly chooses “Use this edit to improve my style.”
2. The coach asks whether the change is a recurring preference or specific to this session.
3. A confirmed recurring preference becomes a proposed patch, not an immediate update.
4. Show what changes, why, and before/after previews.
5. Run local regression examples; preserve evidence-grounding instructions.
6. The clinician approves, rejects, or defers.
7. Record a new version and make rollback available. Existing notes remain untouched.

Do not treat every manual edit as a permanent preference. Do not silently train on patient content. Do not automatically replace a working style after a model or app update.

## Failure behavior

- Ollama unavailable: explain setup; no cloud fallback.
- Ambiguous feedback: ask one focused question.
- Revision fails checks or iteration budget: retain the prior style and expose unresolved issues.
- Source exceeds the tested context budget: stop with an actionable message rather than silently truncating. Long-session handling is not solved by multiple agents.
- Judge unvalidated: label it experimental; do not use it to auto-approve.
