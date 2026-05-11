import type { Card } from "../types";

export function OverlayCard({
  card,
  fromPage,
}: {
  card: Card;
  fromPage: string;
}) {
  return (
    <div className="overlay-card">
      <div className="from-badge">From {fromPage}</div>
      <img src={card.imageUrl} alt={card.id} loading="lazy" />
    </div>
  );
}
