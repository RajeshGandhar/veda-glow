import { useEffect, useState } from "react";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type ScriptStatus = "idle" | "loading" | "ready" | "error";

/**
 * Lazily loads the Razorpay checkout script once and tracks its status.
 * Safe to call from multiple components — the script tag is only injected once.
 */
export function useRazorpay(): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(() => {
    if (typeof window === "undefined") return "idle";
    if (window.Razorpay) return "ready";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) return existing.dataset.status as ScriptStatus ?? "loading";
    return "idle";
  });

  useEffect(() => {
    // Don't load Razorpay on admin pages
    if (window.location.pathname.startsWith("/admin")) {
      return;
    }

    if (status === "ready" || status === "error") return;

    let script = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);

    if (!script) {
      script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      script.dataset.status = "loading";
      document.body.appendChild(script);
      setStatus("loading");
    }

    const onLoad = () => {
      script!.dataset.status = "ready";
      setStatus("ready");
    };
    const onError = () => {
      script!.dataset.status = "error";
      setStatus("error");
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    return () => {
      script!.removeEventListener("load", onLoad);
      script!.removeEventListener("error", onError);
    };
  }, [status]);

  return status;
}
