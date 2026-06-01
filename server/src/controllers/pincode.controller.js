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
  const { pincode } = req.params;
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
    const resp = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await resp.json();
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
    console.error(
      "[PINCODE] Lookup failed",
      err instanceof Error ? err.message : err,
    );
    res.status(500).json({ success: false, message: "Pincode lookup failed" });
  }
}

export default lookupPincode;
