import { useEffect, useRef, useState } from "react";

/**
 * Drag-the-key door control.
 * Controlled component: the parent owns `locked` and performs the real change in `onToggle(nextLocked)`.
 * onToggle may be async. If it throws, the door stays as it was and an error is shown.
 */
export default function DoorDemo({
  locked,
  onToggle,
  live = false,
  keyCode = "RM-204-7F3A",
  roomLabel = "204",
  onPhase, // optional: called with "idle" | "dragging" | "over" | "scanning" | "error"
}) {
  const [dragging, setDragging] = useState(false);
  const [overReader, setOverReader] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // What the door is doing right now, so other parts of the page (the note card) can follow it
  const phase = scanning ? "scanning" : overReader ? "over" : dragging ? "dragging" : error ? "error" : "idle";
  useEffect(() => {
    onPhase?.(phase);
  }, [phase]); // eslint-disable-line

  const readerRef = useRef(null);
  const start = useRef({ x: 0, y: 0 });

  const hitReader = (cx, cy) => {
    const r = readerRef.current?.getBoundingClientRect();
    if (!r) return false;
    const pad = 24;
    return cx > r.left - pad && cx < r.right + pad && cy > r.top - pad && cy < r.bottom + pad;
  };

  const doScan = async () => {
    if (scanning) return;
    setScanning(true);
    setError("");
    try {
      // Wait for the real request AND a short scan animation
      await Promise.all([onToggle(!locked), new Promise((r) => setTimeout(r, 600))]);
    } catch (e) {
      // Show the real reason, so a missing route / auth problem is easy to spot
      const status = e?.response?.status;
      setError(
        e?.response?.data?.message ||
          (status === 404
            ? "Lock route not found on the server (404)."
            : status === 401 || status === 403
            ? `Not allowed to control this room (${status}).`
            : status
            ? `Server error (${status}). Try again.`
            : "Can't reach the server. Is the backend running?")
      );
    } finally {
      setScanning(false);
    }
  };

  const onDown = (e) => {
    if (scanning) return;
    setError("");
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  };
  const onMove = (e) => {
    if (!dragging) return;
    setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
    setOverReader(hitReader(e.clientX, e.clientY));
  };
  const onUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    const hit = hitReader(e.clientX, e.clientY);
    setOverReader(false);
    setPos({ x: 0, y: 0 });
    if (hit) doScan();
  };

  return (
    <div className="dd-wrap">
      <div className={`dd-stage ${locked ? "is-locked" : "is-unlocked"}`}>
        <div className="dd-wall" />
        <div className="dd-floor" />

        <div className="dd-slot">
          <div
            className={`dd-key ${dragging ? "is-dragging" : ""} ${scanning ? "is-busy" : ""}`}
            style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${dragging ? -4 : 0}deg)` }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            role="button"
            tabIndex={0}
            aria-label="Digital key card. Drag onto the door reader, or press Enter to scan."
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && doScan()}
          >
            <span className="dd-key-chip" />
            <small>Digital key</small>
            <strong className="mono">{keyCode}</strong>
          </div>
          <span className="dd-caption">Drag the key</span>
        </div>

        <div className="dd-door-frame">
          <div className="dd-doorway" />
          <div className="dd-door">
            <span className="dd-door-number mono">{roomLabel}</span>
            <span className="dd-door-handle" />
          </div>
        </div>

        <div className="dd-reader-col">
          <div
            ref={readerRef}
            className={`dd-reader ${overReader ? "is-hot" : ""} ${scanning ? "is-scanning" : ""}`}
          >
            <span className={`dd-led ${locked ? "off" : "on"}`} />
            <span className="dd-reader-icon">))</span>
            <span className="dd-scanline" />
          </div>
          <span className="dd-caption">Reader</span>
        </div>
      </div>

      <div className="dd-footer" aria-live="polite">
        <span className={`dd-mode ${live ? "live" : ""}`}>{live ? "Live: your room" : "Demo"}</span>
        <div className={`dd-pill ${locked ? "off" : "on"}`}>
          <small>Room</small>
          <strong>{locked ? "🔒 Locked" : "🔓 Unlocked"}</strong>
        </div>
        <div className={`dd-pill ${locked ? "off" : "on"}`}>
          <small>Electricity</small>
          <strong>{locked ? "⚡ Off" : "⚡ On"}</strong>
        </div>
        {error && <p className="dd-error">{error}</p>}
        {!error && <p className="dd-hint">{locked ? "Scan to unlock" : "Scan again to lock"}</p>}
      </div>
    </div>
  );
}