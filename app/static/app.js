// Note-Style Coach — four-screen local demo UI. No external requests.
"use strict";

const S = {
  screen: "why", data: null,
  example: "", noteType: "narrative", name: "My narrative note style",
  extract: null, prefs: null,
  prepJob: null, prepResult: null, prepInputs: null,
  styleId: null, versionId: null, editPrefs: null, editPrompt: null,
  proposalJob: null, compare: null, patchProposal: null, clarification: null, retryCorrection: "", feedbackJob: null,
  simJob: null, simRun: null, simWarning: null, simMode: null,
  fb: { tags: [], text: "", scope: "note_only", secName: "", secReq: false },
  flash: null,
};

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, body) {
  const r = await fetch(path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
async function refresh() { S.data = await api("/api/state"); }
function go(screen) { S.screen = screen; S.flash = null; render(); window.scrollTo(0, 0); }
function fail(e) { S.flash = { kind: "error", text: e.message || String(e) }; render(); }

const style = (id) => S.data.styles.find((s) => s.id === id);
const version = (id) => { for (const s of S.data.styles) { const v = s.versions.find((v) => v.id === id); if (v) return v; } return null; };
const fmtSecs = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${s.toFixed(0)}s`);
const badge = (state) => `<span class="badge ${state}">${state === "active" ? "Active · approved" : state}</span>`;

function checksHtml(checks, title) {
  if (!checks || !checks.length) return "";
  const passed = checks.filter((c) => c.status === "pass").length;
  return `<h3>${esc(title || "Automated checks")} — ${passed} of ${checks.length} passed</h3>
    <div class="meter"><div style="width:${Math.round((100 * passed) / checks.length)}%"></div></div>
    <ul class="checks">${checks.map((c) => `<li class="${c.status}">${esc(c.label)}${c.detail ? `<span class="d">${esc(c.detail)}</span>` : ""}</li>`).join("")}</ul>
    <p class="small">These are automated formatting and consistency checks only. They do not verify clinical or factual accuracy; that needs your review.</p>`;
}

// ------------------------------------------------------------ preferences editor
function prefsEditor(p, prefix) {
  const secs = p.sections.map((s, i) => `
    <div class="sec-row">
      <input type="text" id="${prefix}-sn-${i}" value="${esc(s.name)}" placeholder="Heading">
      <label><input type="checkbox" id="${prefix}-sr-${i}" ${s.required ? "checked" : ""}> required</label>
      <input type="text" id="${prefix}-sg-${i}" value="${esc(s.guidance || "")}" placeholder="What belongs here (optional)">
      <button class="btn" title="Remove" data-act="rm-sec" data-prefix="${prefix}" data-i="${i}">×</button>
    </div>`).join("");
  return `
    <label>Template name</label><input type="text" id="${prefix}-name" value="${esc(p.name)}">
    <label>Sections, in order. Optional sections are included only when the session explicitly supports them.</label>
    ${secs}
    <button class="btn" data-act="add-sec" data-prefix="${prefix}">+ Add section</button>
    <div class="grid half">
      <div><label>Sentences per section (min – max)</label>
        <div class="row"><input type="number" min="1" max="10" id="${prefix}-smin" value="${p.sentences.min}" style="width:80px"> – <input type="number" min="1" max="10" id="${prefix}-smax" value="${p.sentences.max}" style="width:80px"></div></div>
      <div><label>Maximum direct client quotes (0 = none)</label><input type="number" min="0" max="6" id="${prefix}-q" value="${p.quotes.max}" style="width:80px"></div>
      <div><label>Perspective</label><select id="${prefix}-persp">
        <option value="third-person reporter" ${p.perspective === "third-person reporter" ? "selected" : ""}>Third person, reporter language</option>
        <option value="first-person clinician" ${p.perspective === "first-person clinician" ? "selected" : ""}>Clinician first person</option></select></div>
      <div><label>Client pronouns</label><select id="${prefix}-pron">
        <option value="they/them" ${p.pronouns === "they/them" ? "selected" : ""}>Always they/them</option>
        <option value="as stated in transcript" ${p.pronouns !== "they/them" ? "selected" : ""}>As stated in the session</option></select></div>
    </div>
    <label><input type="checkbox" id="${prefix}-names" ${p.replaceNames ? "checked" : ""}> Replace personal names with relationship descriptors</label>
    <label>Additional instructions in your own words (one per line)</label>
    <textarea id="${prefix}-extra" style="min-height:70px">${esc((p.additionalInstructions || []).join("\n"))}</textarea>
    ${p.emphasis && p.emphasis.length ? `<p class="small">Extra emphasis added during preparation or from your feedback: ${p.emphasis.map(esc).join(", ")}</p>` : ""}`;
}

function readPrefs(prefix, base) {
  const sections = [];
  for (let i = 0; $(`#${prefix}-sn-${i}`); i++) {
    const name = $(`#${prefix}-sn-${i}`).value.trim();
    if (name) sections.push({ name, required: $(`#${prefix}-sr-${i}`).checked, guidance: $(`#${prefix}-sg-${i}`).value.trim() });
  }
  return {
    name: $(`#${prefix}-name`).value.trim() || "My note style",
    sections,
    sentences: { min: +$(`#${prefix}-smin`).value, max: +$(`#${prefix}-smax`).value },
    perspective: $(`#${prefix}-persp`).value,
    pronouns: $(`#${prefix}-pron`).value,
    replaceNames: $(`#${prefix}-names`).checked,
    quotes: { max: +$(`#${prefix}-q`).value },
    additionalInstructions: $(`#${prefix}-extra`).value.split("\n").map((x) => x.trim()).filter(Boolean),
    emphasis: (base && base.emphasis) || [],
  };
}

