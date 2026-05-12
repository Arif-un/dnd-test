import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  pointerWithin,
  MeasuringStrategy,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragMoveEvent } from "@dnd-kit/core";
import { generateSections } from "./data";
import type { Section, Card } from "./types";
import { SortModal } from "./components/SortModal";
import "./App.css";

const AUTO_SCROLL_EDGE = 80;
const AUTO_SCROLL_SPEED = 12;

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 3v10M4 13l-2.5-2.5M4 13l2.5-2.5M12 13V3M12 3L9.5 5.5M12 3l2.5 2.5" />
    </svg>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.hasAttribute("data-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 1Zm0 11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 12ZM1 8a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1A.5.5 0 0 1 1 8Zm11 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1A.5.5 0 0 1 12 8Zm-1.646-3.354a.5.5 0 0 1 0-.707l.707-.707a.5.5 0 1 1 .707.707l-.707.707a.5.5 0 0 1-.707 0ZM4.232 12.475a.5.5 0 0 1 0-.707l.707-.707a.5.5 0 1 1 .707.707l-.707.707a.5.5 0 0 1-.707 0Zm7.836-.707a.5.5 0 0 1-.707 0l-.707-.707a.5.5 0 0 1 .707-.707l.707.707a.5.5 0 0 1 0 .707ZM4.939 5.646a.5.5 0 0 1-.707 0l-.707-.707a.5.5 0 0 1 .707-.707l.707.707a.5.5 0 0 1 0 .707ZM8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.2 1.6a.5.5 0 0 1 .2.5A5 5 0 0 0 13.9 9.6a.5.5 0 0 1 .7.45 7 7 0 1 1-8.85-8.85.5.5 0 0 1 .45.4Z" />
        </svg>
      )}
    </button>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const items: (number | "...")[] = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    items.push(1);
    if (currentPage > 4) items.push("...");
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) items.push(i);
    if (currentPage < totalPages - 3) items.push("...");
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="pagination">
      <button
        type="button"
        className="page-btn page-arrow"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        &lsaquo;
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="page-ellipsis">&hellip;</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`page-btn${p === currentPage ? " page-active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className="page-btn page-arrow"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        &rsaquo;
      </button>
    </div>
  );
}

function PageDropTarget({ page, isCurrent }: { page: number; isCurrent: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `page-drop-${page}`,
    disabled: isCurrent,
    data: { page },
  });

  return (
    <div
      ref={setNodeRef}
      className={`page-drop-target${isCurrent ? " current-page" : ""}${isOver ? " drag-over" : ""}`}
    >
      {page}
    </div>
  );
}

function GalleryCard({ card, isDragging }: { card: Card; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: card.id,
    data: { card },
  });

  return (
    <div
      ref={setNodeRef}
      className={`gallery-card${isDragging ? " gallery-card-dragging" : ""}`}
      {...attributes}
      {...listeners}
    >
      <img src={card.imageUrl} alt={card.id} loading="lazy" />
      <span className="gallery-badge">#{card.id.replace("card-", "")}</span>
    </div>
  );
}

export default function App() {
  const [sections, setSections] = useState<Section[]>(generateSections);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draggingCard, setDraggingCard] = useState<Card | null>(null);

  const stripRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(0);
  const dragXRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleApply = useCallback((updatedSections: Section[]) => {
    setSections(updatedSections);
    setIsModalOpen(false);
  }, []);

  const pageCards = useMemo(() => {
    const section = sections[currentPage - 1];
    return section ? section.cards : [];
  }, [sections, currentPage]);

  const totalPages = sections.length;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = event.active.data.current?.card as Card | undefined;
    if (card) setDraggingCard(card);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const activator = event.activatorEvent as PointerEvent;
    const delta = event.delta;
    dragXRef.current = activator.clientX + delta.x;
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over, active } = event;
    const card = active.data.current?.card as Card | undefined;
    if (over && card) {
      const targetPage = over.data.current?.page as number | undefined;
      if (targetPage != null) {
        const targetSectionIndex = targetPage - 1;
        setSections((prev) => {
          const fromSectionIdx = prev.findIndex((s) =>
            s.cards.some((c) => c.id === card.id)
          );
          if (fromSectionIdx === -1) return prev;
          if (fromSectionIdx === targetSectionIndex) return prev;

          const next = prev.map((s) => ({
            ...s,
            cards: s.cards.filter((c) => c.id !== card.id),
          }));
          const updated = { ...card, sectionIndex: targetSectionIndex };
          next[targetSectionIndex] = {
            ...next[targetSectionIndex],
            cards: [...next[targetSectionIndex].cards, updated],
          };
          return next;
        });
      }
    }
    setDraggingCard(null);
  }, []);

  const handleDragCancel = useCallback(() => {
    setDraggingCard(null);
  }, []);

  useEffect(() => {
    if (!draggingCard) {
      cancelAnimationFrame(autoScrollRef.current);
      return;
    }

    const tick = () => {
      const el = stripRef.current;
      if (!el) {
        autoScrollRef.current = requestAnimationFrame(tick);
        return;
      }
      const rect = el.getBoundingClientRect();
      const x = dragXRef.current;
      const distFromLeft = x - rect.left;
      const distFromRight = rect.right - x;

      if (distFromLeft < AUTO_SCROLL_EDGE && distFromLeft > 0) {
        const speed = AUTO_SCROLL_SPEED * (1 - distFromLeft / AUTO_SCROLL_EDGE);
        el.scrollLeft -= speed;
      } else if (distFromRight < AUTO_SCROLL_EDGE && distFromRight > 0) {
        const speed = AUTO_SCROLL_SPEED * (1 - distFromRight / AUTO_SCROLL_EDGE);
        el.scrollLeft += speed;
      }
      autoScrollRef.current = requestAnimationFrame(tick);
    };

    autoScrollRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(autoScrollRef.current);
  }, [draggingCard]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="app">
        <header className="page-header">
          <h1 className="page-title">Photo Gallery</h1>
          <div className="page-toolbar">
            <div className="search-wrapper">
              <svg className="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="7" cy="7" r="5" />
                <path d="M11 11l3.5 3.5" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="sort-button"
              onClick={() => setIsModalOpen(true)}
            >
              <SortIcon />
              Rearrange
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="gallery-grid">
          {pageCards.map((card) => (
            <GalleryCard
              key={card.id}
              card={card}
              isDragging={draggingCard?.id === card.id}
            />
          ))}
        </main>

        <footer className="page-footer">
          {!draggingCard ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          ) : null}
        </footer>

        <div
          className={`pagination-expanded${draggingCard ? " pagination-expanded-visible" : ""}`}
        >
          <div className="pagination-expanded-label">Drop on a page</div>
          <div className="pagination-expanded-scroll" ref={stripRef}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PageDropTarget
                key={page}
                page={page}
                isCurrent={page === currentPage}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {draggingCard ? (
            <div className="gallery-drag-preview">
              <img src={draggingCard.imageUrl} alt={draggingCard.id} />
            </div>
          ) : null}
        </DragOverlay>

        {isModalOpen && (
          <SortModal
            sections={sections}
            onApply={handleApply}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </DndContext>
  );
}
