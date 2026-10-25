"""Minimal local Ollama client (loopback only, no cloud fallback)."""

import json
import os
import platform
import subprocess
import urllib.request

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL = os.environ.get("COACH_MODEL", "gemma4:e4b")
OPTIONS = {"temperature": 0.2, "top_p": 0.9, "seed": 42, "num_ctx": 4096, "num_predict": 700}


class Cancelled(Exception):
    pass


class GenerationError(Exception):
    pass


def _local_only(url):
    host = url.split("://", 1)[-1].split("/", 1)[0].split(":", 1)[0]
    if host not in ("127.0.0.1", "localhost", "::1", "[::1]"):
        raise GenerationError("OLLAMA_URL must point to this machine (loopback). Got host %r." % host)


def _get(path):
    _local_only(OLLAMA_URL)
    with urllib.request.urlopen(OLLAMA_URL + path, timeout=5) as r:
        return json.loads(r.read())


def _hardware():
    try:
        chip = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True, timeout=2).stdout.strip()
        mem = int(subprocess.run(["sysctl", "-n", "hw.memsize"], capture_output=True, text=True, timeout=2).stdout.strip())
        return "%s, %d GB RAM, %s" % (chip, round(mem / 2 ** 30), platform.platform(terse=True))
    except Exception:
        return platform.platform(terse=True)


def runtime_info():
    """Pinned model/runtime configuration recorded with every run."""
    info = {"model": MODEL, "options": dict(OPTIONS), "hardware": _hardware(), "available": False}
    try:
        info["ollamaVersion"] = _get("/api/version").get("version")
        tags = _get("/api/tags").get("models", [])
        m = next((t for t in tags if t["name"] == MODEL), None)
        if m:
            info.update(available=True, digest=m["digest"], quantization=m["details"].get("quantization_level"),
                        parameterSize=m["details"].get("parameter_size"))
        else:
            info["error"] = "Model %s is not pulled. Run: ollama pull %s" % (MODEL, MODEL)
    except Exception as e:
        info["error"] = "Ollama is not reachable at %s (%s). Start Ollama; there is no cloud fallback." % (OLLAMA_URL, e.__class__.__name__)
    return info


def estimate_tokens(text):
    # Conservative estimate (~3 characters per token) so we fail before Ollama truncates silently.
    return len(text) // 3 + 1


def check_context_budget(system, user):
    need = estimate_tokens(system) + estimate_tokens(user)
    budget = OPTIONS["num_ctx"] - OPTIONS["num_predict"]
    if need > budget:
        raise GenerationError("Input is too long for the pinned context window (~%d tokens needed, %d available). "
                              "Shorten the template or transcript; nothing was truncated." % (need, budget))
    return need


def chat(system, user, cancel_event=None):
    """Stream a chat completion; abort promptly if cancel_event is set."""
    _local_only(OLLAMA_URL)
    check_context_budget(system, user)
    body = json.dumps({"model": MODEL, "stream": True, "think": False, "options": OPTIONS,
                       "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}).encode()
    req = urllib.request.Request(OLLAMA_URL + "/api/chat", data=body, headers={"Content-Type": "application/json"})
    out, stats = [], {}
    try:
        resp = urllib.request.urlopen(req, timeout=300)
    except Exception as e:
        raise GenerationError("Could not reach local Ollama (%s). Start Ollama and retry; there is no cloud fallback." % e)
    with resp:
        for line in resp:
            if cancel_event is not None and cancel_event.is_set():
                raise Cancelled()
            if not line.strip():
                continue
            msg = json.loads(line)
            if msg.get("error"):
                raise GenerationError("Ollama error: %s" % msg["error"])
            out.append(msg.get("message", {}).get("content", ""))
            if msg.get("done"):
                stats = {k: msg.get(k) for k in ("prompt_eval_count", "eval_count", "total_duration", "done_reason")}
    text = "".join(out).strip()
    if not text:
        raise GenerationError("The model returned an empty response.")
    if stats.get("done_reason") == "length":
        raise GenerationError("The note hit the output limit (%d tokens) and was cut off." % OPTIONS["num_predict"])
    return text, stats