// ------------------------------------------------------------ screen 0: why
function renderWhy() {
  const rt = S.data.runtime;
  return `
  <section class="hero">
    <div class="eyebrow">Scribular · private AI notes for therapists</div>
    <h1>Less admin, more time talking to patients.</h1>
    <p>Therapists spend too much of their week writing session notes for insurance. Scribular drafts those notes with an AI model that runs on the therapist's own computer, so patient conversations stay private by default.</p>
    <p class="hero-today"><b>Built today:</b> the Note-Style Coach, a tool clinicians use to customize their own clinical notes without a developer.</p>
    <div class="row">
      <button class="btn primary" data-act="goto" data-to="upload">Customize my notes →</button>
      <button class="btn ghost" data-act="goto" data-to="control">Start from a default style</button>
    </div>
    <div class="chips"><span>🔒 AI runs on this computer</span><span>No cloud, no fallback</span><span>Notes written your way</span><span>You approve every change</span></div>
  </section>

  <div class="section-title"><div class="eyebrow">The problem</div><h2>Documentation is taking time away from care.</h2></div>
  <div class="grid three">
    <div class="card problem"><div class="icon">⏱</div><h3>Notes eat the day</h3><p>Every session needs a progress note for insurance and records. That writing happens between clients or after hours, which is time not spent with patients.</p></div>
    <div class="card problem"><div class="icon">☁️</div><h3>Cloud scribes raise a privacy question</h3><p>Most AI scribes send session content to someone else's servers. In therapy, that content is the most sensitive conversation in a client's life.</p></div>
    <div class="card problem"><div class="icon">✍️</div><h3>Generic notes don't fit</h3><p>Every clinician and modality writes differently. A note the therapist has to rewrite saves very little time.</p></div>
  </div>

  <div class="section-title"><div class="eyebrow">Our solution</div><h2>An AI scribe that stays on the therapist's computer.</h2></div>
  <div class="grid half">
    <div class="card tomorrow">
      <h3 style="margin-top:0">Scribular runs the AI locally</h3>
      <p>The language model (here <b>${esc(rt.model)}</b>, through Ollama) runs on the clinician's own machine. Session content isn't sent to a cloud service, and there's no cloud fallback. Private is the default.</p>
    </div>
    <div class="card today">
      <h3 style="margin-top:0">The missing piece: notes in <em>your</em> style</h3>
      <p style="margin:0 0 10px">Until now, customizing a Scribular note took a support loop:</p>
      <div class="loop"><span>Clinician emails preferences</span><i>→</i><span>Founder writes a prompt</span><i>→</i><span>Tests it</span><i>→</i><span>Sends a PDF</span><i>→</i><span>Clinician pastes it in</span></div>
      <p class="evidence">Source: de-identified journey of an existing Scribular customer (docs/customer-journey-today.md).</p>
    </div>
  </div>

  <div class="card vp">
    <div class="eyebrow">What we built at the hackathon</div>
    <q>A tool clinicians use to customize their own clinical notes.</q>
    <p class="small" style="max-width:660px;margin:0 auto">Show it one note you like. It learns the style, practices on a fictional session, and lets you approve, test, and improve it, all on your own computer.</p>
  </div>

  <div class="grid four">
    <div class="card step-card"><div class="num">1</div><h3>Upload a note you like</h3><p>It reads the style: sections, length, voice, and quotes. Patient details in your example are not kept.</p></div>
    <div class="card step-card"><div class="num">2</div><h3>It prepares your template</h3><p>The local AI writes practice notes on a fictional session, checks them, and fixes problems.</p></div>
    <div class="card step-card"><div class="num">3</div><h3>You approve it</h3><p>Edit the template or pick a default. Nothing goes live until you approve it, and every version can be restored.</p></div>
    <div class="card step-card"><div class="num">4</div><h3>Try it on a new session</h3><p>Get a real AI note for a different fictional session. Accept it, fix just that note, or tell it how to write future notes.</p></div>
  </div>

  <div class="section-title"><div class="eyebrow">Built for clinical trust</div><h2>Safeguards you can see</h2></div>
  <div class="grid four trust">
    <div class="card"><div class="icon">🔒</div><h3>Private by default</h3><p>Inference runs locally through Ollama (${esc(rt.ollamaPlacement || "loopback")}). No cloud model and no cloud fallback.</p></div>
    <div class="card"><div class="icon">📎</div><h3>Never makes things up</h3><p>Fixed rules forbid invented quotes, diagnoses, goals, or next steps. Quotes are checked word for word, and so is who said them.</p></div>
    <div class="card"><div class="icon">✅</div><h3>You stay in charge</h3><p>Every template change is proposed, previewed on a fresh session, and then approved or rejected by you.</p></div>
    <div class="card"><div class="icon">🧭</div><h3>Honest about limits</h3><p>Hackathon prototype on fictional sessions. The checks cover format, not clinical accuracy, and time savings haven't been measured yet.</p></div>
  </div>
  <div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="goto" data-to="upload">See it work →</button></div>`;
}

