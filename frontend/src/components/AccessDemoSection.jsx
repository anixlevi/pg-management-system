import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Preview (modal) with the room status explainer + lock/unlock history.
 * Opened from the Track button under the hero text. Close with the x, a click outside, or Esc.
 * Data comes from useDoorAccess: { live, locked, rows }.
 */
export default function AccessDemoSection({ open, onClose, locked, live, rows = [] }) {
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
            <span className={`dd-mode ${live ? "live" : ""}`}>{live ? "Live: your room" : "Demo"}</span>
          </div>
          <button type="button" className="dd-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="dd-modal-body">
          <div className="card card-pad">
            <h4>What changes on each scan</h4>
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
          </div>

          <div className="card card-pad">
            <h4>{live ? "Lock and unlock history" : "Scan history (demo)"}</h4>
            {rows.length === 0 ? (
              <p className="dd-log-empty">
                {live
                  ? "No lock or unlock events recorded for your room yet."
                  : "No scans yet. Drag the key onto the door reader to try it."}
              </p>
            ) : (
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
            )}
          </div>

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