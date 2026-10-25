# Spike 001 results

**Verdict: PARTIAL.** Local conversational prompt drafting and revision completed on short synthetic examples. The evidence does not show reliable autonomous note quality. Every scripted `/apply` was a synthetic reviewer action; no clinician reviewed or accepted a note. The positive acceptance control test uses a synthetic record and records reviewer `scripted_test`; it is not a clinician-acceptance exercise.

## Runtime and placement

- Inference ran on a separate host's Ollama **0.20.5**. The CLI client ran in a VM. Neither VM nor host hardware specifications were measured, so these results support no hardware-floor or deployment-performance claim.
- The host model was `gemma-4-E2B-it.gguf:latest`, family `gemma4`, Q4_K_M, 4.6B parameters reported; digest `1bcd4e9d158c7cdf00143a107500990cb94f957a1ab0de57de9a2a3b9cf0c5d2`.
- The inference host already had this exact model. No new model was needed or installed on that host. Separately, an unused standalone runtime and partial model data were briefly downloaded into the VM cache, then stopped; inference did not use them.
- The original full run used context 4096, output cap 700, temperature 1.0, top-p 0.95, top-k 64, seed 42. A later hardening CLI run used context 8192 with the same model digest and seed 42; it predates this review's no-op, B-exposure, and expanded-check additions.
- Inputs and transcripts were synthetic. The checks are narrow fixture checks, not a clinical evaluator.

## Raw-run chronology

The ignored `.runs/` records are local raw artifacts and remain untracked/private. The original scripted full run at **13:58:09** predates the later style-file, preflight context-estimate, no-history-slicing, run-safety, and explicit B opt-in changes. Its measures are retained below as historical observations; they do not verify the current implementation. That old code automatically used B on the subsequent vague-feedback coach turn; the current CLI requires `/discuss-test`.

| Original scripted call | Wall time |
| --- | ---: |
| Initial prompt draft | 8.201 s |
| Development A note v1 | 3.236 s |
| First prompt revision | 12.158 s |
| Development A note v2 | 2.102 s |
| Second prompt revision | 12.896 s |
| Development A note v3 | 2.557 s |
| Simulation B note, before later chat | 1.908 s |
| Vague-feedback chat after B | 13.495 s |

The **13:59:40 B follow-up** took 2.473 s. It was a manual continuation, not a CLI run: its state included three externally supplied `scripted_test` prompt versions but only one model response, and the output label was stripped. B's fixture had also changed at 13:59:25: the original full-run version explicitly said no next actions were agreed, and that hint was removed before the follow-up. This follow-up is not independent evidence, an untouched held-out check, or a generalization rate.

A separate **14:03:41 hardening CLI run** completed all eight calls with `--style`, context 8192, output cap 700, temperature 1.0, seed 42, and the same installed host model digest. The final coach call completed in 8.624 s. It included style-file/context-preflight/history-preservation and prior run-safety changes, but predates this review's no-op gating, explicit B opt-in, B-exposure-at-send tracking, and expanded fixture checks. Its final chat therefore used the older automatic-B behavior. It was another scripted pass through the same synthetic scenario, not an independent quality sample. Recorded calls were:

| Current-code scripted call | Wall time |
| --- | ---: |
| Initial prompt draft | 11.281 s |
| Development A note v1 | 3.186 s |
| First prompt revision | 10.558 s |
| Development A note v2 | 2.073 s |
| Second prompt revision | 12.587 s |
| Development A note v3 | 2.526 s |
| Simulation B note, before later chat | 1.878 s |
| Vague-feedback chat after B | 8.624 s |

These are call durations from single short runs, not a benchmark or latency guarantee. All runs used the fixed seed 42 and only a few short synthetic examples. Do not infer pass rates or broad reliability from them.

## Observed prompt and note behavior

Review of the original full run's generated notes and prompt versions found:

- The initial prompt did **not** follow the one-sentence request; the first revision did.
- All three A notes (v1, v2, and v3) contained **zero quoted client phrases**, including v3 after the explicit quote request.
- The explicit “phone-free dinner” action was omitted in A notes v1 and v2. It appeared in v3 after redundant instruction. The action rule had not been lost from the prompt, so this was not a restoration of a lost rule.
- The fictional pottery example remained in the first two prompt versions despite instructions to remove it. It was removed after explicit feedback.
- The vague “make it better” turn came after B. It returned a character-identical copy of prompt v3 and claimed a best-practice change without asking a clarifying question. This remains an observed model failure; the new explicit opt-in guard controls data flow and does not fix model reasoning.
- The original B output was generated against a fixture that explicitly stated no next actions were agreed, so its optional-section omission is not evidence of generalization. The later manual continuation used the edited fixture and included the requested quote while omitting absent actions, but it had externally supplied versions and a stripped label; it is not an independent held-out test.

When a user chats after `/test`, the current CLI marks `simulation_b_exposed_to_coach`, persists that status, and warns that B is development evidence. It is no longer held out; a new untouched C is needed for a later generalization check.

## Limited checks and interpretation

The current CLI reports quote count, whether an exact source quote appeared where the bundled A fixture expects one, whether the bundled A phone-free-dinner action appeared, and whether the bundled example canary remains in a proposed/active prompt. These expectations apply only to bundled fixtures/style. Custom style use sets these fixture-specific results to not applicable; they are not universal requirements or clinical judgments. Structural and quote checks also do not establish completeness, attribution, or fidelity.

New local run metadata and generated note records carry code SHA-256 and source fixture SHA-256 values. All existing raw runs predate those fields; no hashes have been retroactively invented, so those artifacts cannot establish their exact code/fixture versions from metadata alone.

The spike demonstrates configured-host Ollama request/response flow, proposal versus explicit apply, immutable appended prompt versions, and a separate note-acceptance record guarded against stale prompt/output state. The acceptance success path is control-tested only with synthetic data and a `scripted_test` reviewer label. It is not evidence that a clinician accepted a note. `/undo` is a one-level toggle between the current prompt and the immediately preceding version, not a full history navigation stack. This is not a complete clinician workflow, production persistence layer, automatic judge, or quality guarantee. Instructions to preserve factual grounding are guardrails, not proof of compliance.

The runtime defaults to loopback, and explicit `--host` permits a user-selected private LAN Ollama host. Content sent to that host leaves the client VM; the no-cloud restriction is not proof that content stays on the VM. Proxies are disabled, but this is not a general network/privacy audit. Local `.runs/` artifacts can contain style inputs, prompts, transcripts, outputs, and notes and must remain private. Context preflight uses a conservative character estimate rather than the model tokenizer. It fails before sending an oversized estimate and does not silently slice chat history, but may reject early or fail to predict server-side context handling.

## Next verification

Focused control tests are run with:

```sh
python3 -m unittest discover -s spikes/001-local-prompt-chat -p test_coach.py -v
```

For another model-quality check, use an untouched synthetic C after B-informed changes and obtain clinician review before making quality claims. A multi-seed evaluation may be useful later; the current fixed-seed, small synthetic spike does not provide one.
