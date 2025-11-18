const RatingStars: React.FC<{ value: number }> = ({ value }) => {
  return (
    <span className="detailPanelHistoryTab_rating">
      {"★".repeat(value).padEnd(3, "☆")}
    </span>
  );
};

export default RatingStars;