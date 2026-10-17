(() => {
  "use strict";
  const CFG = window.APP_CONFIG;
  const $ = (id) => document.getElementById(id);
  const S = (d) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  /* Parameters: keys match the API payload exactly */
  const PARAMS = [
    { key: "Cement (component 1)(kg in a m^3 mixture)", name: "Cement", unit: "kg/m³", min: 100, max: 550, step: 1, val: 475, color: "#ffb020",
      icon: S('<path d="M14 18l6-8h24l6 8v34a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2z"/><path d="M14 18h36"/><rect x="22" y="26" width="20" height="14" rx="2"/><path d="M26 33h12"/>') },
    { key: "Blast Furnace Slag (component 2)(kg in a m^3 mixture)", name: "Blast furnace slag", unit: "kg/m³", min: 0, max: 360, step: 1, val: 0, color: "#8b7cff",
      icon: S('<path d="M32 8l18 10v20L32 56 14 38V18z"/><path d="M14 18l18 10 18-10M32 28v28"/><path d="M23 13l9 5 9-5" opacity=".5"/>') },
    { key: "Fly Ash (component 3)(kg in a m^3 mixture)", name: "Fly ash", unit: "kg/m³", min: 0, max: 200, step: 1, val: 59, color: "#9fb3c8",
      icon: S('<circle cx="18" cy="42" r="4"/><circle cx="32" cy="48" r="3"/><circle cx="46" cy="40" r="5"/><circle cx="26" cy="28" r="3"/><circle cx="40" cy="22" r="4"/><circle cx="20" cy="14" r="2.5"/><circle cx="48" cy="12" r="2"/>') },
    { key: "Water (component 4)(kg in a m^3 mixture)", name: "Water", unit: "kg/m³", min: 120, max: 250, step: 1, val: 142, color: "#38bdf8",
      icon: S('<path d="M32 8c10 13 16 21 16 30a16 16 0 0 1-32 0c0-9 6-17 16-30z"/><path d="M24 40a8 8 0 0 0 7 7" opacity=".6"/>') },
    { key: "Superplasticizer (component 5)(kg in a m^3 mixture)", name: "Superplasticizer", unit: "kg/m³", min: 0, max: 33, step: 0.1, val: 1.9, color: "#3ddbc0",
      icon: S('<path d="M26 8h12M28 8v10l-10 24a8 8 0 0 0 7 12h14a8 8 0 0 0 7-12L36 18V8"/><path d="M21 38h22" /><path d="M28 46h.01M36 44h.01M32 49h.01" stroke-width="4"/>') },
    { key: "Coarse Aggregate (component 6)(kg in a m^3 mixture)", name: "Coarse aggregate", unit: "kg/m³", min: 800, max: 1150, step: 1, val: 1098, color: "#ff8a5b",
      icon: S('<path d="M10 40l8-14 12 4 6 14-10 8z"/><path d="M34 30l8-16 14 8-2 16-12 4z"/><path d="M26 54l10-10 16 2 4 8z" opacity=".7"/>') },
    { key: "Fine Aggregate (component 7)(kg in a m^3 mixture)", name: "Fine aggregate", unit: "kg/m³", min: 590, max: 1000, step: 1, val: 641, color: "#e6c35c",
      icon: S('<path d="M6 52c10-6 14-18 26-38 12 20 16 32 26 38z"/><path d="M20 46h.01M30 40h.01M38 46h.01M33 30h.01M26 52h.01M44 52h.01" stroke-width="4"/>') },
    { key: "Age (day)", name: "Age", unit: "days", min: 1, max: 365, step: 1, val: 28, color: "#f472b6",
      icon: S('<rect x="10" y="14" width="44" height="40" rx="6"/><path d="M10 26h44M22 8v10M42 8v10"/><circle cx="32" cy="40" r="7"/><path d="M32 36v4l3 2"/>') }
  ];

  /* ---------- Splash ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(() => {
    $("splash").classList.add("out");
    $("app").hidden = false;
    buildCards();
    setTimeout(() => $("splash").remove(), 700);
  }, reduce ? 200 : 2900);

  /* ---------- Parameter boxes ---------- */
  function buildCards() {
    const grid = $("grid");
    grid.innerHTML = PARAMS.map((p, i) => `
      <div class="card" style="--c:${p.color};--i:${i}">
        <div class="tile">${p.icon}</div>
        <div><h4>${p.name}</h4><small>${p.min} to ${p.max} ${p.unit}</small></div>
        <div class="entry">
          <input type="number" id="n${i}" inputmode="decimal" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.val}" aria-label="${p.name} in ${p.unit}">
          <em>${p.unit}</em>
        </div>
        <input type="range" class="range" id="r${i}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.val}" aria-label="${p.name} slider">
        <div class="bounds"><span>${p.min}</span><span>${p.max}</span></div>
      </div>`).join("");
    [...grid.children].forEach((card, i) => {
      requestAnimationFrame(() => card.classList.add("in"));
      card.addEventListener("pointermove", (e) => {
        const b = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - b.left + "px");
        card.style.setProperty("--my", e.clientY - b.top + "px");
      });
      const n = $("n" + i), r = $("r" + i), p = PARAMS[i];
      const paint = () => r.style.setProperty("--p", ((r.value - p.min) / (p.max - p.min)) * 100 + "%");
      r.addEventListener("input", () => { n.value = r.value; n.classList.remove("invalid"); paint(); });
      n.addEventListener("input", () => {
        const v = parseFloat(n.value);
        if (!isNaN(v)) { r.value = Math.min(p.max, Math.max(p.min, v)); paint(); }
        n.classList.remove("invalid");
      });
      paint();
    });
  }

  function readMix() {
    const data = {}; let ok = true;
    PARAMS.forEach((p, i) => {
      const n = $("n" + i), v = parseFloat(n.value);
      if (isNaN(v) || v < 0) { n.classList.add("invalid"); ok = false; }
      else data[p.key] = v;
    });
    return ok ? data : null;
  }

  $("resetBtn").onclick = () => PARAMS.forEach((p, i) => {
    $("n" + i).value = p.val; $("r" + i).value = p.val;
    $("r" + i).dispatchEvent(new Event("input"));
  });

  /* ---------- Credentials dialog ---------- */
  const dlg = $("credDialog");
  let mix = null, lastResults = null;

  $("mixForm").addEventListener("submit", (e) => {
    e.preventDefault();
    mix = readMix();
    if (!mix) { const bad = document.querySelector(".invalid"); bad && bad.focus(); return; }
    openCreds();
  });

  function openCreds() {
    const saved = JSON.parse(sessionStorage.getItem("mixwise.creds") || "null") || {};
    $("fToken").value = saved.token || "";
    $("fKey1").value = saved.key1 || "";
    $("fKey2").value = saved.key2 || "";
    $("fOrg").value = saved.org || CFG.defaultOrg;
    $("fEnv").value = saved.env || CFG.defaultEnv;
    $("fUrl").value = saved.url || CFG.defaultUrl;
    $("credError").hidden = true;
    dlg.showModal();
    ($("fToken").value ? $("credGo") : $("fToken")).focus();
  }
  $("credCancel").onclick = () => dlg.close();
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  $("credForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const c = {
      token: $("fToken").value.trim(), key1: $("fKey1").value.trim(), key2: $("fKey2").value.trim(),
      org: $("fOrg").value.trim(), env: $("fEnv").value, url: $("fUrl").value.trim()
    };
    if ($("fRemember").checked) sessionStorage.setItem("mixwise.creds", JSON.stringify(c));
    else sessionStorage.removeItem("mixwise.creds");
    dlg.close();
    await run(c);
  });

  $("demoBtn").onclick = () => {
    dlg.close();
    // Illustrative numbers only, so the layout can be previewed without credentials.
    const base = 38 + (mix["Cement (component 1)(kg in a m^3 mixture)"] - 300) * 0.045;
    lastResults = CFG.models.map((m, i) => ({ model: m, value: base + (i ? -1.6 : 1.1), demo: true }));
    showResults();
  };

  /* ---------- API ---------- */
  async function callModel(model, c) {
    const res = await fetch(c.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-QUICKML-ENDPOINT-KEY": model.id === "xgb" ? c.key1 : c.key2,
        "Authorization": "Zoho-oauthtoken " + c.token,
        "CATALYST-ORG": c.org,
        "Environment": c.env
      },
      body: JSON.stringify({ data: mix })
    });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = text; }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${typeof json === "string" ? json : JSON.stringify(json)}`);
    const v = extract(json);
    if (v === null) throw new Error("Unexpected response: " + text.slice(0, 200));
    return v;
  }

  function extract(j) {
    if (j && typeof j === "object" && "result" in j) j = j.result;
    if (Array.isArray(j)) j = j[0];
    if (j && typeof j === "object") j = Object.values(j).find((x) => !isNaN(parseFloat(x)));
    const n = parseFloat(j);
    return isNaN(n) ? null : n;
  }

  async function run(c) {
    $("loading").hidden = false;
    const settled = await Promise.allSettled(CFG.models.map((m) => callModel(m, c)));
    lastResults = settled.map((s, i) => s.status === "fulfilled"
      ? { model: CFG.models[i], value: s.value }
      : { model: CFG.models[i], error: s.reason.message || String(s.reason) });
    $("loading").hidden = true;
    showResults();
  }

  /* ---------- Results ---------- */
  const CLASSES = [
    { max: 20, name: "Low strength", color: "#ff6b6b" },
    { max: 35, name: "Moderate", color: "#ff9f43" },
    { max: 50, name: "Structural", color: "#ffd24a" },
    { max: 70, name: "High strength", color: "#6ee7a8" },
    { max: Infinity, name: "Very high", color: "#3ddbc0" }
  ];
  const classOf = (v) => CLASSES.find((c) => v < c.max);
  const fmt = (v, d = 1) => v.toFixed(d);

  function switchView(name) {
    const r = name === "results";
    $("viewInput").hidden = r; $("viewResults").hidden = !r;
    $("navMix").classList.toggle("is-active", !r);
    $("navResults").classList.toggle("is-active", r);
    scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }
  $("navMix").onclick = () => switchView("input");
  $("navResults").onclick = () => switchView("results");
  $("editBtn").onclick = () => switchView("input");
  $("rerunBtn").onclick = openCreds;

  function showResults() {
    $("navResults").disabled = false;
    switchView("results");
    const ok = lastResults.filter((r) => r.value !== undefined);
    const demo = lastResults.some((r) => r.demo);
    $("resultsLead").textContent = demo
      ? "Sample output for layout preview. These numbers are not from your models."
      : ok.length === lastResults.length ? "Both models returned a prediction for your mix."
      : ok.length ? "One model failed. Details are on its card." : "Neither model returned a prediction.";

    // Model cards with gauges
    const MAX = 80, ARC = Math.PI * 90;
    $("models").innerHTML = lastResults.map((r) => {
      const m = r.model;
      if (r.error) return `<article class="model failed" style="--c:#ff6b6b">
        <header><span class="dot"></span><h3>${m.name}</h3></header>
        <p class="blurb">${m.blurb}</p>
        <p class="fail">${esc(r.error)}
        <small>${/Failed to fetch|NetworkError/i.test(r.error)
          ? "The browser blocked the request. This is usually CORS: Zoho must allow your site’s origin, or the request must go through a small proxy."
          : "Check the access token (they expire after an hour), the endpoint key, and the org ID."}</small></p></article>`;
      const f = Math.max(0, Math.min(1, r.value / MAX));
      return `<article class="model" style="--c:${m.color}">
        <header><span class="dot"></span><h3>${m.name}</h3></header>
        <p class="blurb">${m.blurb}</p>
        <svg class="gauge" viewBox="0 0 220 125" aria-hidden="true">
          <path class="track" d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke-width="14" stroke-linecap="round"/>
          <path class="val" d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke-width="14" stroke-dasharray="${ARC}" stroke-dashoffset="${ARC}" data-off="${ARC * (1 - f)}"/>
        </svg>
        <div class="readout"><b>${fmt(r.value)}</b><span>MPa predicted</span></div>
      </article>`;
    }).join("");
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll(".gauge .val").forEach((p) => (p.style.strokeDashoffset = p.dataset.off))));

    renderCompare(ok);
    renderClass(ok);
    renderComposition();
  }

  function renderCompare(ok) {
    if (!ok.length) { $("compareChart").innerHTML = ""; $("compareNote").textContent = "No predictions to compare."; return; }
    const max = Math.max(...ok.map((r) => r.value), 10) * 1.15;
    const avg = ok.reduce((a, r) => a + r.value, 0) / ok.length;
    const rows = ok.map((r) => ({ name: r.model.name, v: r.value, c: r.model.color }));
    if (ok.length > 1) rows.push({ name: "Average", v: avg, c: "#e8ecf3" });
    $("compareChart").innerHTML = `<div class="bars">${rows.map((r) => `
      <div class="bar-row" style="--c:${r.c}"><span>${r.name}</span>
      <div class="t"><i data-w="${(r.v / max) * 100}"></i></div><b>${fmt(r.v)} MPa</b></div>`).join("")}</div>`;
    animate("#compareChart i", "w");
    if (ok.length > 1) {
      const d = Math.abs(ok[0].value - ok[1].value), pct = (d / avg) * 100;
      $("compareNote").textContent = `The models differ by ${fmt(d, 2)} MPa (${fmt(pct)}% of the average). ` +
        (pct < 5 ? "They agree closely." : pct < 12 ? "A modest gap; treat the average as the working estimate." : "A wide gap; check the inputs against the training range.");
    } else $("compareNote").textContent = "Only one model returned a result.";
  }

  function renderClass(ok) {
    if (!ok.length) { $("classBody").innerHTML = '<p class="muted">Run the models to see a class.</p>'; return; }
    const avg = ok.reduce((a, r) => a + r.value, 0) / ok.length, cls = classOf(avg);
    const pos = Math.max(0, Math.min(100, (avg / 80) * 100));
    $("classBody").innerHTML = `
      <p class="classname" style="color:${cls.color}">${cls.name}</p>
      <p class="muted">Based on ${ok.length > 1 ? "the average of both models" : ok[0].model.name}: ${fmt(avg)} MPa.</p>
      <div class="scale" style="margin-top:26px">${CLASSES.map((c) => `<span style="background:${c.color}"></span>`).join("")}
        <div class="pin" data-v="${fmt(avg)} MPa" data-l="${pos}"></div></div>
      <div class="classlist"><span>&lt;20</span><span>20–35</span><span>35–50</span><span>50–70</span><span>70+</span></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const pin = document.querySelector(".pin"); if (pin) pin.style.left = `calc(${pin.dataset.l}% - 2px)`;
    }));
  }

  function renderComposition() {
    const names = ["Cement", "Slag", "Fly ash", "Water", "Superplasticizer", "Coarse aggregate", "Fine aggregate"];
    const items = names.map((n, i) => ({ n, v: mix[PARAMS[i].key], c: PARAMS[i].color }));
    const total = items.reduce((a, x) => a + x.v, 0);
    $("compChart").innerHTML = `
      <div class="stack">${items.map((x) => `<i style="--c:${x.c}" data-w="${(x.v / total) * 100}" title="${x.n}"></i>`).join("")}</div>
      <div class="legend">${items.map((x) => `<div><span class="dot" style="background:${x.c}"></span>${x.n}<b>${fmt((x.v / total) * 100)}%</b></div>`).join("")}</div>`;
    animate("#compChart i", "w");

    const [cem, slag, fly, water] = items.map((x) => x.v);
    const binder = cem + slag + fly;
    const rows = [
      ["Water / cement", fmt(water / cem, 2)],
      ["Water / binder", fmt(water / binder, 2)],
      ["Total binder", fmt(binder, 0) + " kg/m³"],
      ["Supplementary materials", fmt(((slag + fly) / binder) * 100) + "% of binder"],
      ["Aggregate / binder", fmt((items[5].v + items[6].v) / binder, 2)],
      ["Mix mass", fmt(total, 0) + " kg/m³"],
      ["Curing age", mix["Age (day)"] + " days"]
    ];
    $("ratios").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  }

  function animate(sel, attr) {
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll(sel).forEach((el) => (el.style.width = el.dataset[attr] + "%"))));
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
})();
