import type { Section, FlatRow } from "./types";
import { COLUMNS } from "./constants";

export function flattenSections(sections: Section[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (let i = 0; i < sections.length; i++) {
    rows.push({ type: "header", sectionIndex: i });
    if (!sections[i].collapsed) {
      const cards = sections[i].cards;
      for (let j = 0; j < cards.length; j += COLUMNS) {
        rows.push({
          type: "cardRow",
          sectionIndex: i,
          cards: cards.slice(j, j + COLUMNS),
        });
      }
    }
  }
  return rows;
}
