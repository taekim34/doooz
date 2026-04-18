import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressTrack } from "./progress-track";

describe("ProgressTrack", () => {
  it("renders with role=progressbar and correct aria values", () => {
    render(<ProgressTrack value={50} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps values below 0 to 0", () => {
    render(<ProgressTrack value={-20} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("clamps values above 100 to 100", () => {
    render(<ProgressTrack value={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("renders fill with inline style width matching value", () => {
    const { container } = render(<ProgressTrack value={33} />);
    const fill = container.querySelector("[data-fill]") as HTMLElement;
    expect(fill.style.width).toBe("33%");
  });

  it("applies 'sm' height class when size='sm'", () => {
    const { container } = render(<ProgressTrack value={50} size="sm" />);
    const track = container.firstChild as HTMLElement;
    expect(track.className).toMatch(/h-/);
  });
});
