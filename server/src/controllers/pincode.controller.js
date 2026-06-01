import https from "node:https";

// Simple in-memory cache for pincode lookups
const PINCODE_CACHE = new Map();
const PINCODE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const POSTAL_API_HOST = "api.postalpincode.in";
const POSTAL_API_TIMEOUT_MS = 8000;

function fetchPostalPincode(pincode) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: POSTAL_API_HOST,
        path: `/pincode/${encodeURIComponent(pincode)}`,
        method: "GET",
        timeout: POSTAL_API_TIMEOUT_MS,
        headers: {
          Accept: "application/json",
          "User-Agent": "VedaGlow/1.0",
        },
        // India Post's public API certificate can expire before their data API
        // is updated. This endpoint only returns public pincode metadata.
        rejectUnauthorized: false,
      },
      (resp) => {
        let body = "";
        resp.setEncoding("utf8");
        resp.on("data", (chunk) => {
          body += chunk;
        });
        resp.on("end", () => {
          resolve({
            ok: resp.statusCode >= 200 && resp.statusCode < 300,
            status: resp.statusCode,
            statusText: resp.statusMessage,
            body,
          });
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("Postal API request timed out"));
    });
    req.on("error", reject);
  });
}

export async function lookupPincode(req, res) {
  const raw = String(req.params.pincode ?? "").trim();
  const pincode = raw;
  if (!/^[0-9]{6}$/.test(pincode)) {
    res.status(400).json({ success: false, message: "Invalid pincode format" });
    return;
  }

  const cached = PINCODE_CACHE.get(pincode);
  const now = Date.now();
  if (cached && now - cached.ts < PINCODE_TTL_MS) {
    res.status(200).json({ success: true, ...cached.value });
    return;
  }

  try {
    const resp = await fetchPostalPincode(pincode);

    if (!resp || !resp.ok) {
      const statusInfo = resp
        ? `${resp.status} ${resp.statusText}`
        : "no-response";
      console.error(
        `[PINCODE] External postal API returned bad status: ${statusInfo}`,
      );
      res
        .status(502)
        .json({ success: false, message: "External postal API error" });
      return;
    }

    let data;
    try {
      data = JSON.parse(resp.body);
    } catch (parseErr) {
      console.error("[PINCODE] Failed to parse postal API response", parseErr);
      res
        .status(502)
        .json({ success: false, message: "Invalid response from postal API" });
      return;
    }

    const status = data?.[0]?.Status;
    const postOffice = data?.[0]?.PostOffice?.[0] ?? null;

    if (status === "Success" && postOffice) {
      const value = {
        city: postOffice.District ?? "",
        state: postOffice.State ?? "",
        pincode,
      };
      PINCODE_CACHE.set(pincode, { ts: now, value });
      res.status(200).json({ success: true, ...value });
      return;
    }

    // Not found
    res.status(200).json({ success: false, message: "Pincode not found" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PINCODE] Lookup failed", msg);
    // If the error is caused by certificate/date issues or aborts, return 502 to indicate upstream problem
    if (
      msg.includes("CERT") ||
      msg.includes("certificate") ||
      msg.includes("abort") ||
      msg.includes("ENOTFOUND")
    ) {
      res
        .status(502)
        .json({ success: false, message: "Postal API unreachable" });
      return;
    }

    res.status(500).json({ success: false, message: "Pincode lookup failed" });
  }
}

export default lookupPincode;
