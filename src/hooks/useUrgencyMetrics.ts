import { useEffect, useMemo, useState } from "react";

const ORDER_STORAGE_KEY = "vedaglow_orders";
const OFFER_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const STOCK_REFRESH_MS = 5000;

const MIN_STOCK = 5;
const MAX_STOCK = 20;
const MIN_VIEWERS = 4;
const MAX_VIEWERS = 15;

type StoredOrder = {
  createdAt?: string;
  items?: Array<{ quantity?: number }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getOfferWindow(nowMs: number) {
  const start = Math.floor(nowMs / OFFER_WINDOW_MS) * OFFER_WINDOW_MS;
  return {
    start,
    end: start + OFFER_WINDOW_MS,
  };
}

function readOrders() {
  if (typeof window === "undefined") return [] as StoredOrder[];

  const raw = localStorage.getItem(ORDER_STORAGE_KEY);
  if (!raw) return [] as StoredOrder[];

  try {
    const parsed = JSON.parse(raw) as StoredOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSoldUnitsInCurrentWindow(nowMs: number) {
  const { start, end } = getOfferWindow(nowMs);
  const orders = readOrders();

  return orders.reduce((total, order) => {
    if (!order.createdAt || !order.items?.length) return total;

    const createdAtMs = new Date(order.createdAt).getTime();
    if (Number.isNaN(createdAtMs) || createdAtMs < start || createdAtMs >= end) {
      return total;
    }

    const itemQty = order.items.reduce((sum, item) => sum + Math.max(0, item.quantity ?? 0), 0);
    return total + itemQty;
  }, 0);
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function useUrgencyMetrics() {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [soldUnits, setSoldUnits] = useState(() => getSoldUnitsInCurrentWindow(Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateSold = () => setSoldUnits(getSoldUnitsInCurrentWindow(Date.now()));
    updateSold();
    const soldTimer = window.setInterval(updateSold, STOCK_REFRESH_MS);
    return () => window.clearInterval(soldTimer);
  }, []);

  const { stock, viewers, timeLeft } = useMemo(() => {
    const { start, end } = getOfferWindow(nowMs);
    const secondsLeft = Math.max(1, Math.floor((end - nowMs) / 1000));

    // Deterministic base stock per 30-min window
    const stockSeed = hashSeed(`stock-${start}`);
    const baseStock = MIN_STOCK + (stockSeed % (MAX_STOCK - MIN_STOCK + 1));

    // Soft decay over time in the window + real sold units
    const elapsedMinutes = Math.floor((nowMs - start) / 60000);
    const softDecay = Math.floor(elapsedMinutes / 8);
    const computedStock = clamp(baseStock - soldUnits - softDecay, MIN_STOCK, MAX_STOCK);

    // Deterministic viewer base per 5-min bucket with gentle pulse
    const viewerBucket = Math.floor(nowMs / (5 * 60 * 1000));
    const viewerSeed = hashSeed(`viewers-${viewerBucket}`);
    const baseViewers = MIN_VIEWERS + (viewerSeed % (MAX_VIEWERS - MIN_VIEWERS + 1));
    const pulse = Math.sin(nowMs / 25000) * 1.4;
    const urgencyBoost = secondsLeft < 10 * 60 ? 2 : 0;
    const computedViewers = clamp(
      Math.round(baseViewers + pulse + urgencyBoost),
      MIN_VIEWERS,
      MAX_VIEWERS,
    );

    return {
      stock: computedStock,
      viewers: computedViewers,
      timeLeft: secondsLeft,
    };
  }, [nowMs, soldUnits]);

  return {
    stock,
    viewers,
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isUrgent: timeLeft < 5 * 60,
  };
}
