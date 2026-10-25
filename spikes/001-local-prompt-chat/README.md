# Spike 001 — conversational local prompt writing

## Question

Can local Ollama + Gemma4 draft and revise a reusable note-style prompt through natural-language feedback, while the human decides whether example notes meet their criteria?

This is a throwaway feasibility CLI, not the production coach or a validated clinical evaluator. No model weights are trained.

## Requirements

- Python 3.9+ (standard library only).
- A running local Ollama server and an installed, supported local Gemma4 model.
- Check your actual model tag with `ollama list`; custom imported models may have different names.
- This spike never downloads models, calls a cloud model, or falls back to one.
- The default endpoint is loopback. Explicit `--host` can route HTTP requests to a user-selected private LAN inference host; transcript, style, prompt, and note content sent to it leaves the client process/VM. This is a no-cloud runtime setting, not a claim that data never leaves the VM. Keep machine-specific endpoints out of shared files.

Example setup for a fresh local Ollama installation:

```sh
ollama pull gemma4:e2b-it-q4_K_M
python3 spikes/001-local-prompt-chat/coach.py --model gemma4:e2b-it-q4_K_M
```

The published tag above is a setup option, not a claim that this exact package was tested. See RESULTS.md for the actual installed model/digest/runtime used in the recorded experiment.

## Interactive session

```text
/draft                  Ask the local coach to write an initial prompt
/apply                  Approve the proposed prompt and generate an example
Shorter, but keep an exact client quote and all explicitly agreed next actions.
                        Natural-language feedback proposes a replacement; nothing applies silently
/apply                  Apply the revision and generate the next example
/test                   Generate from a different fictional transcript
/discuss-test           Explicitly allow the next chat to send B to the coach
/accept                 Record that you accept the last generated note
/prompt                 Inspect the current approved draft
/reject                 Reject a pending prompt proposal
/undo                   Toggle to the immediately preceding prompt as a new version
/quit                   Exit
```

Supply a clinician-created style brief or example instead of the bundled fictional request:

```sh
python3 spikes/001-local-prompt-chat/coach.py \
  --model YOUR_INSTALLED_LOCAL_MODEL_TAG \
  --style /path/to/your-style.md
```

The file is read as UTF-8 and sent only to the configured Ollama endpoint. Its path is not recorded in run metadata. The contents may appear in local run artifacts, so keep `.runs/` private. The default remains the newly created fictional fixture.

Other natural-language messages can ask questions or clarify preferences. A change is always a proposal until `/apply`; an identical prompt is reported as no change and cannot create a version. `/accept` concerns only the latest completed note, not a certification of future clinical correctness. A new generation invalidates the previous acceptance target, including when the new generation fails. The successful acceptance path is control-tested with a synthetic reviewer label; no clinician acceptance has been exercised.

After `/test`, coach chats continue to use A as their source and latest A preview. B is never injected automatically. Enter `/discuss-test` to arm the next chat; only when that request is sent does the CLI persist B as exposed development evidence and warn that B is no longer held out. Use a new untouched C for another generalization check. The synthetic script makes its concrete revisions before `/test`, then explicitly opts in with `discuss_test` before the vague-feedback turn.

The model may ignore instructions, omit content, or rewrite too much. Review the prompt diff and source transcript. The fixed generation instructions are guardrails, not a guarantee of compliance.

## Repeatable synthetic experiment

```sh
python3 spikes/001-local-prompt-chat/coach.py \
  --model YOUR_INSTALLED_LOCAL_MODEL_TAG \
  --context 8192 \
  --script spikes/001-local-prompt-chat/fixtures/smoke-feedback.json
```

This script simulates a reviewer: initial draft -> development A -> one-sentence request -> A -> explicit content correction -> A -> B -> explicit `discuss_test` opt-in -> vague-feedback stress case. Its `/apply` decisions are labeled `scripted_test`, not clinician acceptance. The last chat intentionally exposes B as development evidence.

Use `--host` for a different private LAN endpoint; proxies are disabled in the HTTP client. Prompt, style, transcript, and note content are sent to that user-selected host and may leave the client VM. This is no-cloud routing, not proof that content stays on the VM. `--context`, `--output-tokens`, `--temperature`, and `--timeout` are explicit run settings. The CLI estimates input size conservatively and fails before sending when its estimate exceeds the input budget; it does not drop old chat turns. Since Ollama tokenizer counts are not available to this stdlib-only client, the estimate can reject requests early or miss a server-side context limit. Start a new CLI session with a shorter style/history or larger context if it refuses a request. No hidden retries or provider substitutions occur.

## Artifacts

Ignored `.runs/` folders contain prompt history, model digest, local endpoint, request responses, timings, exact prompt snapshots, generated notes, limited checks, acceptance if provided, code SHA-256, and source fixture SHA-256 values. These can contain sensitive content in real use. Do not commit or upload them. New run metadata has hashes; older runs predate this provenance and are not retroactively assigned hashes.

The bundled fixtures are newly created fictional examples. No private customer files are read by this CLI.

Limited checks report quote count, exact-source quote presence expected by the bundled A style, presence of A's explicit phone-free-dinner action, and whether the bundled pottery example remains in a proposed or active prompt. These fixture-specific expectations are not imposed on a custom style file. Other checks cover supported heading duplication/presence, optional-section behavior, invented quotes, and an example-fact canary in output. They do not establish attribution, completeness, one-sentence compliance, clinical accuracy, or general usefulness. Human review is essential. Acceptance also verifies the recorded prompt snapshot and version against the active version.

## Focused control tests

```sh
python3 -m unittest discover -s spikes/001-local-prompt-chat -p test_coach.py -v
```

These test endpoint restrictions, proposal/apply/restore separation, no-op proposal gating, default A context after B, explicit B opt-in/exposure, the successful acceptance path with a synthetic reviewer label, cancellation and stale-pending cleanup, incomplete output-cap rejection, SHA-256 provenance, fenced JSON parsing, style-file reading, preflight size rejection, failed/cancelled-run acceptance safety, and selected bundled-fixture checks. They do not exercise clinician acceptance or measure model quality.

## Limits

- No real-time streaming UI, document importer, persisted-session resume, or application integration.
- No automatic clinical judge or silent prompt acceptance.
- `/undo` is a one-level toggle between the active prompt and the immediately preceding version; it is not a full backward navigation stack.
- Interactive conversation is user-driven; the synthetic trial uses two revision rounds.
- Context/output settings are explicit; input size uses a conservative character-based estimate rather than the model tokenizer. Long source/chat behavior and server-side context handling are not validated.
- A local/private HTTP endpoint identifies the runtime route; it is not a general network/privacy audit.
- Custom-model responses may wrap JSON in Markdown despite a requested schema; the CLI handles a complete enclosing bare or `json` fence, not arbitrary malformed output.
- Review [RESULTS.md](RESULTS.md) for observed failures as well as successes.
