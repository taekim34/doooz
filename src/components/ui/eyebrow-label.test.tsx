import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EyebrowLabel } from "./eyebrow-label";

describe("EyebrowLabel", () => {
  it("renders children as uppercase with tracking", () => {
    render(<EyebrowLabel>ADVENTURER</EyebrowLabel>);
    const el = screen.getByText("ADVENTURER");
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/uppercase/);
    expect(el.className).toMatch(/tracking/);
  });

  it("uses 12px font size (eyebrow token)", () => {
    render(<EyebrowLabel>LABEL</EyebrowLabel>);
    const el = screen.getByText("LABEL");
    expect(el.className).toMatch(/text-\[12px\]/);
  });

  it("merges custom className", () => {
    render(<EyebrowLabel className="custom-x">X</EyebrowLabel>);
    const el = screen.getByText("X");
    expect(el.className).toMatch(/custom-x/);
  });
});
