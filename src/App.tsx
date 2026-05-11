import { useState, useCallback } from "react";
import { generateSections } from "./data";
import type { Section } from "./types";
import { SortModal } from "./components/SortModal";
import "./App.css";

export default function App() {
  const [sections, setSections] = useState<Section[]>(generateSections);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleApply = useCallback((updatedSections: Section[]) => {
    setSections(updatedSections);
    setIsModalOpen(false);
  }, []);

  return (
    <div className="app">
      <button
        type="button"
        className="sort-button"
        onClick={() => setIsModalOpen(true)}
      >
        Sort
      </button>

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
