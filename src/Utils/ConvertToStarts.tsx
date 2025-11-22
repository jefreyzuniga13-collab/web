const RatingStars: React.FC<{ value: number }> = ({ value }) => {
  return (
    <span className="detailPanelHistoryTab_rating">
      {"★".repeat(3 - value + 1).padEnd(3, "☆")}
    </span>
  );
};

export default RatingStars;