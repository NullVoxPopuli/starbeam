import type {
  ReactiveInternals,
  StaticInternals,
  Timestamp,
} from "@starbeam/timeline";

export class StaticInternalsImpl implements ReactiveInternals {
  static create(description: string): StaticInternals {
    return new StaticInternalsImpl(description);
  }

  readonly type = "static";
  readonly #description: string;

  private constructor(description: string) {
    this.#description = description;
  }

  /** impl ReactiveInternals */
  get description(): string {
    return this.#description;
  }

  isUpdatedSince(timestamp: Timestamp): boolean {
    return false;
  }
}