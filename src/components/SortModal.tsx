import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { List, useListRef } from "react-window";
import type { Section, BoundaryDrop } from "../types";
import {
  HEADER_HEIGHT,
  COLLAPSED_HEIGHT,
  CARD_ROW_HEIGHT,
  AUTO_SCROLL_ZONE,
  AUTO_SCROLL_MAX_SPEED,
} from "../constants";
import { flattenSections } from "../utils";
import { VirtualRow } from "./VirtualRow";
import { OverlayCard } from "./OverlayCard";
import { BoundaryPopover } from "./BoundaryPopover";

export function SortModal({
  sections: initialSections,
  onApply,
  onClose,
}: {
  sections: Section[];
  onApply: (sections: Section[]) => void;
  onClose: () => void;
}) {
  const [sections, setSections] = useState<Section[]>(() =>
    initialSections.map((s) => ({ ...s, cards: [...s.cards] }))
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activePage, setActivePage] = useState("");
  const [boundaryDrop, setBoundaryDrop] = useState<BoundaryDrop | null>(null);
  const listRef = useListRef(null);
  const autoScrollRef = useRef<number>(0);
  const dragYRef = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const flatRows = useMemo(() => flattenSections(sections), [sections]);

  const getRowHeight = useCallback(
    (index: number) => {
      const row = flatRows[index];
      if (row.type === "header") {
        return sections[row.sectionIndex].collapsed
          ? COLLAPSED_HEIGHT
          : HEADER_HEIGHT;
      }
      return CARD_ROW_HEIGHT;
    },
    [flatRows, sections]
  );

  const activeCard = useMemo(() => {
    if (!activeId) return null;
    for (const section of sections) {
      const card = section.cards.find((c) => c.id === activeId);
      if (card) return card;
    }
    return null;
  }, [activeId, sections]);

  const findCardSection = useCallback(
    (cardId: UniqueIdentifier): number => {
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].cards.some((c) => c.id === cardId)) return i;
      }
      return -1;
    },
    [sections]
  );

  const getSectionAtY = useCallback(
    (y: number): number => {
      const el = listRef.current?.element;
      if (!el) return 0;
      const scrollTop = el.scrollTop;
      const relativeY = y - el.getBoundingClientRect().top + scrollTop;
      let accum = 0;
      let lastSection = 0;
      for (let i = 0; i < flatRows.length; i++) {
        const h = getRowHeight(i);
        if (flatRows[i].type === "header")
          lastSection = flatRows[i].sectionIndex;
        if (accum + h > relativeY) return lastSection;
        accum += h;
      }
      return lastSection;
    },
    [flatRows, getRowHeight, listRef]
  );

  const isBetweenSections = useCallback(
    (y: number): { above: number; below: number } | null => {
      const el = listRef.current?.element;
      if (!el) return null;
      const scrollTop = el.scrollTop;
      const relativeY = y - el.getBoundingClientRect().top + scrollTop;
      let accum = 0;
      for (let i = 0; i < flatRows.length; i++) {
        const h = getRowHeight(i);
        if (flatRows[i].type === "header" && i > 0) {
          const boundary = accum;
          if (Math.abs(relativeY - boundary) < 24) {
            const above = flatRows[i].sectionIndex - 1;
            const below = flatRows[i].sectionIndex;
            if (above >= 0) return { above, below };
          }
        }
        accum += h;
      }
      return null;
    },
    [flatRows, getRowHeight, listRef]
  );

  useEffect(() => {
    if (!activeId) {
      cancelAnimationFrame(autoScrollRef.current);
      return;
    }

    const tick = () => {
      const el = listRef.current?.element;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = dragYRef.current;
      const topDist = y - rect.top;
      const bottomDist = rect.bottom - y;

      if (topDist < AUTO_SCROLL_ZONE && topDist > 0) {
        const speed =
          (1 - topDist / AUTO_SCROLL_ZONE) * AUTO_SCROLL_MAX_SPEED;
        el.scrollTop -= speed;
      } else if (bottomDist < AUTO_SCROLL_ZONE && bottomDist > 0) {
        const speed =
          (1 - bottomDist / AUTO_SCROLL_ZONE) * AUTO_SCROLL_MAX_SPEED;
        el.scrollTop += speed;
      }
      autoScrollRef.current = requestAnimationFrame(tick);
    };

    autoScrollRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(autoScrollRef.current);
  }, [activeId, listRef]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id);
      setBoundaryDrop(null);
      const sectionIdx = findCardSection(event.active.id);
      setActivePage(sections[sectionIdx]?.title ?? "");
    },
    [findCardSection, sections]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!event.activatorEvent || !("clientY" in event.activatorEvent))
        return;
      const baseY = (event.activatorEvent as PointerEvent).clientY;
      const currentY = baseY + (event.delta?.y ?? 0);
      dragYRef.current = currentY;

      const sectionIdx = getSectionAtY(currentY);
      setActivePage(sections[sectionIdx]?.title ?? "");
    },
    [getSectionAtY, sections]
  );

  const moveCard = useCallback(
    (
      cardId: UniqueIdentifier,
      toSection: number,
      position: "start" | "end"
    ) => {
      setSections((prev) => {
        const card = prev
          .flatMap((s) => s.cards)
          .find((c) => c.id === cardId);
        if (!card) return prev;
        const next = prev.map((s) => ({
          ...s,
          cards: s.cards.filter((c) => c.id !== cardId),
        }));
        const updated = { ...card, sectionIndex: toSection };
        if (position === "start") {
          next[toSection] = {
            ...next[toSection],
            cards: [updated, ...next[toSection].cards],
          };
        } else {
          next[toSection] = {
            ...next[toSection],
            cards: [...next[toSection].cards, updated],
          };
        }
        return next;
      });
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over) {
        const overData = over.data.current;
        if (overData?.type === "header") {
          moveCard(active.id, overData.sectionIndex, "start");
          return;
        }
      }

      const baseY =
        (event.activatorEvent as PointerEvent)?.clientY ?? 0;
      const currentY = baseY + (event.delta?.y ?? 0);
      const currentX =
        ((event.activatorEvent as PointerEvent)?.clientX ?? 0) +
        (event.delta?.x ?? 0);
      const boundary = isBetweenSections(currentY);
      if (boundary) {
        setBoundaryDrop({
          x: currentX,
          y: currentY,
          aboveSectionIndex: boundary.above,
          belowSectionIndex: boundary.below,
          cardId: active.id as string,
        });
      }
    },
    [isBetweenSections, moveCard]
  );

  const handleBoundaryChoice = useCallback(
    (sectionIndex: number, position: "end" | "start") => {
      if (!boundaryDrop) return;
      moveCard(boundaryDrop.cardId, sectionIndex, position);
      setBoundaryDrop(null);
    },
    [boundaryDrop, moveCard]
  );

  const toggleSection = useCallback((idx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, collapsed: !s.collapsed } : s
      )
    );
  }, []);

  const rowProps = useMemo(
    () => ({
      flatRows,
      sections,
      activeId,
      isDragActive: activeId !== null,
      onToggle: toggleSection,
    }),
    [flatRows, sections, activeId, toggleSection]
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Sort Pages</h2>
          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-primary"
              onClick={() => onApply(sections)}
            >
              Apply
            </button>
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        <div className="modal-body">
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div className="list-container">
              <List
                listRef={listRef}
                rowCount={flatRows.length}
                rowHeight={(index: number) => getRowHeight(index)}
                rowComponent={VirtualRow}
                rowProps={rowProps}
                style={{ height: "100%", width: "100%" }}
                overscanCount={4}
              />
            </div>
            <DragOverlay dropAnimation={null}>
              {activeCard ? (
                <OverlayCard card={activeCard} fromPage={activePage} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
        {boundaryDrop && (
          <BoundaryPopover
            drop={boundaryDrop}
            sections={sections}
            onChoice={handleBoundaryChoice}
            onDismiss={() => setBoundaryDrop(null)}
          />
        )}
      </div>
    </div>
  );
}
