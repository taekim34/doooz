"use client";
import * as React from "react";

type HeaderSlots = {
  /** Center area — typically streak badge, page title, or empty. */
  center?: React.ReactNode;
  /** Right slot — typically bell, settings gear, or empty. */
  right?: React.ReactNode;
  /** Hide the entire mobile floating header for this page. */
  hidden?: boolean;
};

type Ctx = {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  slots: HeaderSlots;
  setSlots: (s: HeaderSlots) => void;
};

const MobileNavContext = React.createContext<Ctx | null>(null);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [slots, setSlots] = React.useState<HeaderSlots>({});
  const value = React.useMemo<Ctx>(
    () => ({
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      toggleDrawer: () => setDrawerOpen((v) => !v),
      slots,
      setSlots,
    }),
    [drawerOpen, slots],
  );
  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const ctx = React.useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used inside MobileNavProvider");
  return ctx;
}

/**
 * Per-page hook to populate the mobile floating header center/right slots.
 * Call from a client component during render; cleared on unmount.
 */
export function useFloatingHeader(slots: HeaderSlots) {
  const { setSlots } = useMobileNav();
  // Stringify dependencies so callers don't need to memoize ReactNode trees.
  const key = React.useMemo(
    () => JSON.stringify({ hidden: slots.hidden, hasCenter: !!slots.center, hasRight: !!slots.right }),
    [slots.hidden, slots.center, slots.right],
  );
  React.useEffect(() => {
    setSlots(slots);
    return () => setSlots({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setSlots]);
}
