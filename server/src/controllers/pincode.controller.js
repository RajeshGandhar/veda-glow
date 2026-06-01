// Ensure `fetch` is available in Node (Node 18+ has global fetch). If not,
// dynamically import `node-fetch` to provide a fallback.
if (typeof fetch === "undefined") {
  try {
    const mod = await import("node-fetch");
    // node-fetch v3 exports default
    globalThis.fetch = mod.default ?? mod.fetch;
  } catch (e) {
    console.error("[PINCODE] node-fetch import failed", e);
  }
}

// Simple in-memory cache for pincode lookups
const PINCODE_CACHE = new Map();
const PINCODE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    // Add a fetch timeout to avoid long waits
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let resp;
    try {
      resp = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

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
      data = await resp.json();
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