// ------------------------------------------------------------ screen 1: upload
function renderUpload() {
  const d = S.data;
  return `
  <div class="eyebrow">Step 1</div><h1>Upload documents</h1>
  <p class="sub">Show us a note written the way you like it. We learn the <em>style</em> (headings, length, voice), not the patient details.</p>
  <div class="grid">
    <div>
      <div class="card">
        <h2>Your example note</h2>
        <textarea id="example" placeholder="Paste a note you like here…" style="min-height:220px">${esc(S.example)}</textarea>
        <div class="row" style="margin-top:8px">
          <input type="file" id="file" accept=".txt,.md,text/plain,text/markdown">
          <select id="sample-pick" style="width:auto"><option value="">Load a fictional sample note…</option>${d.samples.map((x) => `<option value="${x.id}">${esc(x.label)}</option>`).join("")}</select>
        </div>
        <p class="small">Supported: paste, .txt, .md. PDF and Word are not supported yet. The Ollama endpoint is configurable; private-host routing sends content to that host.</p>
        <div class="grid half">
          <div><label>Note type (picks the fictional practice session)</label>
            <select id="notetype">${d.noteTypes.map((n) => `<option value="${n.id}" ${n.id === S.noteType ? "selected" : ""}>${esc(n.label)}</option>`).join("")}</select></div>
          <div><label>Template name</label><input type="text" id="tname" value="${esc(S.name)}"></div>
        </div>
        <div class="row" style="margin-top:14px"><button class="btn primary" data-act="extract">Read my style</button></div>
      </div>
      ${S.prefs ? `
      <div class="card">
        <h2>Confirm your preferences</h2>
        ${S.extract && S.extract.uncertain.length ? S.extract.uncertain.map((u) => `<div class="notice">Please confirm: ${esc(u)}</div>`).join("") : `<div class="info">We found ${S.extract.detected.sections} sections. Check them below.</div>`}
        <p class="small">Only the structure and style settings below are kept. Details about the person in your example are not saved or reused.</p>
        ${prefsEditor(S.prefs, "up")}
        <div class="row" style="margin-top:16px"><button class="btn primary" data-act="create">Create my template</button></div>
      </div>` : ""}
    </div>
    <div>
      <div class="card">
        <h2>Or use a default style</h2>
        <p class="small">Skip the upload and start from a built-in style. You can change it later in Template Control.</p>
        ${d.defaults.map((x) => `<div class="list-item"><b>${esc(x.label)}</b><div class="small">${esc(x.description)}</div>
          <button class="btn" style="margin-top:6px" data-act="use-default" data-id="${x.id}">Use this default</button></div>`).join("")}
      </div>
      <div class="card small">
        <b>What happens next</b><br>We practice your template on a fictional session and tidy up any formatting issues, using the configured Ollama model. Then you review it. Nothing is activated until you approve it.
      </div>
    </div>
  </div>`;
}

// ------------------------------------------------------------ screen 2: preparing
function renderPrepare() {
  const j = S.prepJob;
  if (!j) return `<h1>Preparing your template</h1><p class="sub">Start from <a href="#" data-act="goto" data-to="upload">Upload documents</a>.</p>`;
  const running = j.status === "running" || j.status === "queued";
  const phases = j.log.map((p, i) => `<li class="${i === j.log.length - 1 && running ? "cur" : ""}"><span class="t">${fmtSecs(p.t)}</span>${i === j.log.length - 1 && running ? '<span class="spinner"></span>' : ""}${esc(p.phase)}</li>`).join("");
  return `
  <div class="eyebrow">Step 2</div><h1>Preparing your template</h1>
  <p class="sub">We refine the written instructions for your style. The AI model itself is not retrained.</p>
  <div class="grid">
    <div class="card"><h2>Progress</h2><ul class="phases">${phases || "<li>Starting…</li>"}</ul>
      ${j.status === "failed" ? `<div class="error">${esc(j.error)}</div><div class="row"><button class="btn primary" data-act="retry-prep">Retry</button><button class="btn" data-act="goto" data-to="upload">Use a default instead</button></div>` : ""}
      ${j.status === "cancelled" ? `<div class="notice">Preparation was cancelled. Your inputs are kept and no template was created.</div><div class="row"><button class="btn primary" data-act="retry-prep">Start again</button><button class="btn" data-act="goto" data-to="upload">Back to upload</button></div>` : ""}
      ${j.status === "completed" ? `<div class="info">A <b>draft</b> template is ready. It is not active until you approve it.</div><button class="btn primary" data-act="review">Review my template</button>` : ""}
    </div>
    <div class="card">
      <div class="small">Practice attempt</div><div class="stat">${j.iteration || 0} <small>of up to ${j.maxIterations || 3}</small></div>
      <div class="small" style="margin-top:16px">Elapsed</div><div class="stat">${fmtSecs(j.elapsed)}</div>
      ${running ? `<button class="btn danger" style="margin-top:14px" data-act="cancel-job" data-id="${j.id}">Cancel</button>` : ""}
      <p class="small" style="margin-top:14px">Practice session: fictional, written for this demo. The session used later for your simulation is a different one.</p>
    </div>
  </div>`;
}

