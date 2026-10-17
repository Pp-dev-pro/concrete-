const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const defaults = {cement:475, slag:0, ash:59, water:142, super:1.9, coarse:1098, fine:641, age:28};
const fields = [
  ["cement","Cement (component 1)(kg in a m^3 mixture)","Cement","kg/m³"],
  ["slag","Blast Furnace Slag (component 2)(kg in a m^3 mixture)","Blast Furnace Slag","kg/m³"],
  ["ash","Fly Ash (component 3)(kg in a m^3 mixture)","Fly Ash","kg/m³"],
  ["water","Water  (component 4)(kg in a m^3 mixture)","Water","kg/m³"],
  ["super","Superplasticizer (component 5)(kg in a m^3 mixture)","Superplasticizer","kg/m³"],
  ["coarse","Coarse Aggregate  (component 6)(kg in a m^3 mixture)","Coarse Aggregate","kg/m³"],
  ["fine","Fine Aggregate (component 7)(kg in a m^3 mixture)","Fine Aggregate","kg/m³"],
  ["age","Age (day)","Age","days"]
];
let latestReport = null;
let toastTimer;

function showToast(message, error=false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("error", error);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3800);
}
function setView(view) {
  const results = view === "results";
  $("#predict-view").classList.toggle("is-hidden", results);
  $("#results-view").classList.toggle("is-hidden", !results);
  $("#crumb-current").textContent = results ? "MODEL ANALYSIS" : "STRENGTH PREDICTOR";
  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-item").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
$("#edit-mix").addEventListener("click", () => setView("predict"));
$("#edit-mix-2").addEventListener("click", () => setView("predict"));
$("#empty-run").addEventListener("click", () => setView("predict"));

function syncRanges() {
  $$(".range").forEach(range => {
    const input = document.getElementById(range.dataset.target);
    range.value = input.value;
    const min = Number(range.min), max = Number(range.max), val = Number(range.value);
    const pct = max === min ? 0 : (val-min)/(max-min)*100;
    range.style.background = `linear-gradient(90deg, var(--accent) ${pct}%, #34404a ${pct}%)`;
  });
  const age = Number($("#age").value) || 0;
  $(".age-ring span").innerHTML = `${age}<small>DAYS</small>`;
}
$$(".range").forEach(range => range.addEventListener("input", () => {
  const input = document.getElementById(range.dataset.target);
  input.value = range.value;
  syncRanges();
}));
fields.forEach(([id]) => document.getElementById(id).addEventListener("input", syncRanges));
$("#reset-btn").addEventListener("click", () => {
  Object.entries(defaults).forEach(([id,value]) => document.getElementById(id).value = value);
  syncRanges();
  showToast("Sample mix values restored.");
});

function readMix() {
  const mix = {};
  for (const [id,key] of fields) {
    const input = document.getElementById(id);
    const value = Number(input.value);
    if (input.value.trim() === "" || !Number.isFinite(value) || value < 0 || (id === "age" && (!Number.isInteger(value) || value < 1))) {
      input.focus();
      throw new Error(id === "age" ? "Age must be a whole number of at least 1 day." : `Enter a valid non-negative value for ${id}.`);
    }
    mix[key] = value;
  }
  return mix;
}
function formatPrediction(n) {
  return Number.isFinite(n) ? n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "—";
}
function modelResultList(data) {
  return Array.isArray(data?.results) ? data.results : [];
}
function renderReport(data, mix) {
  latestReport = { ...data, input: mix };
  const results = modelResultList(data);
  const good = results.filter(r => r.ok && Number.isFinite(r.prediction));
  const vals = good.map(r => r.prediction);
  const mean = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  const spread = vals.length > 1 ? Math.max(...vals)-Math.min(...vals) : null;
  const closestLabel = good.length ? good[0].model : "No successful model";
  const metrics = [
    {label:"SUCCESSFUL MODELS",value:`${good.length}<small> / ${results.length || 2}</small>`,foot:good.length ? "Live endpoint response received" : "Check API credentials and endpoint setup",className:good.length ? "good":"warn"},
    {label:"AVERAGE PREDICTION",value:mean === null ? "—" : `${formatPrediction(mean)}<small> MPa</small>`,foot:mean === null ? "No numeric results available" : "Mean of successful model predictions",className:""},
    {label:"MODEL SPREAD",value:spread === null ? "—" : `${formatPrediction(spread)}<small> MPa</small>`,foot:spread === null ? "Requires at least two successful models" : "Difference between highest and lowest output",className:""}
  ];
  $("#metric-grid").innerHTML = metrics.map(m => `<article class="metric-card"><div class="metric-label">${m.label}</div><div class="metric-value">${m.value}</div><div class="metric-foot ${m.className}">${m.foot}</div></article>`).join("");
  const maxVal = Math.max(1, ...good.map(r => r.prediction));
  $("#bar-chart").innerHTML = results.map((r,i) => {
    const width = r.ok ? Math.max(1, r.prediction/maxVal*100) : 0;
    return `<div class="bar-row"><div class="bar-label">${escapeHtml(r.model || `Model ${i+1}`)}</div><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><div class="bar-number">${r.ok ? formatPrediction(r.prediction) : "N/A"}</div></div>`;
  }).join("") || `<p class="metric-foot">No model responses returned.</p>`;
  const insights = [];
  if (good.length === 0) {
    insights.push(["!","No successful predictions","Neither endpoint returned a numeric prediction. Review the endpoint key, OAuth token, model deployment and API response format."]);
  } else {
    insights.push(["↗","Prediction summary", `The available model output${good.length===1?" is":"s are"} ${good.map(r=>`${escapeHtml(r.model)}: ${formatPrediction(r.prediction)} MPa`).join("; ")}.`]);
    if (good.length > 1) {
      const diffPct = mean === 0 ? 0 : (spread/Math.abs(mean))*100;
      insights.push(["≈","Agreement between models",`The model spread is ${formatPrediction(spread)} MPa (${formatPrediction(diffPct)}% of the mean). Similar outputs indicate agreement, not necessarily accuracy.`]);
      const highest = good.reduce((a,b)=>a.prediction>b.prediction?a:b);
      const lowest = good.reduce((a,b)=>a.prediction<b.prediction?a:b);
      insights.push(["⇅","Output range",`${escapeHtml(lowest.model)} returned the lower estimate (${formatPrediction(lowest.prediction)} MPa), while ${escapeHtml(highest.model)} returned the higher estimate (${formatPrediction(highest.prediction)} MPa).`]);
    } else {
      insights.push(["i","Comparison unavailable","Only one endpoint succeeded. Configure the second endpoint to compare model outputs."]);
    }
  }
  $("#insights").innerHTML = insights.map(([mark,title,body]) => `<div class="insight"><div class="insight-mark">${mark}</div><div><b>${title}</b><p>${body}</p></div></div>`).join("");
  $("#model-details").innerHTML = results.map(r => `<div class="model-detail"><div class="model-name">${escapeHtml(r.model || "Model")}<small>Zoho Catalyst QuickML</small></div><div class="model-status ${r.ok?"":"error"}">${r.ok ? "● SUCCESS" : "● FAILED"}</div><div class="model-pred">${r.ok ? `${formatPrediction(r.prediction)} <small>MPa</small>` : "—"}</div>${r.error ? `<div class="model-error">${escapeHtml(r.error)}</div>` : ""}</div>`).join("");
  $("#mix-snapshot").innerHTML = fields.map(([id,key,label,unit])=>`<div class="snapshot"><span>${label}</span><b>${Number(mix[key]).toLocaleString(undefined,{maximumFractionDigits:2})}</b><small>${unit}</small></div>`).join("");
  $("#report-time").textContent = data.evaluatedAt ? new Date(data.evaluatedAt).toLocaleString() : new Date().toLocaleString();
  $("#result-state").classList.add("is-hidden");
  $("#report").classList.remove("is-hidden");
  setView("results");
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

$("#mix-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#predict-btn");
  const label = $(".btn-text");
  let mix;
  try { mix = readMix(); }
  catch (e) { showToast(e.message, true); return; }
  button.disabled = true;
  label.textContent = "Calling models…";
  button.querySelector(".btn-icon").textContent = "◌";
  setView("results");
  $("#report").classList.add("is-hidden");
  $("#result-state").classList.remove("is-hidden");
  $("#result-state").innerHTML = `<div class="empty-orbit spin">◈</div><h2>Querying QuickML endpoints</h2><p>Sending your mix to both models and preparing the comparison report…</p>`;
  try {
    const response = await fetch("/api/predict", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({data:mix})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    renderReport(data,mix);
    if (!modelResultList(data).some(r=>r.ok)) showToast("No model returned a prediction. See endpoint diagnostics below.",true);
    else showToast("Prediction report is ready.");
  } catch (e) {
    $("#result-state").innerHTML = `<div class="empty-orbit">!</div><h2>Prediction request failed</h2><p>${escapeHtml(e.message || "Could not reach the local API server.")}</p><button class="ghost-btn" id="retry-view">Return to inputs</button>`;
    $("#retry-view").addEventListener("click",()=>setView("predict"));
    showToast(e.message || "Request failed.",true);
  } finally {
    button.disabled = false;
    label.textContent = "Run prediction";
    button.querySelector(".btn-icon").textContent = "↗";
  }
});

$("#download-report").addEventListener("click", () => {
  if (!latestReport) return;
  const blob = new Blob([JSON.stringify(latestReport,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `strata-analysis-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

async function checkApi() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    $("#api-status").textContent = data.configured ? "Server configured" : "Credentials needed";
    $(".status-pulse").style.background = data.configured ? "var(--accent)" : "#e8b45c";
  } catch {
    $("#api-status").textContent = "Server unavailable";
    $(".status-pulse").style.background = "#e87968";
  }
}
syncRanges();
checkApi();
window.addEventListener("load", () => {
  setTimeout(() => {
    $("#splash").classList.add("out");
    $("#app").classList.remove("is-hidden");
    setTimeout(()=>$("#splash").remove(),800);
  }, 1050);
});
