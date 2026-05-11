export interface Card {
  id: string;
  imageUrl: string;
  sectionIndex: number;
}

export interface Section {
  id: string;
  title: string;
  cards: Card[];
  collapsed: boolean;
}

export interface FlatRow {
  type: "header" | "cardRow";
  sectionIndex: number;
  cards?: Card[];
}

export interface BoundaryDrop {
  x: number;
  y: number;
  aboveSectionIndex: number;
  belowSectionIndex: number;
  cardId: string;
}
