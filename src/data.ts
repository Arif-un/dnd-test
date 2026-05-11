import type { Section } from "./types";

export function generateSections(): Section[] {
  return Array.from({ length: 200 }, (_, sectionIdx) => ({
    id: `section-${sectionIdx}`,
    title: `Page ${sectionIdx + 1}`,
    collapsed: true,
    cards: Array.from({ length: 20 }, (_, cardIdx) => {
      const globalId = sectionIdx * 20 + cardIdx;
      return {
        id: `card-${globalId}`,
        imageUrl: `https://picsum.photos/seed/${globalId}/200/150`,
        sectionIndex: sectionIdx,
      };
    }),
  }));
}
