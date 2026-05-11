import { useState, useCallback, useMemo, useEffect } from "react";
import { generateSections } from "./data";
import type { Section } from "./types";
import { SortModal } from "./components/SortModal";
import "./App.css";

const IMAGES_PER_PAGE = 20;

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

export default function App() {
  const [sections, setSections] = useState<Section[]>(generateSections);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const handleApply = useCallback((updatedSections: Section[]) => {
    setSections(updatedSections);
    setIsModalOpen(false);
  }, []);

  const pageCards = useMemo(() => {
    const start = (currentPage - 1) * IMAGES_PER_PAGE;
    const allCards = sections.flatMap((s) => s.cards);
    return allCards.slice(start, start + IMAGES_PER_PAGE);
  }, [sections, currentPage]);

  const totalPages = Math.ceil(
    sections.reduce((sum, s) => sum + s.cards.length, 0) / IMAGES_PER_PAGE
  );

  return (
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
          <div key={card.id} className="gallery-card">
            <img
              src={card.imageUrl}
              alt={card.id}
              loading="lazy"
            />
            <span className="gallery-badge">#{card.id.replace("card-", "")}</span>
          </div>
        ))}
      </main>

      <footer className="page-footer">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </footer>

      {isModalOpen && (
        <SortModal
          sections={sections}
          onApply={handleApply}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
