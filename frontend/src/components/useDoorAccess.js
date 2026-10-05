import { useState } from "react";

const fmt = (iso) =>
  new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/**
 * Shared door state for the "Try it" door and the Track preview.
 *
 * Live mode (real room): pass `locked` (boolean), `onToggle(nextLocked)` (calls your API) and `history` from the server.
 *   history item: { id, lock_status: "locked" | "unlocked", at: ISO date string, source?: "app" | "card" }
 * Demo mode (no booking): pass nothing. Nothing real changes and a session-only log is kept.
 *
 * Returns:
 *  - live, locked, toggle, rows   (same as before: the "current" door, real when live, demo otherwise)
 *  - demo: { locked, rows }       demo door state + session-only demo log (always available)
 *  - real: { locked, rows }       real door state + server history (rows are empty until a real event exists)
 *  - demoToggle(nextLocked)       changes only the demo door, never calls the API
 */
export default function useDoorAccess({ locked: lockedProp, onToggle, history = [] } = {}) {
  const live = typeof lockedProp === "boolean" && typeof onToggle === "function";
  const [demoLocked, setDemoLocked] = useState(true);
  const [demoLog, setDemoLog] = useState([]);

  const locked = live ? lockedProp : demoLocked;

  // Demo only: changes the demo door and keeps a session-only log
  const demoToggle = (nextLocked) => {
    setDemoLocked(nextLocked);
    setDemoLog((p) =>
      [{ id: Date.now(), lock_status: nextLocked ? "locked" : "unlocked", label: nowTime() }, ...p].slice(0, 4)
    );
  };

  const toggle = async (nextLocked) => {
    if (live) {
      await onToggle(nextLocked); // throws on failure, so the door stays as it was
    } else {
      demoToggle(nextLocked);
    }
  };

  // Real history from the server (only when a real room is connected)
  const realRows = live
    ? history.slice(0, 6).map((e) => ({
        id: e.id,
        lock_status: e.lock_status,
        label: fmt(e.at),
        by: e.source === "app" ? "Digital key (app)" : "Key card at door",
      }))
    : [];

  const rows = live ? realRows : demoLog;

  return {
    live,
    locked,
    toggle,
    rows,
    demoToggle,
    demo: { locked: demoLocked, rows: demoLog },
    real: { locked: live ? lockedProp : undefined, rows: realRows },
  };
}