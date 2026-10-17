const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 3000);
const PREDICT_URL = process.env.ZOHO_QUICKML_PREDICT_URL ||
  "https://api.catalyst.zoho.in/quickml/v1/project/84405000000016025/endpoints/predict";

const FIELD_KEYS = [
  "Cement (component 1)(kg in a m^3 mixture)",
  "Blast Furnace Slag (component 2)(kg in a m^3 mixture)",
  "Fly Ash (component 3)(kg in a m^3 mixture)",
  "Water  (component 4)(kg in a m^3 mixture)",
  "Superplasticizer (component 5)(kg in a m^3 mixture)",
  "Coarse Aggregate  (component 6)(kg in a m^3 mixture)",
  "Fine Aggregate (component 7)(kg in a m^3 mixture)",
  "Age (day)"
];

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

function send(res, status, data, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store"
  });
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 100_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function validateData(data) {
  if (!data || typeof data !== "object") return "Missing data object.";
  for (const key of FIELD_KEYS) {
    const value = data[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return `Invalid or missing numeric value for "${key}". Values must be zero or greater.`;
    }
  }
  if (!Number.isInteger(data["Age (day)"]) || data["Age (day)"] < 1) {
    return 'Age (day) must be a whole number of at least 1.';
  }
  return null;
}

async function predictModel(label, endpointKey, payload) {
  if (!endpointKey) {
    return { model: label, ok: false, error: "Endpoint key is not configured on the server." };
  }
  const token = process.env.ZOHO_ACCESS_TOKEN;
  const org = process.env.ZOHO_CATALYST_ORG;
  if (!token || !org) {
    return { model: label, ok: false, error: "Zoho OAuth token or Catalyst organization ID is not configured." };
  }
  try {
    const response = await fetch(PREDICT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-QUICKML-ENDPOINT-KEY": endpointKey,
        "Authorization": `Zoho-oauthtoken ${token}`,
        "CATALYST-ORG": org,
        "Environment": process.env.ZOHO_ENVIRONMENT || "Development"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000)
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; }
    catch { body = { raw: text.slice(0, 1200) }; }

    if (!response.ok) {
      return {
        model: label, ok: false, status: response.status,
        error: body.message || body.error || `Zoho API returned HTTP ${response.status}.`,
        detail: body
      };
    }

    const candidate = body?.result?.[0] ?? body?.result ?? body?.prediction ?? body?.predicted_value;
    const numeric = typeof candidate === "number" ? candidate :
      (typeof candidate === "string" && candidate.trim() !== "" ? Number(candidate) : NaN);

    return {
      model: label,
      ok: Number.isFinite(numeric),
      prediction: Number.isFinite(numeric) ? numeric : null,
      response: Number.isFinite(numeric) ? undefined : body,
      error: Number.isFinite(numeric) ? undefined : "API responded, but no numeric prediction was found in result[0]. Check the endpoint response format."
    };
  } catch (error) {
    return { model: label, ok: false, error: error.name === "TimeoutError" ? "Zoho API request timed out." : "Could not reach the Zoho API. Check server logs and credentials." };
  }
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp"
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, configured: Boolean(process.env.ZOHO_ACCESS_TOKEN && process.env.XGBOOST_ENDPOINT_KEY && process.env.NEXT_REGRESSION_ENDPOINT_KEY) });
  }

  if (req.method === "POST" && url.pathname === "/api/predict") {
    try {
      const incoming = await readBody(req);
      const validationError = validateData(incoming.data);
      if (validationError) return send(res, 400, { error: validationError });
      const payload = { data: incoming.data };

      const results = await Promise.all([
        predictModel("XGBoost", process.env.XGBOOST_ENDPOINT_KEY, payload),
        predictModel("Model 2", process.env.NEXT_REGRESSION_ENDPOINT_KEY, payload)
      ]);
      return send(res, 200, { results, evaluatedAt: new Date().toISOString() });
    } catch (error) {
      return send(res, 400, { error: error.message || "Unable to process request." });
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, { error: "Method not allowed." });
  }

  const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const resolved = path.resolve(PUBLIC, requested);
  if (!resolved.startsWith(PUBLIC + path.sep) && resolved !== path.join(PUBLIC, "index.html")) {
    return send(res, 403, { error: "Forbidden" });
  }
  fs.readFile(resolved, (err, content) => {
    if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
    res.writeHead(200, {
      "Content-Type": mime[path.extname(resolved)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer"
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Concrete Strength Studio running at http://localhost:${PORT}`);
});
