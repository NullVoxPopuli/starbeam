import type { Description } from "@starbeam/interfaces";
import { DEBUG } from "@starbeam/reactive";
import { Cell } from "@starbeam/universal";
import { useMemo } from "preact/hooks";

export function create<T>(Reactive: () => T): T {
  return useMemo(Reactive, []);
}

export function createCell<T>(
  value: T,
  description?: string | Description | undefined
): Cell<T> {
  const desc = DEBUG?.Desc("cell", description, "createCell");
  return create(() => Cell(value, { description: desc }));
}