// ------------------------------------------------------------ screen 3: template control
function renderControl() {
  const d = S.data;
  if (!d.styles.length) return `<h1>Template Control</h1><p class="sub">No templates yet. <a href="#" data-act="goto" data-to="upload">Create one</a> or use a default.</p>${defaultsCard()}`;
  if (!S.styleId || !style(S.styleId)) S.styleId = d.styles[d.styles.length - 1].id;
  const s = style(S.styleId);
  if (!S.versionId || !s.versions.find((v) => v.id === S.versionId)) S.versionId = (s.versions.find((v) => v.state === "proposed") || s.versions.find((v) => v.id === s.activeVersionId) || s.versions[s.versions.length - 1]).id;
  const v = version(S.versionId);
  if (!S.editPrefs || S.editPrefs._vid !== v.id) { S.editPrefs = Object.assign(JSON.parse(JSON.stringify(v.preferences)), { _vid: v.id }); S.editPrompt = v.prompt; }
  const active = s.activeVersionId ? version(s.activeVersionId) : null;

  const list = d.styles.map((x) => {
    const a = x.versions.find((y) => y.id === x.activeVersionId);
    const pending = x.versions.some((y) => y.state === "proposed");
    return `<div class="list-item ${x.id === s.id ? "sel" : ""}" data-act="pick-style" data-id="${x.id}"><b>${esc(x.name)}</b><br>
      <span class="small">${x.source === "default" ? "From default" : "From your example"} · ${a ? `active v${a.version}` : "not active yet"}</span> ${pending ? '<span class="badge proposed">update proposed</span>' : ""}</div>`;
  }).join("");

  const history = s.versions.slice().reverse().map((x) => `
    <div class="vers ${x.id === v.id ? "sel" : ""}">
      <a href="#" data-act="pick-version" data-id="${x.id}"><b>v${x.version}</b></a> ${badge(x.state)} <span class="small">${esc(x.createdAt.slice(0, 16).replace("T", " "))}${x.parentId ? ` · from v${version(x.parentId).version}` : ""}</span>
      <div class="small">${esc(x.explanation)}</div>
      ${x.state === "archived" ? `<button class="btn" data-act="activate" data-id="${x.id}">Restore this version</button>` : ""}
    </div>`).join("");

  const isProposal = v.state === "proposed" || v.state === "deferred";
  return `
  <div class="eyebrow">Step 3</div><h1>Template Control</h1>
  <p class="sub">Review, edit, and approve your note styles. Changes create a new version; your active template is never overwritten.</p>
  <div class="grid side">
    <div>
      <div class="card"><h2>My templates</h2>${list}</div>
      ${defaultsCard()}
    </div>
    <div>
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <div><h2 style="margin:0">${esc(s.name)} · v${v.version} ${badge(v.state)}</h2>
            <span class="small">Active version: ${active ? `v${active.version}` : "none yet — approve a version to use it for future notes"}</span></div>
          <div class="row">
            ${v.state === "draft" ? `<button class="btn primary" data-act="activate" data-id="${v.id}">Approve &amp; activate</button>` : ""}
            ${v.state !== "rejected" ? `${sessionPicker()}<button class="btn ${v.state === "active" ? "primary" : ""}" data-act="simulate" data-id="${v.id}">Try in a simulated session</button>` : ""}
          </div>
        </div>
        <p>${esc(v.explanation)}</p>
        ${changesHtml(v)}
        ${isProposal ? proposalPanel(v) : ""}
        ${!isProposal && v.validation && v.validation.checks ? checksHtml(v.validation.checks, v.validation.kind === "development" ? `Practice note on fictional transcript ${v.validation.fixtureId}` : "Latest checks") : ""}
      </div>
      <div class="card">
        <h2>Edit this template</h2>
        <p class="small">Saving creates a new draft version (v${s.versions.length + 1}). It does not change the active template until you approve it.</p>
        ${prefsEditor(S.editPrefs, "tc")}
        <details style="margin-top:12px"><summary>Advanced: view or edit the full prompt</summary>
          <p class="small">The fixed grounding rules (no invented quotes, interventions, diagnoses, goals, or next actions) must stay. Leave the prompt unchanged to rebuild it from the settings above.</p>
          <textarea class="mono" id="tc-prompt" style="min-height:300px">${esc(S.editPrompt)}</textarea>
        </details>
        <label>What changed? (optional)</label><input type="text" id="tc-expl" placeholder="e.g. Shorter Client Discussed section">
        <div class="row" style="margin-top:12px"><button class="btn primary" data-act="save-draft">Save as new draft</button></div>
      </div>
      <div class="card"><h2>Version history</h2>${history}
        <p class="small">Restoring a version does not change notes already written; each note keeps the exact template it was written with.</p></div>
    </div>
  </div>`;
}

function sessionPicker() {
  const lib = S.data.library || [];
  return `<select id="sess-pick" style="width:auto;max-width:330px" title="Which fictional session to simulate">
    <option value="">Next fresh fictional session (recommended)</option>
    <optgroup label="Session library: team samples, not held out">
      ${lib.map((x) => `<option value="${x.id}" ${S.simLib === x.id ? "selected" : ""}>${esc(x.label)}</option>`).join("")}
    </optgroup></select>`;
}
const sessionLabel = (fid) => ((S.data.library || []).find((x) => x.id === fid) || {}).label || fid;

function defaultsCard() {
  return `<div class="card"><h2>Built-in defaults</h2>${S.data.defaults.map((x) => `<div class="list-item"><b>${esc(x.label)}</b><div class="small">${esc(x.description)}</div><button class="btn" style="margin-top:6px" data-act="use-default" data-id="${x.id}">Start from this</button></div>`).join("")}</div>`;
}

function proposalPanel(v) {
  const job = S.proposalJob && S.proposalJob.result === null && S.proposalJob.status !== "failed" && S.proposalJob.status !== "cancelled" ? S.proposalJob : null;
  const val = v.validation || {};
  let body = "";
  if (job) {
    body = `<p><span class="spinner"></span>${esc(job.phase)} · ${fmtSecs(job.elapsed)}</p><button class="btn danger" data-act="cancel-job" data-id="${job.id}">Cancel preview</button>`;
  } else if (S.proposalJob && S.proposalJob.status === "failed") {
    body = `<div class="error">${esc(S.proposalJob.error)}</div>`;
  } else if (val.kind === "fresh_check" && S.compare && S.compare.vid === v.id) {
    const [b, a] = [S.compare.before, S.compare.after];
    body = `<p class="small">Both notes were written from the same <b>fresh fictional transcript (${esc(val.fixtureId)})</b> that has not been used to shape this template.</p>
      <div class="grid half">
        <div><h3>Current (v${version(val.compareVersionId).version})</h3><pre class="note">${esc(b.output)}</pre>${checksHtml(b.checks, "Checks")}</div>
        <div><h3>Proposed (v${v.version})</h3><pre class="note">${esc(a.output)}</pre>${checksHtml(a.checks, "Checks")}</div>
      </div>`;
  } else if (val.kind === "fresh_check") {
    body = `<button class="btn" data-act="load-compare" data-id="${v.id}">Show before/after preview</button>`;
  } else {
    body = `<div class="notice">No preview is available for this proposal.</div>`;
  }
  return `<div class="card" style="background:#fffdf6">
    <h2>Proposed update — your decision</h2>${body}
    <div class="row" style="margin-top:12px">
      <button class="btn primary" data-act="activate" data-id="${v.id}" ${job ? "disabled" : ""}>Approve &amp; activate</button>
      ${v.state === "proposed" ? `<button class="btn" data-act="decide" data-d="deferred" data-id="${v.id}">Decide later</button>` : ""}
      <button class="btn danger" data-act="decide" data-d="rejected" data-id="${v.id}">Reject</button>
    </div></div>`;
}

