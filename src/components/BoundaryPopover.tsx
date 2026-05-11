import type { Section, BoundaryDrop } from "../types";

export function BoundaryPopover({
  drop,
  sections,
  onChoice,
  onDismiss,
}: {
  drop: BoundaryDrop;
  sections: Section[];
  onChoice: (sectionIndex: number, position: "end" | "start") => void;
  onDismiss: () => void;
}) {
  return (
    <>
      <div className="popover-backdrop" onClick={onDismiss} />
      <div
        className="boundary-popover"
        style={{ top: drop.y - 40, left: drop.x }}
      >
        <button
          type="button"
          onClick={() => {
            onChoice(drop.aboveSectionIndex, "end");
            onDismiss();
          }}
        >
          End of {sections[drop.aboveSectionIndex].title}
        </button>
        <span className="popover-divider">or</span>
        <button
          type="button"
          onClick={() => {
            onChoice(drop.belowSectionIndex, "start");
            onDismiss();
          }}
        >
          Start of {sections[drop.belowSectionIndex].title}
        </button>
      </div>
    </>
  );
}
