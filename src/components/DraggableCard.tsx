import { useDraggable } from "@dnd-kit/core";
import type { Card } from "../types";

function GripIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 14 14"
      fill="currentColor"
      className="grip-icon"
    >
      <circle cx="4" cy="3" r="1.5" />
      <circle cx="10" cy="3" r="1.5" />
      <circle cx="4" cy="7" r="1.5" />
      <circle cx="10" cy="7" r="1.5" />
      <circle cx="4" cy="11" r="1.5" />
      <circle cx="10" cy="11" r="1.5" />
    </svg>
  );
}

export function DraggableCard({
  card,
  isDragging,
}: {
  card: Card;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: card.id,
    data: { card },
  });

  return (
    <div
      ref={setNodeRef}
      className={`card ${isDragging ? "card-dragging" : ""}`}
      {...attributes}
      {...listeners}
    >
      <span className="card-badge">{card.id.replace("card-", "#")}</span>
      <div className="card-grip">
        <GripIcon />
      </div>
      <img src={card.imageUrl} alt={card.id} loading="lazy" />
    </div>
  );
}
