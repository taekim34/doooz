import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LevelPill } from "./level-pill";

describe("LevelPill", () => {
  it("renders level with 'Lv' prefix", () => {
    render(<LevelPill level={12} />);
    expect(screen.getByText(/Lv\s*12/)).toBeInTheDocument();
  });

  it("renders level 1 edge case", () => {
    render(<LevelPill level={1} />);
    expect(screen.getByText(/Lv\s*1/)).toBeInTheDocument();
  });

  it("uses pill radius", () => {
    const { container } = render(<LevelPill level={5} />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/rounded-pill|rounded-full/);
  });

  it("applies tabular-nums for numeric alignment", () => {
    const { container } = render(<LevelPill level={5} />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-nums")).toBe("");
  });
});
