export default function StarRatingInput({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="stars-input">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={n <= value ? "filled" : ""}
            onClick={() => onChange(n)}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
