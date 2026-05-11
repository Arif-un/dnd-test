import { useDroppable } from "@dnd-kit/core";
import type { Section } from "../types";

export function DroppableHeader({
  section,
  sectionIndex,
  isDragActive,
  onToggle,
}: {
  section: Section;
  sectionIndex: number;
  isDragActive: boolean;
  onToggle: (idx: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `header-${sectionIndex}`,
    data: { type: "header", sectionIndex },
  });

  return (
    <div
      ref={setNodeRef}
      className={`section-header ${section.collapsed ? "collapsed" : ""} ${
        isDragActive ? "drop-zone-active" : ""
      } ${isOver ? "drop-zone-over" : ""}`}
      onClick={() => onToggle(sectionIndex)}
    >
      <div className="header-left">
        <span className="collapse-arrow">
          {section.collapsed ? "▶" : "▼"}
        </span>
        <span className="header-title">{section.title}</span>
        {section.collapsed && (
          <span className="item-count-badge">{section.cards.length}</span>
        )}
      </div>
      {isDragActive && <span className="drop-hint">Drop here</span>}
    </div>
  );
}
