import { useState } from "react";

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/**
 * Demo door state shared by the "Try it" door and the Track preview.
 * Frontend only: nothing real changes and a session-only log is kept.
 * (The real door is handled directly in pages/Home.jsx.)
 *
 * Returns:
 *  - live: always false (demo)
 *  - locked, toggle(nextLocked)   the demo door and the function that changes it
 *  - demo: { locked, rows }       demo door state + session-only demo log (latest 4)
 */
export default function useDoorAccess() {
  const [locked, setLocked] = useState(true);
  const [rows, setRows] = useState([]);

  const toggle = (nextLocked) => {
    setLocked(nextLocked);
    setRows((p) =>
      [{ id: Date.now(), lock_status: nextLocked ? "locked" : "unlocked", label: nowTime() }, ...p].slice(0, 4)
    );
  };

  return { live: false, locked, toggle, demo: { locked, rows } };
}