// ------------------------------------------------------------ screen 4: meeting simulation
function renderMeeting() {
  const r = S.simRun, j = S.simJob;
  const running = j && (j.status === "running" || j.status === "queued");
  if (!r && !j) return `<h1>Main Meeting: Simulation</h1><p class="sub">Choose a template in <a href="#" data-act="goto" data-to="control">Template Control</a> and click “Try in a simulated session”.</p>`;
  const v = version(r ? r.versionId : j.versionId);
  const s = v && style(v.styleId);
  const fb = r && r.feedback;
  if (r) {
    const pending = S.data.patchProposals.find((p) => p.runId === r.id && p.status === "pending") || null;
    if (!S.patchProposal || S.patchProposal.runId !== r.id) S.patchProposal = pending;
    if (S.clarification && S.clarification.runId && S.clarification.runId !== r.id) S.clarification = null;
  }
  return `
  <div class="eyebrow">Step 4</div><h1>Main Meeting</h1>
  <div class="simbar"><span class="live"></span>Simulated session — fictional transcript, generated through configured local/private Ollama. Not a real client, and not counted as a real session.</div>
  ${S.simWarning ? `<div class="notice">${esc(S.simWarning)}</div>` : ""}
  <div class="grid half">
    <div class="card"><h2>Session transcript ${r ? `<span class="badge sim">${esc(sessionLabel(r.fixtureId))}</span>` : ""}</h2>
      ${r ? `<pre class="transcript">${esc(r.transcript)}</pre>` : `<p class="small"><span class="spinner"></span>The session note is being written. The transcript appears with it.</p>`}</div>
    <div class="card">
      <h2>Session note</h2>
      <p class="small">Template: <b>${esc(s ? s.name : "")} v${v ? v.version : ""}</b> ${v ? badge(v.state) : ""} · Model: ${esc(S.data.runtime.model)}</p>
      ${running ? `<p><span class="spinner"></span>${esc(j.phase)} · ${fmtSecs(j.elapsed)}</p><button class="btn danger" data-act="cancel-job" data-id="${j.id}">Cancel</button>` : ""}
      ${j && j.status === "failed" ? `<div class="error">${esc(j.error)}</div><button class="btn" data-act="simulate" data-id="${j.versionId}">Retry</button>` : ""}
      ${j && j.status === "cancelled" ? `<div class="notice">Cancelled. Nothing was saved.</div><button class="btn" data-act="simulate" data-id="${j.versionId}">Try again</button>` : ""}
      ${r ? `
        ${S.simMode === "edit" ? `<textarea id="note-edit" style="min-height:300px">${esc(r.noteEdit ? r.noteEdit.text : r.output)}</textarea>
          <div class="row" style="margin-top:8px"><button class="btn primary" data-act="save-note-edit">Save edit to this note only</button><button class="btn" data-act="sim-mode" data-m="">Cancel</button></div>`
        : `<pre class="note">${esc(r.noteEdit ? r.noteEdit.text : r.output)}</pre>${r.noteEdit ? `<p class="small">Edited by you — this note only. The template was not changed.</p>` : ""}`}
        <p class="small">Generated in ${fmtSecs(r.durationMs / 1000)}.</p>
        ${checksHtml(r.checks)}
        ${fb ? `<div class="info">Feedback recorded: ${fb.accepted ? "accepted" : "not accepted"}${fb.scope === "future" ? " · reviewed for future note style" : ""}.</div>` : ""}
        ${S.feedbackJob ? `<div class="notice"><span class="spinner"></span> ${esc(S.feedbackJob.phase || "Interpreting feedback locally")} · ${fmtSecs(S.feedbackJob.elapsed || 0)} <button class="btn danger" data-act="cancel-job" data-id="${S.feedbackJob.id}">Cancel interpretation</button></div>` : ""}
        ${S.clarification ? `<div class="notice"><b>${esc(S.clarification.question)}</b><div>${(S.clarification.options || []).map((x) => `<button class="btn" data-act="clarify-option" data-value="${esc(x)}">${esc(x)}</button>`).join(" ")}</div></div>` : ""}
        ${S.patchProposal ? `<div class="card"><h3>Review proposed preference change</h3><p>${esc(S.patchProposal.explanation || "")}</p><ul>${S.patchProposal.patch.map((x) => `<li>${esc(x.path)}: ${esc(JSON.stringify(x.before))} → ${esc(JSON.stringify(x.after))}</li>`).join("")}</ul><p class="small">Confirming creates a proposed version for preview. It will not activate automatically.</p><button class="btn primary" data-act="confirm-patch" ${S.confirmingPatch ? "disabled" : ""}>${S.confirmingPatch ? "Confirming…" : "Confirm proposal"}</button> <button class="btn danger" data-act="decline-patch" ${S.confirmingPatch ? "disabled" : ""}>Decline</button></div>` : ""}
        ${S.simMode === "improve" ? improvePanel() : S.simMode === "edit" ? "" : `
        <div class="row" style="margin-top:12px">
          ${r.parentRunId ? `<span class="small">Retry of ${esc(r.parentRunId)} · reused evidence; style unchanged</span><button class="btn primary" data-act="accept">Accept this retry note</button>` : `<button class="btn primary" data-act="accept">${v.state === "draft" ? "Accept &amp; activate this template" : "Accept this note"}</button>`}
          <button class="btn" data-act="sim-mode" data-m="edit">Edit this note only</button>
          <button class="btn" data-act="sim-mode" data-m="improve">Improve my template</button>
        </div>
        <div class="row" style="margin-top:8px">${sessionPicker()}<button class="btn" data-act="simulate" data-id="${v.id}">Run another simulated session</button><button class="btn" data-act="sim-mode" data-m="retry">Retry this note with a correction</button></div>`}
        ${S.simMode === "retry" ? `<p class="notice">Retrying uses this source for refinement, so it will be recorded as development evidence and no longer treated as untouched.</p><label>Correction for this note only</label><textarea id="retry-text" placeholder="e.g. Keep exactly one sentence per section"></textarea><button class="btn primary" data-act="retry-note">Generate corrected note</button> <button class="btn" data-act="sim-mode" data-m="">Cancel</button>` : ""}` : ""}
    </div>
  </div>`;
}

