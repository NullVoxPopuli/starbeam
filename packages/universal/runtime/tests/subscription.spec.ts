import { CachedFormula, Cell } from "@starbeam/reactive";
import { render } from "@starbeam/runtime";
import { describe, expect, test } from "vitest";

describe("formula rendering", () => {
  test("rendering before first consumption", () => {
    const cell = Cell("Tom Dale");

    const formula = CachedFormula(() => cell.current);

    let stale = false;
    render(formula, () => {
      stale = true;
    });

    expect(stale).toBe(false);
    expect(formula.current).toBe("Tom Dale");
    expect(stale).toBe(false);

    cell.current = "Jerry Seinfeld";
    expect(stale).toBe(true);
    expect(formula.current).toBe("Jerry Seinfeld");
  });

  test("subscription after first consumption", () => {
    const cell = Cell("Tom Dale");

    const formula = CachedFormula(() => cell.current);

    let stale = false;

    expect(formula.read()).toBe("Tom Dale");

    const unsubscribe = render(formula, () => {
      stale = true;
    });

    // The pollable doesn't fire initially.
    expect(stale).toBe(false);

    // The pollable fires after the cell changes.
    cell.current = "Jerry Seinfeld";
    expect(stale).toBe(true);
    stale = false;

    expect(formula.current).toBe("Jerry Seinfeld");

    unsubscribe();

    cell.current = "J. Seinfeld";
    expect(stale).toBe(false);

    // The lack of a subscription doesn't make the value incorrect
    expect(formula.current).toBe("J. Seinfeld");
  });
});
