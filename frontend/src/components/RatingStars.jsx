export default function RatingStars({ value, count }) {
  if (!value) {
    return <span className="rating-badge" style={{ background: "#8b8f9e" }}>New · no ratings yet</span>;
  }
  return (
    <span className="rating-badge">
      <span className="star">★</span> {value} <span style={{ opacity: 0.7, fontWeight: 400 }}>({count})</span>
    </span>
  );
}
