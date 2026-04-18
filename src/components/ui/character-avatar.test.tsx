import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CharacterAvatar } from "./character-avatar";

describe("CharacterAvatar", () => {
  it("renders an emoji for a known character id", () => {
    render(<CharacterAvatar characterId="fox" stage={1} size="hero" />);
    expect(screen.getByText(/🦊/)).toBeInTheDocument();
  });

  it("falls back to neutral emoji for unknown character id", () => {
    render(<CharacterAvatar characterId={null} stage={0} size="sm" />);
    const el = screen.getByRole("img", { hidden: true });
    expect(el).toBeInTheDocument();
  });

  it("applies hero size (78px) class", () => {
    const { container } = render(
      <CharacterAvatar characterId="bear" stage={1} size="hero" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/w-\[78px\]/);
    expect(el.className).toMatch(/h-\[78px\]/);
  });

  it("applies xs size (32px) class", () => {
    const { container } = render(
      <CharacterAvatar characterId="cat" stage={1} size="xs" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/w-8/);
    expect(el.className).toMatch(/h-8/);
  });

  it("applies -4deg rotation by default at hero size", () => {
    const { container } = render(
      <CharacterAvatar characterId="fox" stage={1} size="hero" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toBe("rotate(-4deg)");
  });

  it("no rotation at non-hero sizes by default", () => {
    const { container } = render(
      <CharacterAvatar characterId="fox" stage={1} size="sm" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toBe("");
  });

  it("accepts explicit rotate prop", () => {
    const { container } = render(
      <CharacterAvatar characterId="fox" stage={1} size="md" rotate={6} />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toBe("rotate(6deg)");
  });

  it("same characterId yields same gradient (deterministic)", () => {
    const { container: a } = render(<CharacterAvatar characterId="fox" stage={1} size="hero" />);
    const { container: b } = render(<CharacterAvatar characterId="fox" stage={1} size="hero" />);
    const aBg = (a.firstChild as HTMLElement).style.backgroundImage;
    const bBg = (b.firstChild as HTMLElement).style.backgroundImage;
    expect(aBg).toBe(bBg);
    expect(aBg).toMatch(/gradient/i);
  });
});
