import type { UniqueIdentifier } from "@dnd-kit/core";
import type { RowComponentProps } from "react-window";
import type { FlatRow, Section } from "../types";
import { DraggableCard } from "./DraggableCard";
import { DroppableHeader } from "./DroppableHeader";

export interface VirtualRowProps {
  flatRows: FlatRow[];
  sections: Section[];
  activeId: UniqueIdentifier | null;
  isDragActive: boolean;
  onToggle: (idx: number) => void;
}

export function VirtualRow({
  index,
  style,
  flatRows,
  sections,
  activeId,
  isDragActive,
  onToggle,
}: RowComponentProps<VirtualRowProps>) {
  const row = flatRows[index];

  if (row.type === "header") {
    return (
      <div style={style}>
        <DroppableHeader
          section={sections[row.sectionIndex]}
          sectionIndex={row.sectionIndex}
          isDragActive={isDragActive}
          onToggle={onToggle}
        />
      </div>
    );
  }

  return (
    <div style={style} className="card-row">
      {row.cards?.map((card) => (
        <DraggableCard
          key={card.id}
          card={card}
          isDragging={activeId === card.id}
        />
      ))}
    </div>
  );
}
