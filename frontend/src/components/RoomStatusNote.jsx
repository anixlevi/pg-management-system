/**
 * Note card beside the door. It follows the door in two ways:
 *  - locked / unlocked: what the current state means for the room
 *  - phase (what the door is doing right now): dragging, over the reader, scanning, or an error
 */
const STATES = {
  locked: {
    icon: "🔒",
    title: "Room locked",
    main: "Electricity is cut off for your room. Your room is inaccessible without your key.",
    tips: [
      "Scan your key card at the reader to unlock.",
      "Lights, fan and chargers stay off until you unlock.",
      "Lost your key? Tell the owner or warden so it can be disabled.",
    ],
    quote: "Locked up, powered down. Nothing runs without your key.",
  },
  unlocked: {
    icon: "🔓",
    title: "Room unlocked",
    main: "Electricity is on. Save power: switch off lights, fan and chargers you don't need.",
    tips: [
      "To lock, scan your card at the reader again. The reader must show Locked.",
      "Close the door behind you before you scan.",
      "Leaving the room? Lock it so electricity to your room is cut.",
    ],
    quote: "A locked door is a saved unit. Scan out when you leave.",
  },
};

function getNote(locked, phase) {
  const action = locked ? "unlock" : "lock";
  switch (phase) {
    case "dragging":
      return {
        icon: "🪪",
        title: "Key in hand",
        main: `Drag the key onto the reader beside the door to ${action} your room.`,
        tips: ["A white border on the reader means you're close enough to drop."],
      };
    case "over":
      return {
        icon: "📍",
        title: "Release to scan",
        main: `Let go now and the reader will ${action} your room.`,
        tips: ["The reader takes a moment to check your key."],
      };
    case "scanning":
      return {
        icon: "⏳",
        title: "Scanning your key…",
        main: `The reader is checking your key. Your room will ${action} in a moment.`,
        tips: [
          locked
            ? "Electricity switches on as soon as the door unlocks."
            : "Electricity is cut as soon as the door locks.",
        ],
      };
    case "error":
      return {
        icon: "⚠️",
        title: "Couldn't reach the lock",
        main: `Nothing changed. Your room is still ${locked ? "locked" : "unlocked"}.`,
        tips: ["Check your connection and drag the key onto the reader again."],
      };
    default:
      return locked ? STATES.locked : STATES.unlocked;
  }
}

export default function RoomStatusNote({ locked, phase = "idle" }) {
  const n = getNote(locked, phase);
  return (
    <aside className={`dd-note ${locked ? "dd-note--locked" : "dd-note--unlocked"}`} aria-live="polite">
      {/* key re-mounts the content on every change so the swap animates */}
      <div key={`${locked ? "locked" : "unlocked"}-${phase}`} className="dd-note-inner">
        <div className="dd-note-head">
          <span className="dd-note-icon">{n.icon}</span>
          <strong>{n.title}</strong>
        </div>
        <p className="dd-note-main">{n.main}</p>
        {n.tips?.length > 0 && (
          <ul className="dd-note-tips">
            {n.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        {n.quote && <p className="dd-note-quote">“{n.quote}”</p>}
      </div>
    </aside>
  );
}