// Scribular Notes — clinician app: saved note templates + session notes. Local only.
"use strict";

const S = {
  screen: "session", data: null, flash: null,
  // session note
  sessionId: null, templateId: null,
  // shared note run (ctx: "session" | "template")
  run: null,
  // new template wizard
  wiz: { step: "example", example: "", name: "", noteType: "narrative", extract: null, prefs: null, job: null },
  // template screen
  styleId: null, editPrefs: null, compare: null, previewJob: null,
};

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtSecs = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.max(0, s).toFixed(0)}s`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, body) {
  const r = await fetch(path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
async function refresh() { S.data = await api("/api/state"); }
async function poll(jobId, onUpdate) {
  for (;;) {
    const j = await api(`/api/jobs/${jobId}`);
    await onUpdate(j);
    if (!["running", "queued"].includes(j.status)) return j;
    await sleep(600);
  }
}

const style = (id) => S.data.styles.find((s) => s.id === id);
const version = (id) => { for (const s of S.data.styles) { const v = s.versions.find((x) => x.id === id); if (v) return v; } return null; };
const latest = (s) => s.versions[s.versions.length - 1];
const saved = () => S.data.styles.filter((s) => s.activeVersionId);
const drafts = () => S.data.styles.filter((s) => !s.activeVersionId && s.versions.some((v) => v.state === "draft"));
const pendingUpdate = (s) => s.versions.find((v) => v.state === "proposed");
const sessionLabel = (fid) => ((S.data.library || []).find((x) => x.id === fid) || {}).label || "Practice session";

function go(screen, extra) { Object.assign(S, extra || {}); S.screen = screen; S.flash = null; render(); window.scrollTo(0, 0); }
function toast(text, kind) { S.flash = { kind: kind || "ok", text }; render(); }
function fail(e) { toast(e.message || String(e), "error"); }

// ------------------------------------------------------------ sidebar
function renderSide() {
  const item = (s, muted) => {
    const upd = pendingUpdate(s);
    const on = S.screen === "template" && S.styleId === s.id;
    return `<button class="tpl ${on ? "on" : ""} ${muted ? "muted" : ""}" data-act="open-template" data-id="${s.id}">
      <span class="tpl-name">${esc(s.name)}</span>${upd ? '<span class="dot" title="Suggested update"></span>' : ""}</button>`;
  };
  const sv = saved(), dr = drafts();
  return `
    <div class="logo-row"><div class="logo">S</div><div><b>Scribular</b><div class="tiny">Session notes</div></div></div>
    <button class="btn primary wide" data-act="nav" data-to="session">✎ Write session note</button>
    <div class="side-h">Saved note templates</div>
    ${sv.length ? sv.map((s) => item(s)).join("") : `<p class="tiny pad">None yet.</p>`}
    <button class="btn ghost-side wide" data-act="nav" data-to="new">+ New template</button>
    ${dr.length ? `<div class="side-h">Not saved yet</div>${dr.map((s) => item(s, true)).join("")}` : ""}
    <div class="side-foot">🔒 Runs privately on this computer</div>`;
}

// ------------------------------------------------------------ note run (shared)
async function startRun(ctx, versionId, libraryId) {
  S.run = { ctx, versionId, job: { status: "queued", elapsed: 0 }, data: null, mode: null };
  render();
  try {
    const { jobId } = await api("/api/simulate", { versionId, libraryId: libraryId || null });
    S.run.job.id = jobId;
    const j = await poll(jobId, async (j) => { if (S.run && S.run.versionId === versionId) { S.run.job = j; render(); } });
    await refresh();
    if (j.status === "completed") { S.run.data = await api(`/api/runs/${j.result.runId}`); S.run.job = null; }
  } catch (e) { S.run.job = { status: "failed", error: e.message }; }
  render();
  const card = document.querySelector(".note-card");
  if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function checksLine(checks) {
  if (!checks || !checks.length) return "";
  const issues = checks.filter((c) => c.status !== "pass");
  if (!issues.length) return `<div class="checks-ok">✓ All ${checks.length} checks passed</div>`;
  return `<details class="checks-box"><summary>${issues.length} thing${issues.length > 1 ? "s" : ""} to review</summary>
    <ul class="checks">${issues.map((c) => `<li class="${c.status}">${esc(c.label)}${c.detail ? `<span class="d">${esc(c.detail)}</span>` : ""}</li>`).join("")}</ul></details>`;
}

const PATH_LABELS = { "sentences.max": "Max sentences per section", "sentences.min": "Min sentences per section", "quotes.max": "Max client quotes", perspective: "Voice", pronouns: "Pronouns", replaceNames: "Replace names" };
function prettyChange(t) {
  return String(t).replace(/\b(sentences\.max|sentences\.min|quotes\.max|perspective|pronouns|replaceNames)\b/g, (m) => PATH_LABELS[m] || m);
}
function patchLine(x) {
  const label = PATH_LABELS[x.path] || x.path.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const val = (v) => (v === undefined || v === null ? "—" : typeof v === "object" ? (v.name || JSON.stringify(v)) : String(v));
  return `<li><b>${esc(label)}:</b> ${esc(val(x.before))} → <b>${esc(val(x.after))}</b></li>`;
}

function noteView(ctx) {
  const R = S.run;
  if (!R || R.ctx !== ctx) return "";
  const j = R.job, r = R.data;
  if (j && (j.status === "queued" || j.status === "running"))
    return `<div class="card note-card"><div class="writing"><span class="spinner"></span>Writing note… ${fmtSecs(j.elapsed || 0)}</div>
      ${j.id ? `<button class="btn small-btn" data-act="cancel-job" data-id="${j.id}">Cancel</button>` : ""}</div>`;
  if (j && j.status === "failed") return `<div class="card note-card"><div class="error">${esc(j.error || "Something went wrong.")}</div></div>`;
  if (j && j.status === "cancelled") return `<div class="card note-card"><p class="tiny">Cancelled.</p></div>`;
  if (!r) return "";
  const v = version(r.versionId);
  const text = r.noteEdit ? r.noteEdit.text : r.output;
  const pp = (S.data.patchProposals || []).find((p) => p.runId === r.id && p.status === "pending");
  let panel = "";
  if (R.mode === "edit") {
    panel = `<textarea id="note-edit" class="note-edit">${esc(text)}</textarea>
      <div class="row"><button class="btn primary" data-act="save-edit">Save note</button><button class="btn" data-act="mode" data-m="">Cancel</button></div>`;
  } else if (R.mode === "retry") {
    panel = `<label>What's wrong with this note?</label><input type="text" id="retry-text" placeholder="e.g. Leave out Next Actions">
      <div class="row"><button class="btn primary" data-act="retry">Rewrite this note</button><button class="btn" data-act="mode" data-m="">Cancel</button></div>`;
  } else if (R.mode === "improve") {
    panel = `<label>What should be different in future notes?</label>
      <textarea id="fb-text" class="short" placeholder="e.g. Keep each section to two sentences."></textarea>
      <details class="more"><summary>Add a section</summary><input type="text" id="fb-sec" placeholder="e.g. Objective Data"></details>
      <div class="row"><button class="btn primary" data-act="send-feedback">Suggest update</button><button class="btn" data-act="mode" data-m="">Cancel</button></div>`;
  } else if (R.feedbackJob) {
    panel = `<div class="writing"><span class="spinner"></span>Thinking about your feedback…</div>`;
  } else if (R.clarify) {
    panel = `<div class="ask"><b>${esc(R.clarify.question)}</b><div class="row">${(R.clarify.options || []).map((o) => `<button class="btn" data-act="clarify" data-value="${esc(o)}">${esc(o)}</button>`).join("")}</div></div>`;
  } else if (pp) {
    panel = `<div class="suggest"><div class="suggest-h">Suggested update to “${esc(style(v.styleId).name)}”</div>
      <ul>${pp.patch.map(patchLine).join("")}</ul>
      <div class="row"><button class="btn primary" data-act="confirm-patch" data-id="${pp.id}" data-base="${pp.baseVersionId}">Preview on a new session</button><button class="btn" data-act="decline-patch" data-id="${pp.id}">Discard</button></div></div>`;
  } else {
    const draft = v && v.state === "draft";
    panel = `<div class="row actions">
      ${draft ? `<button class="btn primary" data-act="activate" data-id="${v.id}">Save and activate</button>` : `<button class="btn primary" data-act="copy">${R.copied ? "Copied ✓" : "Copy note"}</button>`}
      <button class="btn" data-act="mode" data-m="edit">Edit</button>
      <button class="btn" data-act="mode" data-m="retry">Fix this note</button>
      <button class="btn" data-act="mode" data-m="improve">Improve template</button></div>`;
  }
  return `<div class="card note-card">
    <div class="note-head"><div><b>${esc(v ? style(v.styleId).name : "")}</b><span class="tiny"> · ${esc(sessionLabel(r.fixtureId))} · fictional demo session</span></div>
      <span class="tiny">${fmtSecs(r.durationMs / 1000)}</span></div>
    ${R.mode === "edit" ? "" : `<pre class="note">${esc(text)}</pre>`}
    ${R.mode === "edit" ? "" : checksLine(r.checks)}
    ${panel}
    <details class="more"><summary>Transcript</summary><pre class="transcript">${esc(r.transcript)}</pre></details>
  </div>`;
}

// ------------------------------------------------------------ screen: write session note
function renderSession() {
  const sv = saved();
  if (!sv.length) return `<h1>Session note</h1><div class="card empty"><p>Create your first note template to start writing session notes.</p>
    <button class="btn primary" data-act="nav" data-to="new">+ New template</button></div>`;
  if (!S.templateId || !sv.find((s) => s.id === S.templateId)) S.templateId = sv[0].id;
  const lib = S.data.library || [];
  if (!S.sessionId) S.sessionId = lib.length ? lib[0].id : "";
  const busy = S.run && S.run.ctx === "session" && S.run.job && ["queued", "running"].includes(S.run.job.status);
  return `
  <h1>Session note</h1>
  <div class="card">
    <label class="lbl">Session</label>
    <select id="session-pick">${lib.map((x) => `<option value="${x.id}" ${x.id === S.sessionId ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select>
    <p class="tiny">Demo sessions are fictional transcripts.</p>
    <label class="lbl">Template</label>
    <div class="choices">${sv.map((s) => `<button class="choice ${s.id === S.templateId ? "on" : ""}" data-act="pick-template" data-id="${s.id}">${esc(s.name)}</button>`).join("")}</div>
    <button class="btn primary big-btn" data-act="write-note" ${busy ? "disabled" : ""}>Write note</button>
  </div>
  ${noteView("session")}`;
}

// ------------------------------------------------------------ screen: new template
function prefsEditor(p, prefix) {
  return `
    <div class="secs">${p.sections.map((s, i) => `
      <div class="sec-row">
        <input type="text" id="${prefix}-sn-${i}" value="${esc(s.name)}" placeholder="Section heading">
        <label class="inline"><input type="checkbox" id="${prefix}-sr-${i}" ${s.required ? "" : "checked"}> only if discussed</label>
        <input type="hidden" id="${prefix}-sg-${i}" value="${esc(s.guidance || "")}">
        <button class="btn icon" data-act="rm-sec" data-prefix="${prefix}" data-i="${i}" title="Remove">×</button>
      </div>`).join("")}
      <button class="btn link" data-act="add-sec" data-prefix="${prefix}">+ Add section</button></div>
    <div class="settings">
      <label>Sentences per section<span class="row"><input type="number" min="1" max="10" id="${prefix}-smin" value="${p.sentences.min}"> to <input type="number" min="1" max="10" id="${prefix}-smax" value="${p.sentences.max}"></span></label>
      <label>Client quotes (max)<input type="number" min="0" max="6" id="${prefix}-q" value="${p.quotes.max}"></label>
      <label>Voice<select id="${prefix}-persp">
        <option value="third-person reporter" ${p.perspective === "third-person reporter" ? "selected" : ""}>“The client reported…”</option>
        <option value="first-person clinician" ${p.perspective === "first-person clinician" ? "selected" : ""}>“I asked…”</option></select></label>
      <label>Pronouns<select id="${prefix}-pron">
        <option value="they/them" ${p.pronouns === "they/them" ? "selected" : ""}>they/them</option>
        <option value="as stated in transcript" ${p.pronouns !== "they/them" ? "selected" : ""}>as stated in session</option></select></label>
    </div>
    <label class="inline"><input type="checkbox" id="${prefix}-names" ${p.replaceNames ? "checked" : ""}> Replace names with roles (e.g. “their manager”)</label>
    <label class="lbl">Anything else?</label>
    <textarea id="${prefix}-extra" class="short" placeholder="One instruction per line">${esc((p.additionalInstructions || []).join("\n"))}</textarea>`;
}

function readPrefs(prefix, base) {
  const sections = [];
  for (let i = 0; $(`#${prefix}-sn-${i}`); i++) {
    const name = $(`#${prefix}-sn-${i}`).value.trim();
    if (name) sections.push({ name, required: !$(`#${prefix}-sr-${i}`).checked, guidance: $(`#${prefix}-sg-${i}`).value });
  }
  return Object.assign({}, base, {
    sections,
    sentences: { min: +$(`#${prefix}-smin`).value, max: +$(`#${prefix}-smax`).value },
    quotes: { max: +$(`#${prefix}-q`).value },
    perspective: $(`#${prefix}-persp`).value,
    pronouns: $(`#${prefix}-pron`).value,
    replaceNames: $(`#${prefix}-names`).checked,
    additionalInstructions: $(`#${prefix}-extra`).value.split("\n").map((x) => x.trim()).filter(Boolean),
    emphasis: (base && base.emphasis) || [],
  });
}

function renderNew() {
  const W = S.wiz;
  const steps = ["Example", "Settings", "Build"];
  const idx = { example: 0, settings: 1, build: 2 }[W.step];
  const head = `<h1>New template</h1><div class="steps">${steps.map((s, i) => `<span class="${i === idx ? "on" : i < idx ? "done" : ""}">${i + 1}. ${s}</span>`).join("")}</div>`;
  if (W.step === "example") return head + `
    <div class="card">
      <label class="lbl">Paste a note written the way you like</label>
      <textarea id="w-example" class="tall" placeholder="Paste a past note…">${esc(W.example)}</textarea>
      <div class="row between"><div class="row"><input type="file" id="w-file" accept=".txt,.md,text/plain,text/markdown">
        <select id="w-sample" class="auto"><option value="">or use a sample…</option>${S.data.samples.map((x) => `<option value="${x.id}">${esc(x.label)}</option>`).join("")}</select></div></div>
      <div class="two">
        <label class="lbl">Template name<input type="text" id="w-name" value="${esc(W.name)}" placeholder="e.g. Narrative notes"></label>
        <label class="lbl">Session type<select id="w-type">${S.data.noteTypes.map((n) => `<option value="${n.id}" ${n.id === W.noteType ? "selected" : ""}>${esc(n.label)}</option>`).join("")}</select></label>
      </div>
      <div class="row between"><button class="btn primary" data-act="w-extract">Next</button>
        <span class="tiny">Or start from: ${S.data.defaults.map((d) => `<a href="#" data-act="use-default" data-id="${d.id}">${esc(d.label)}</a>`).join(" · ")}</span></div>
    </div>`;
  if (W.step === "settings") return head + `
    <div class="card">
      ${(W.extract && W.extract.uncertain || []).length ? `<div class="notice">Please check: ${W.extract.uncertain.map(esc).join(" ")}</div>` : ""}
      ${prefsEditor(W.prefs, "w")}
      <div class="row between"><button class="btn" data-act="w-back">Back</button><button class="btn primary" data-act="w-build">Build template</button></div>
    </div>`;
  const j = W.job || { log: [], elapsed: 0, status: "queued" };
  const running = ["queued", "running"].includes(j.status);
  const last = j.log.length ? j.log[j.log.length - 1].phase : "Starting…";
  return head + `
    <div class="card center">
      ${running ? `<div class="writing big"><span class="spinner"></span>${esc(last)}</div><p class="tiny">Practicing on a sample session · ${fmtSecs(j.elapsed)}</p>
        <button class="btn" data-act="cancel-job" data-id="${j.id}">Cancel</button>` : ""}
      ${j.status === "failed" ? `<div class="error">${esc(j.error)}</div><button class="btn primary" data-act="w-build">Try again</button>` : ""}
      ${j.status === "cancelled" ? `<p>Cancelled.</p><button class="btn primary" data-act="w-build">Start again</button> <button class="btn" data-act="w-back">Back</button>` : ""}
    </div>`;
}

// ------------------------------------------------------------ screen: template
function renderTemplate() {
  const s = style(S.styleId);
  if (!s) return renderSession();
  const active = s.activeVersionId ? version(s.activeVersionId) : null;
  const base = active || latest(s);
  if (!S.editPrefs || S.editPrefs._vid !== base.id) S.editPrefs = Object.assign(JSON.parse(JSON.stringify(base.preferences)), { _vid: base.id });
  const upd = pendingUpdate(s);
  const lib = S.data.library || [];
  const history = s.versions.filter((v) => ["active", "archived"].includes(v.state)).slice().reverse();
  return `
  <div class="row between title-row"><h1>${esc(s.name)}</h1>${active ? `<span class="badge active">Saved · v${active.version}</span>` : `<span class="badge draft">Not saved yet</span>`}</div>
  ${upd ? updatePanel(upd, active) : ""}
  <div class="card">
    <div class="row between"><h2>Try it</h2><div class="row">
      <select id="tpl-session" class="auto"><option value="">New practice session</option>${lib.map((x) => `<option value="${x.id}">${esc(x.label)}</option>`).join("")}</select>
      <button class="btn" data-act="try-template" data-id="${base.id}">Write sample note</button></div></div>
  </div>
  ${noteView("template")}
  <div class="card">
    <h2>Template settings</h2>
    ${prefsEditor(S.editPrefs, "t")}
    <div class="row"><button class="btn primary" data-act="save-template" data-id="${base.id}">Save and activate</button></div>
  </div>
  ${history.length > 1 ? `<details class="card more"><summary>Version history</summary>
    ${history.map((v) => `<div class="hist"><span>v${v.version} · ${esc(v.createdAt.slice(0, 16).replace("T", " "))}</span>
      ${v.state === "active" ? '<span class="badge active">Current</span>' : `<button class="btn small-btn" data-act="activate" data-id="${v.id}">Restore</button>`}</div>`).join("")}</details>` : ""}`;
}

function updatePanel(upd, active) {
  const pj = S.previewJob;
  let body;
  if (pj && ["queued", "running"].includes(pj.status)) body = `<div class="writing"><span class="spinner"></span>Writing before & after on a new session… ${fmtSecs(pj.elapsed || 0)}</div>`;
  else if (S.compare && S.compare.vid === upd.id) body = `<div class="two">
      <div><div class="tiny">Current</div><pre class="note">${esc(S.compare.before.output)}</pre></div>
      <div><div class="tiny">With update</div><pre class="note">${esc(S.compare.after.output)}</pre></div></div>`;
  else if (upd.validation && upd.validation.runId) body = `<button class="btn" data-act="load-compare" data-id="${upd.id}">Show before & after</button>`;
  else body = "";
  const changes = (upd.changeSummary && upd.changeSummary.changes) || [];
  return `<div class="card suggest">
    <div class="suggest-h">Suggested update</div>
    ${changes.length ? `<ul>${changes.map((c) => `<li>${esc(prettyChange(c))}</li>`).join("")}</ul>` : ""}
    ${body}
    <div class="row"><button class="btn primary" data-act="activate" data-id="${upd.id}" ${pj && ["queued", "running"].includes(pj.status) ? "disabled" : ""}>Save and activate</button>
      <button class="btn" data-act="reject" data-id="${upd.id}">Reject</button></div></div>`;
}

async function loadCompare(vid) {
  const val = version(vid).validation;
  if (!val || !val.runId) return;
  const [before, after] = await Promise.all([api(`/api/runs/${val.compareRunId}`), api(`/api/runs/${val.runId}`)]);
  S.compare = { vid, before, after };
  render();
}

// ------------------------------------------------------------ render
function render() {
  if (!S.data) return;
  $("#side").innerHTML = renderSide();
  const views = { session: renderSession, new: renderNew, template: renderTemplate };
  const flash = S.flash ? `<div class="toast ${S.flash.kind}">${esc(S.flash.text)}</div>` : "";
  const rt = S.data.runtime;
  const offline = rt.available ? "" : `<div class="toast error">AI model not available: ${esc(rt.error || "start Ollama")}</div>`;
  $("#app").innerHTML = offline + flash + views[S.screen]();
  const f = $("#w-file");
  if (f) f.onchange = async () => { const file = f.files[0]; if (file) { captureWizard(); S.wiz.example = await file.text(); render(); } };
}

function captureWizard() {
  const W = S.wiz;
  if ($("#w-example")) W.example = $("#w-example").value;
  if ($("#w-name")) W.name = $("#w-name").value;
  if ($("#w-type")) W.noteType = $("#w-type").value;
  if (W.step === "settings" && $("#w-smin")) W.prefs = readPrefs("w", W.prefs);
}
function captureTemplate() {
  if (S.screen === "template" && $("#t-smin") && S.editPrefs) { const vid = S.editPrefs._vid; S.editPrefs = Object.assign(readPrefs("t", S.editPrefs), { _vid: vid }); }
}

// ------------------------------------------------------------ actions
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "session-pick") S.sessionId = t.value;
  if (t.id === "w-sample" && t.value) {
    captureWizard();
    const sample = S.data.samples.find((x) => x.id === t.value);
    S.wiz.example = sample.text.replace(/^FICTIONAL SAMPLE NOTE[^\n]*\n+/, "");
    if (!S.wiz.name) S.wiz.name = sample.label.split(/[:(]/)[0].trim();
    render();
  }
});