function improvePanel() {
  const tags = S.data.feedbackTags, f = S.fb;
  return `<div class="card" style="background:#fafdfc;margin-top:12px">
    <h2>What should change?</h2>
    <div class="tags">${Object.entries(tags).map(([k, l]) => `<label><input type="checkbox" class="fbtag" value="${k}" ${f.tags.includes(k) ? "checked" : ""}> ${esc(l)}</label>`).join("")}</div>
    <label>Add a section (optional)</label>
    <div class="row"><input type="text" id="fb-sec" style="width:260px" placeholder="e.g. Diagnosis, Objective Data" value="${esc(f.secName)}">
      <label style="margin:0;color:var(--ink)"><input type="checkbox" id="fb-sec-req" ${f.secReq ? "checked" : ""}> always include</label></div>
    <p class="small" style="margin:4px 0 0">New sections include only what the session explicitly states. The model never invents diagnoses, codes, or findings.</p>
    <label>Tell us in your own words (optional; sent to configured Ollama for interpretation)</label>
    <textarea id="fb-text" style="min-height:60px" placeholder="e.g. Always mention the name the client gave the problem.">${esc(f.text)}</textarea>
    <h3>Apply to future notes?</h3>
    <label><input type="radio" name="scope" value="future" ${f.scope === "future" ? "checked" : ""}> Yes, propose a template update. This simulation will be marked as development evidence; I'll review a preview before activation.</label>
    <label><input type="radio" name="scope" value="note_only" ${f.scope === "note_only" ? "checked" : ""}> No, this feedback is about this note only.</label>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="send-feedback">Submit</button><button class="btn" data-act="sim-mode" data-m="">Cancel</button></div>
  </div>`;
}

function readFeedbackForm() {
  S.fb = {
    tags: [...document.querySelectorAll(".fbtag:checked")].map((x) => x.value),
    text: $("#fb-text").value, scope: document.querySelector("input[name=scope]:checked").value,
    secName: $("#fb-sec").value.trim(), secReq: $("#fb-sec-req").checked,
  };
  return S.fb;
}

