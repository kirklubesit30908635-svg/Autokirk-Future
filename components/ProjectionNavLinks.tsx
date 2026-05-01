import { useEffect } from "react";

type LinkedNavItem = {
  label: string;
  item: HTMLElement;
  destination: HTMLElement;
};

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

function setActiveNavItem(items: LinkedNavItem[], activeLabel: string) {
  for (const linked of items) {
    const isActive = linked.label === activeLabel;
    linked.item.dataset.activeProjection = String(isActive);
    linked.item.setAttribute("aria-current", isActive ? "location" : "false");
  }
}

function getClosestVisibleSection(items: LinkedNavItem[]): LinkedNavItem | null {
  const viewportAnchor = window.innerHeight * 0.28;
  let closest: LinkedNavItem | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const linked of items) {
    const rect = linked.destination.getBoundingClientRect();
    const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

    if (!isVisible) {
      continue;
    }

    const distance = Math.abs(rect.top - viewportAnchor);

    if (distance < closestDistance) {
      closest = linked;
      closestDistance = distance;
    }
  }

  return closest;
}

export function ProjectionNavLinks() {
  useEffect(() => {
    const navItems = Array.from(document.querySelectorAll<HTMLElement>(".navItem"));
    const linkedItems: LinkedNavItem[] = [];

    const cleanups = navItems.map((item) => {
      const label = item.textContent?.trim().toUpperCase() ?? "";
      const destination = findDestination(label);

      if (!destination) {
        item.setAttribute("aria-disabled", "true");
        return () => undefined;
      }

      linkedItems.push({ label, item, destination });
      item.setAttribute("role", "link");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", `Jump to ${label.toLowerCase()} results`);
      item.dataset.linkedProjection = "true";

      const handleOpen = () => {
        setActiveNavItem(linkedItems, label);
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

    const syncActiveSection = () => {
      const closest = getClosestVisibleSection(linkedItems);

      if (closest) {
        setActiveNavItem(linkedItems, closest.label);
      }
    };

    const observer = new IntersectionObserver(syncActiveSection, {
      root: null,
      rootMargin: "-18% 0px -58% 0px",
      threshold: [0, 0.15, 0.35, 0.6],
    });

    for (const linked of linkedItems) {
      observer.observe(linked.destination);
    }

    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