document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  e.preventDefault();
  const act = el.dataset.act, id = el.dataset.id;
  try {
    if (act === "nav") {
      captureWizard(); captureTemplate();
      if (el.dataset.to === "new" && S.screen !== "new") S.wiz = { step: "example", example: "", name: "", noteType: "narrative", extract: null, prefs: null, job: null };
      go(el.dataset.to);
    }
    else if (act === "open-template") { captureTemplate(); S.compare = null; go("template", { styleId: id, editPrefs: null }); const u = pendingUpdate(style(id)); if (u) await loadCompare(u.id); }
    else if (act === "pick-template") { S.templateId = id; render(); }
    else if (act === "write-note") {
      S.sessionId = $("#session-pick").value;
      await startRun("session", style(S.templateId).activeVersionId, S.sessionId);
    }
    else if (act === "try-template") { captureTemplate(); await startRun("template", id, $("#tpl-session").value); }
    else if (act === "cancel-job") await api(`/api/jobs/${id}/cancel`, {});
    else if (act === "mode") { S.run.mode = el.dataset.m || null; render(); }
    else if (act === "copy") {
      const r = S.run.data;
      await navigator.clipboard.writeText(r.noteEdit ? r.noteEdit.text : r.output);
      await api(`/api/runs/${r.id}/feedback`, { accepted: true, scope: "note_only", tags: [] });
      S.run.copied = true; render();
    }
    else if (act === "save-edit") {
      await api(`/api/runs/${S.run.data.id}/feedback`, { accepted: false, scope: "note_only", tags: [], editedNote: $("#note-edit").value });
      S.run.data = await api(`/api/runs/${S.run.data.id}`); S.run.mode = null; toast("Note saved. Your template is unchanged.");
    }
    else if (act === "retry") {
      const correction = $("#retry-text").value.trim();
      if (!correction) return;
      const ctx = S.run.ctx, vid = S.run.versionId, parent = S.run.data.id;
      S.run = { ctx, versionId: vid, job: { status: "queued", elapsed: 0 }, data: null };
      render();
      const { jobId } = await api(`/api/runs/${parent}/retry`, { correction });
      S.run.job.id = jobId;
      const j = await poll(jobId, async (j) => { S.run.job = j; render(); });
      if (j.status === "completed") { S.run.data = await api(`/api/runs/${j.result.runId}`); S.run.job = null; }
      await refresh(); render();
    }
    else if (act === "send-feedback" || act === "clarify") {
      const text = act === "clarify" ? el.dataset.value : $("#fb-text").value.trim();
      const sec = act === "clarify" ? "" : ($("#fb-sec") ? $("#fb-sec").value.trim() : "");
      if (!text && !sec) return;
      const runId = S.run.data.id;
      S.run.mode = null; S.run.clarify = null; S.run.feedbackJob = { status: "queued" }; render();
      let r = await api(`/api/runs/${runId}/feedback`, { accepted: false, scope: "future", tags: [], text, addSection: sec ? { name: sec, required: false } : null });
      if (r.jobId) {
        const j = await poll(r.jobId, async (j) => { S.run.feedbackJob = j; });
        if (j.status !== "completed") { S.run.feedbackJob = null; throw new Error(j.error || "Couldn't process that feedback."); }
        r = j.result;
      }
      S.run.feedbackJob = null;
      await refresh();
      if (r.interpretation && r.interpretation.kind === "clarification") { S.run.clarify = r.interpretation; return render(); }
      if (r.interpretation && r.interpretation.kind === "no_change") return toast(r.interpretation.explanation || "No change needed.", "notice");
      if (r.proposalId) await openPreview(r.proposalId, r.jobId);
      else render();
    }
    else if (act === "confirm-patch") {
      el.disabled = true;
      const r = await api(`/api/patch-proposals/${id}/confirm`, { baseVersionId: el.dataset.base });
      await refresh();
      await openPreview(r.proposalId, r.jobId);
    }
    else if (act === "decline-patch") { await api(`/api/patch-proposals/${id}/decide`, { decision: "declined" }); await refresh(); render(); }
    else if (act === "load-compare") await loadCompare(id);
    else if (act === "activate") {
      const v = version(id);
      await api(`/api/versions/${id}/activate`, {});
      await refresh();
      S.styleId = v.styleId; S.templateId = v.styleId; S.editPrefs = null; S.compare = null;
      if (S.run && S.run.ctx === "template") S.run = null;
      go("template");
      toast(`“${style(v.styleId).name}” saved. Choose it after your next session.`);
    }
    else if (act === "reject") { await api(`/api/versions/${id}/decide`, { decision: "rejected" }); await refresh(); S.compare = null; toast("Update rejected. Your template is unchanged."); }
    else if (act === "save-template") {
      captureTemplate();
      const base = version(id);
      const prefs = Object.assign({}, S.editPrefs); delete prefs._vid;
      let vid = id;
      if (JSON.stringify(prefs) !== JSON.stringify(base.preferences)) vid = (await api("/api/versions", { parentId: id, preferences: prefs, explanation: "Edited settings." })).versionId;
      else if (base.state === "active") return toast("No changes to save.", "notice");
      await api(`/api/versions/${vid}/activate`, {});
      await refresh(); S.editPrefs = null; S.templateId = base.styleId;
      toast(`“${style(base.styleId).name}” saved and active.`);
    }
    else if (act === "add-sec" || act === "rm-sec") {
      const w = el.dataset.prefix === "w";
      if (w) captureWizard(); else captureTemplate();
      const p = w ? S.wiz.prefs : S.editPrefs;
      if (act === "add-sec") p.sections.push({ name: "", required: true, guidance: "" }); else p.sections.splice(+el.dataset.i, 1);
      render();
    }
    else if (act === "w-extract") {
      captureWizard();
      if (!S.wiz.example.trim()) return toast("Paste a note or choose a sample first.", "notice");
      S.wiz.extract = await api("/api/extract", { text: S.wiz.example, name: S.wiz.name || "My note template" });
      S.wiz.prefs = S.wiz.extract.preferences; S.wiz.prefs.name = S.wiz.name || S.wiz.prefs.name;
      S.wiz.step = "settings"; S.flash = null; render();
    }
    else if (act === "w-back") { captureWizard(); S.wiz.step = S.wiz.step === "build" ? "settings" : "example"; render(); }
    else if (act === "w-build") {
      captureWizard();
      const W = S.wiz;
      W.prefs.name = W.name || W.prefs.name;
      W.step = "build"; W.job = { status: "queued", log: [], elapsed: 0 }; render();
      const { jobId } = await api("/api/prepare", { preferences: W.prefs, noteType: W.noteType });
      W.job.id = jobId;
      const j = await poll(jobId, async (j) => { W.job = j; if (S.screen === "new") render(); });
      await refresh();
      if (j.status === "completed") {
        go("template", { styleId: j.result.styleId, editPrefs: null });
        await startRun("template", j.result.versionId, null);
      } else render();
    }
    else if (act === "use-default") {
      captureWizard();
      const r = await api(`/api/defaults/${id}/use`, { noteType: S.wiz.noteType });
      await refresh();
      go("template", { styleId: r.styleId, editPrefs: null });
      await startRun("template", r.versionId, null);
    }
  } catch (err) { fail(err); }
});

async function openPreview(proposalId, jobId) {
  const v = version(proposalId);
  S.compare = null; S.run = null;
  go("template", { styleId: v.styleId, editPrefs: null });
  if (!jobId) return;
  S.previewJob = { status: "queued", elapsed: 0 };
  render();
  const j = await poll(jobId, async (j) => { S.previewJob = j; if (S.screen === "template") render(); });
  S.previewJob = null;
  await refresh();
  if (j.status === "completed") await loadCompare(proposalId); else { if (j.error) toast(j.error, "error"); else render(); }
}

(async function init() {
  try {
    await refresh();
    if (!saved().length) S.screen = "new";
    render();
  } catch (e) { $("#app").innerHTML = `<div class="toast error">Can't reach the app server: ${esc(e.message)}</div>`; }
})();
