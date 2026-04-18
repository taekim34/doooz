import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FadeUp } from "./fade-up";

describe("FadeUp", () => {
  it("renders children", () => {
    const { getByText } = render(<FadeUp>hello</FadeUp>);
    expect(getByText("hello")).toBeInTheDocument();
  });

  it("has initial hidden classes before intersection", () => {
    const { container } = render(<FadeUp>x</FadeUp>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/opacity-0/);
  });

  it("accepts delay prop as number and reflects it on style", () => {
    const { container } = render(<FadeUp delay={160}>x</FadeUp>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.animationDelay).toBe("160ms");
  });
});
