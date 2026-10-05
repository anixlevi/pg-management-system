import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Preview (modal) with the room status explainer + lock/unlock history.
 * Opened from the Track button under the hero text. Close with the x, a click outside, or Esc.
 *
 * Two options (tabs) are always visible:
 *  - Demo: works like the demo (drag the key on the reader, locked / unlocked).
 *  - Real (your room): the real door. Its status and history are filled in only when the real
 *    door has actually locked or unlocked.
 *
 * Props:
 *  - demo: { locked, rows }   data of the demo door
 *  - real: { locked, rows }   data of the real door; leave it undefined when the user has no digital key yet
 */

// "locked" flag of a section; falls back to the latest history row when the flag is missing
const resolveLocked = (data) => {
  if (!data) return true;
  if (typeof data.locked === "boolean") return data.locked;
  const latest = (data.rows || [])[0];
  return latest ? latest.lock_status === "locked" : true;
};

function StateCards({ locked }) {
  return (
    <div className="dd-states">
      <div className={`dd-state ${locked ? "active" : ""}`}>
        <strong>🔒 Locked</strong>
        Door is secured and electricity in your room is off.
      </div>
      <div className={`dd-state ${!locked ? "active" : ""}`}>
        <strong>🔓 Unlocked</strong>
        Door opens and electricity in your room switches on.
      </div>
    </div>
  );
}

function HistoryList({ rows, emptyText }) {
  if (rows.length === 0) return <p className="dd-log-empty">{emptyText}</p>;
  return (
    <ul className="dd-log">
      {rows.map((e) => (
        <li key={e.id}>
          <span>
            {e.lock_status === "locked" ? "🔒 Room locked" : "🔓 Room unlocked"}
            {e.by && <small style={{ display: "block", color: "var(--muted)", fontSize: 11 }}>{e.by}</small>}
          </span>
          <span className="t mono">{e.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AccessDemoSection({ open, onClose, demo, real }) {
  const [tab, setTab] = useState("demo"); // "demo" | "real"

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    const prevOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const demoRows = demo?.rows || [];
  const realRows = real?.rows || [];
  const demoLocked = resolveLocked(demo);
  const realLocked = resolveLocked(real);
  const hasRealEvents = realRows.length > 0;

  return createPortal(
    <div className="dd-modal-backdrop" onClick={onClose}>
      <div
        className="dd-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Room activity"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dd-modal-head">
          <div>
            <h3>Room activity</h3>
            <span
              className="dd-mode"
              style={
                tab === "real"
                  ? { color: "var(--teal)", border: "1px solid var(--teal)", background: "rgba(0,184,148,0.12)" }
                  : { color: "var(--text)" }
              }
            >
              {tab === "real" ? "Live: your room" : "Demo"}
            </span>
          </div>
          <button type="button" className="dd-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="dd-modal-body">
          {/* Two options: Demo and Real */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={tab === "demo" ? "pill small" : "pill ghost small"}
              onClick={() => setTab("demo")}
            >
              Demo
            </button>
            <button
              type="button"
              className={tab === "real" ? "pill small" : "pill ghost small"}
              onClick={() => setTab("real")}
            >
              Real: your room{hasRealEvents ? " ●" : ""}
            </button>
          </div>

          {/* DEMO: drag the key onto the door reader */}
          {tab === "demo" && (
            <div className="card card-pad">
              <h4>What changes on each scan (demo)</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 10px" }}>
                Try it yourself: drag the key onto the door reader to lock or unlock the demo door.
              </p>
              <StateCards locked={demoLocked} />
              <h4 style={{ marginTop: 14 }}>Scan history (demo)</h4>
              <HistoryList
                rows={demoRows}
                emptyText="No scans yet. Drag the key onto the door reader to try it."
              />
            </div>
          )}

          {/* REAL: details appear only after your real door has locked or unlocked */}
          {tab === "real" && (
            <div className="card card-pad">
              <h4>Your room door (real)</h4>

              {!real ? (
                <p className="dd-log-empty" style={{ marginTop: 8 }}>
                  Your real room activity will show here once the owner approves your booking and you get your digital key.
                </p>
              ) : !hasRealEvents ? (
                <p className="dd-log-empty" style={{ marginTop: 8 }}>
                  No real lock or unlock yet. When your room door actually locks or unlocks, its status and history will appear here.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 10px" }}>
                    Real status of your room door, updated when it actually locks or unlocks.
                  </p>
                  <StateCards locked={realLocked} />
                  <h4 style={{ marginTop: 14 }}>Lock and unlock history</h4>
                  <HistoryList rows={realRows} emptyText="" />
                </>
              )}
            </div>
          )}

          <div className="dd-facts">
            <span className="dd-fact">🪪 Physical + digital key</span>
            <span className="dd-fact">⚡ Electricity included in rent</span>
            <span className="dd-fact">📱 Live status in the app</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}