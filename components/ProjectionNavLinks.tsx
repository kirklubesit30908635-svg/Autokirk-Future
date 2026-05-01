import { useEffect } from "react";

const targetByLabel: Record<string, string> = {
  KERNEL: ".proofPanel",
  OBLIGATIONS: '[data-nav-target="obligations"], .streamSection:nth-of-type(2)',
  RECEIPTS: '[data-nav-target="receipts"], .streamSection:nth-of-type(3)',
  FAILURES: '[data-nav-target="failures"], .streamSection:nth-of-type(4)',
  WATCHDOG: '[data-nav-target="watchdog"], .streamSection:nth-of-type(5)',
};

function findSectionByHeading(label: string): HTMLElement | null {
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".sectionTitle, .sectionLabel, .noticeLabel, .recordEyebrow"
    )
  );

  const heading = headings.find((node) =>
    node.textContent?.trim().toUpperCase().includes(label)
  );

  return heading?.closest("section, article, .proofPanel, .streamSection, .servicePanel") ?? null;
}

function findDestination(label: string): HTMLElement | null {
  const explicitTarget = targetByLabel[label];
  const explicitElement = explicitTarget
    ? document.querySelector<HTMLElement>(explicitTarget)
    : null;

  if (explicitElement) {
    return explicitElement;
  }

  return findSectionByHeading(label);
}

export function ProjectionNavLinks() {
  useEffect(() => {
    const navItems = Array.from(document.querySelectorAll<HTMLElement>(".navItem"));

    const cleanups = navItems.map((item) => {
      const label = item.textContent?.trim().toUpperCase() ?? "";
      const destination = findDestination(label);

      if (!destination) {
        item.setAttribute("aria-disabled", "true");
        return () => undefined;
      }

      item.setAttribute("role", "link");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", `Jump to ${label.toLowerCase()} results`);
      item.dataset.linkedProjection = "true";

      const handleOpen = () => {
        destination.scrollIntoView({ behavior: "smooth", block: "start" });
        destination.classList.add("projectionNavTargetActive");
        window.setTimeout(() => {
          destination.classList.remove("projectionNavTargetActive");
        }, 1400);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      };

      item.addEventListener("click", handleOpen);
      item.addEventListener("keydown", handleKeyDown);

      return () => {
        item.removeEventListener("click", handleOpen);
        item.removeEventListener("keydown", handleKeyDown);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