function changesHtml(v) {
  const cs = v.changeSummary;
  if (!cs) return "";
  const diff = cs.promptDiff || [];
  return `<h3>What changes in v${v.version}</h3>
    ${cs.changes.length ? `<ul style="margin:4px 0 8px">${cs.changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    ${(cs.notes || []).map((n) => `<div class="notice">${esc(n)}</div>`).join("")}
    ${diff.length ? `<details><summary>Exact prompt changes (${diff.length} line${diff.length > 1 ? "s" : ""})</summary>
      <pre class="diff">${diff.map((d) => `<span class="${d.op}">${d.op === "add" ? "+ " : "− "}${esc(d.text)}</span>`).join("\n")}</pre></details>` : ""}`;
}

// ------------------------------------------------------------ render + status
function render() {
  document.querySelectorAll("#steps button").forEach((b) => b.classList.toggle("on", b.dataset.screen === S.screen));
  const views = { why: renderWhy, upload: renderUpload, prepare: renderPrepare, control: renderControl, meeting: renderMeeting };
  $("#app").innerHTML = (S.flash ? `<div class="${S.flash.kind}">${esc(S.flash.text)}</div>` : "") + views[S.screen]();
  const rt = S.data.runtime, c = S.data.counts;
  $("#status").innerHTML = `${rt.available ? "●" : "○"} Local model <b>${esc(rt.model)}</b>${rt.ollamaVersion ? ` · Ollama ${esc(rt.ollamaVersion)}` : ""}${rt.error ? ` · <span style="color:#ffb4b4">${esc(rt.error)}</span>` : ""}
    &nbsp;|&nbsp; Runs: practice ${c.development} · simulated ${c.simulation} · <b>real sessions ${c.real}</b> (fictional runs are never counted as real)
    &nbsp;|&nbsp; No cloud fallback`;
  const f = $("#file");
  if (f) f.onchange = async () => { const file = f.files[0]; if (file) { S.example = await file.text(); render(); } };
}

async function poll(jobId, onUpdate) {
  for (;;) {
    const j = await api(`/api/jobs/${jobId}`);
    await onUpdate(j);
    if (!["running", "queued"].includes(j.status)) return j;
    await new Promise((r) => setTimeout(r, 700));
  }
}

function captureUploadForm() {
  if ($("#example")) S.example = $("#example").value;
  if ($("#notetype")) S.noteType = $("#notetype").value;
  if ($("#tname")) S.name = $("#tname").value;
  if (S.prefs && $("#up-name")) S.prefs = readPrefs("up", S.prefs);
}

async function startPrep(inputs) {
  S.prepInputs = inputs;
  const { jobId } = await api("/api/prepare", inputs);
  S.prepJob = { id: jobId, status: "queued", log: [], elapsed: 0 };
  go("prepare");
  const j = await poll(jobId, async (j) => { S.prepJob = j; if (S.screen === "prepare") render(); });
  await refresh();
  if (j.status === "completed") { S.styleId = j.result.styleId; S.versionId = j.result.versionId; }
  render();
}

async function startSim(versionId, libraryId) {
  if (libraryId !== undefined) S.simLib = libraryId || null;
  const { jobId } = await api("/api/simulate", { versionId, libraryId: S.simLib });
  S.simRun = null; S.simWarning = null; S.simMode = null; S.patchProposal = null; S.clarification = null;
  S.simJob = { id: jobId, status: "queued", log: [], elapsed: 0, versionId };
  go("meeting");
  const j = await poll(jobId, async (j) => { S.simJob = Object.assign(j, { versionId }); if (S.screen === "meeting") render(); });
  await refresh();
  if (j.status === "completed") { S.simRun = await api(`/api/runs/${j.result.runId}`); S.simWarning = j.result.warning; S.simJob = null; }
  render();
}

async function loadCompare(vid) {
  const val = version(vid).validation;
  const [before, after] = await Promise.all([api(`/api/runs/${val.compareRunId}`), api(`/api/runs/${val.runId}`)]);
  S.compare = { vid, before, after };
  render();
}

// ------------------------------------------------------------ actions
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.id === "sample-pick" && t.value) {
    captureUploadForm();
    const sample = S.data.samples.find((x) => x.id === t.value);
    S.example = sample.text; S.extract = null; S.prefs = null;
    S.name = sample.label.split(/[:(]/)[0].trim() + " style";
    return render();
  }
  if (t.classList && t.classList.contains("fbtag") && t.checked && (t.value === "too_long" || t.value === "omitted_content")) {
    const other = document.querySelector(`.fbtag[value=${t.value === "too_long" ? "omitted_content" : "too_long"}]`);
    if (other) other.checked = false;
  }
});

document.addEventListener("click", async (e) => {
  const nav = e.target.closest("#steps button");
  if (nav) { captureUploadForm(); return go(nav.dataset.screen); }
  const el = e.target.closest("[data-act]");
  if (!el) return;
  e.preventDefault();
  const act = el.dataset.act, id = el.dataset.id;
  try {
    if (act === "goto") { captureUploadForm(); go(el.dataset.to); }

    else if (act === "extract") {
      captureUploadForm();
      S.extract = await api("/api/extract", { text: S.example, name: S.name });
      S.prefs = S.extract.preferences; S.flash = null; render();
    }
    else if (act === "add-sec" || act === "rm-sec") {
      const prefix = el.dataset.prefix;
      const key = prefix === "up" ? "prefs" : "editPrefs";
      if (prefix === "up") captureUploadForm(); else { const vid = S.editPrefs._vid; S.editPrefs = Object.assign(readPrefs("tc", S.editPrefs), { _vid: vid }); }
      if (act === "add-sec") S[key].sections.push({ name: "", required: true, guidance: "" });
      else S[key].sections.splice(+el.dataset.i, 1);
      render();
    }
    else if (act === "create") { captureUploadForm(); await startPrep({ preferences: S.prefs, noteType: S.noteType }); }
    else if (act === "retry-prep") await startPrep(S.prepInputs);
    else if (act === "review") { go("control"); }
    else if (act === "use-default") {
      captureUploadForm();
      const r = await api(`/api/defaults/${id}/use`, { noteType: S.noteType });
      await refresh(); S.styleId = r.styleId; S.versionId = r.versionId; go("control");
    }
    else if (act === "cancel-job") { await api(`/api/jobs/${id}/cancel`, {}); }
    else if (act === "pick-style") { S.styleId = id; S.versionId = null; S.compare = null; render(); }
    else if (act === "pick-version") { S.versionId = id; S.compare = null; render(); if (version(id).validation && version(id).validation.kind === "fresh_check") await loadCompare(id); }
    else if (act === "load-compare") await loadCompare(id);
    else if (act === "activate") {
      const r = await api(`/api/versions/${id}/activate`, {});
      await refresh(); S.versionId = id;
      S.flash = { kind: "info", text: r.restored ? `Restored v${version(id).version}. It is now the active template for future notes.` : `v${version(id).version} is now your active template for future notes.` };
      render();
    }
    else if (act === "decide") {
      await api(`/api/versions/${id}/decide`, { decision: el.dataset.d });
      await refresh();
      S.flash = { kind: "info", text: el.dataset.d === "rejected" ? "Proposal rejected. Your active template is unchanged." : "Saved for later. Your active template is unchanged." };
      render();
    }
    else if (act === "save-draft") {
      const vid = S.editPrefs._vid;
      const prefs = readPrefs("tc", S.editPrefs);
      const promptEl = $("#tc-prompt");
      const promptChanged = promptEl && promptEl.value.trim() !== version(vid).prompt.trim();
      const r = await api("/api/versions", { parentId: vid, preferences: prefs, prompt: promptChanged ? promptEl.value : null, explanation: $("#tc-expl").value });
      await refresh(); S.versionId = r.versionId; S.editPrefs = null;
      S.flash = { kind: "info", text: "Saved as a new draft. Your active template is unchanged until you approve this draft." };
      render();
    }
    else if (act === "simulate") await startSim(id, $("#sess-pick") ? $("#sess-pick").value : undefined);
    else if (act === "sim-mode") { S.simMode = el.dataset.m || null; render(); }
    else if (act === "save-note-edit") {
      await api(`/api/runs/${S.simRun.id}/feedback`, { accepted: false, scope: "note_only", tags: [], editedNote: $("#note-edit").value });
      S.simRun = await api(`/api/runs/${S.simRun.id}`); S.simMode = null; await refresh(); render();
    }
    else if (act === "accept") {
      const v = version(S.simRun.versionId);
      await api(`/api/runs/${S.simRun.id}/feedback`, { accepted: true, scope: "note_only", tags: [] });
      if (v.state === "draft" && !S.simRun.parentRunId) await api(`/api/versions/${v.id}/activate`, {});
      S.simRun = await api(`/api/runs/${S.simRun.id}`); await refresh();
      S.flash = { kind: "info", text: v.state === "draft" && !S.simRun.parentRunId ? `Accepted. ${style(v.styleId).name} v${v.version} is now your active template.` : "Note accepted. The template was not changed." };
      render();
    }
    else if (act === "clarify-option") { S.fb = Object.assign({}, S.fb, { text: el.dataset.value, scope: "future" }); S.clarification = null; S.simMode = "improve"; render(); }
    else if (act === "retry-note") {
      const correction = $("#retry-text").value.trim();
      const { jobId } = await api(`/api/runs/${S.simRun.id}/retry`, { correction });
      S.simJob = { id: jobId, status: "queued", versionId: S.simRun.versionId };
      const j = await poll(jobId, async (j) => { S.simJob = Object.assign(j, { versionId: S.simRun.versionId }); if (S.screen === "meeting") render(); });
      if (j.status === "completed") { S.simRun = await api(`/api/runs/${j.result.runId}`); S.simJob = null; S.simMode = null; S.patchProposal = null; S.clarification = null; await refresh(); }
      render();
    }
    else if (act === "confirm-patch") {
      if (S.confirmingPatch) return;
      S.confirmingPatch = true; render();
      const r = await api(`/api/patch-proposals/${S.patchProposal.id}/confirm`, { baseVersionId: S.patchProposal.baseVersionId });
      S.confirmingPatch = false; S.patchProposal = null; await refresh();
      if (r.proposalId) { S.versionId = r.proposalId; S.styleId = version(r.proposalId).styleId; go("control"); }
      if (r.jobId) { S.proposalJob = { id: r.jobId, status: "queued", result: null }; const j = await poll(r.jobId, async (j) => { S.proposalJob = j; if (S.screen === "control") render(); }); await refresh(); S.proposalJob = null; if (j.status === "completed") await loadCompare(r.proposalId); }
      render();
    }
    else if (act === "decline-patch") {
      if (S.confirmingPatch) return;
      await api(`/api/patch-proposals/${S.patchProposal.id}/decide`, { decision: "declined" }); S.patchProposal = null; await refresh(); render();
    }
    else if (act === "send-feedback") {
      const f = readFeedbackForm();
      let r = await api(`/api/runs/${S.simRun.id}/feedback`, { accepted: false, scope: f.scope, tags: f.tags, text: f.text,
        addSection: f.secName ? { name: f.secName, required: f.secReq } : null });
      S.simMode = null; S.fb = { tags: [], text: "", scope: f.scope === "future" ? "future" : "note_only", secName: "", secReq: false };
      if (r.jobId) {
        S.feedbackJob = { id: r.jobId, status: "queued", phase: "Starting feedback interpretation", elapsed: 0 };
        render();
        const j = await poll(r.jobId, async (j) => { S.feedbackJob = j; if (S.screen === "meeting") render(); });
        S.feedbackJob = null;
        if (j.status === "cancelled") { S.flash = { kind: "notice", text: "Feedback interpretation cancelled. No style change was saved; the simulation is recorded as development evidence." }; return render(); }
        if (j.status === "failed") throw new Error(j.error || "Feedback interpretation failed.");
        r = j.result;
      }
      if (r.interpretation && r.interpretation.kind === "clarification") { S.clarification = Object.assign({}, r.interpretation, { runId: S.simRun.id }); S.simMode = null; S.simRun = await api(`/api/runs/${S.simRun.id}`); await refresh(); return render(); }
      if (r.interpretation && r.interpretation.kind === "no_change") { S.simMode = null; S.simRun = await api(`/api/runs/${S.simRun.id}`); await refresh(); S.flash = { kind: "notice", text: r.interpretation.explanation || "No change proposed." }; return render(); }
      if (r.patchProposal) { S.patchProposal = r.patchProposal; S.simMode = null; S.clarification = null; await refresh(); return render(); }
      if (!r.proposalId) { S.simRun = await api(`/api/runs/${S.simRun.id}`); await refresh(); S.flash = { kind: "info", text: "Thanks — recorded for this note only. The template was not changed." }; return render(); }
      await refresh();
      S.styleId = version(r.proposalId).styleId; S.versionId = r.proposalId; S.compare = null;
      go("control");
      if (r.warning) { S.flash = { kind: "notice", text: r.warning }; render(); }
      if (r.jobId) {
        S.proposalJob = { id: r.jobId, status: "queued", phase: "Starting preview", elapsed: 0, result: null };
        render();
        const j = await poll(r.jobId, async (j) => { S.proposalJob = j; if (S.screen === "control") render(); });
        await refresh();
        if (j.status === "completed") { S.proposalJob = null; await loadCompare(r.proposalId); } else render();
      }
    }
  } catch (err) { S.confirmingPatch = false; if ($("#fb-text")) readFeedbackForm(); fail(err); }
});

(async function init() {
  try { await refresh(); render(); } catch (e) { $("#app").innerHTML = `<div class="error">Cannot reach the local server: ${esc(e.message)}</div>`; }
})();
