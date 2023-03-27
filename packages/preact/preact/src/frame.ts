import { getLast } from "@starbeam/core-utils";
import type { Description } from "@starbeam/debug";
import type { Tag } from "@starbeam/interfaces";
import type { InternalComponent } from "@starbeam/preact-utils";
import {
  type Frame,
  PUBLIC_TIMELINE,
  RUNTIME,
  type Unsubscribe,
} from "@starbeam/runtime";
import { expected, isPresent, verify } from "@starbeam/verify";

type ActiveFrame = (() => Set<Tag>) | null;

export class ComponentFrame {
  #active: ActiveFrame;
  #frame: Frame | null;
  #subscription: Unsubscribe | null;

  static #frames = new WeakMap<InternalComponent, ComponentFrame>();
  static #stack: InternalComponent[] = [];

  static start(component: InternalComponent, description: Description): void {
    let frame = ComponentFrame.#frames.get(component);

    if (!frame) {
      frame = new ComponentFrame(null, null, null);
      ComponentFrame.#frames.set(component, frame);
    }

    ComponentFrame.#stack.push(component);
    frame.#start(description);
  }

  static isRenderingComponent(component: InternalComponent): boolean {
    const frame = ComponentFrame.#frames.get(component);

    return !!frame && frame.#active !== null;
  }

  static get current(): InternalComponent {
    const current = getLast(ComponentFrame.#stack);
    if (!current) {
      throw Error(
        "You are attempting to use a feature of Starbeam that depends on the current component, but no component is currently active."
      );
    }
    return current;
  }

  static end(component: InternalComponent, subscription?: () => void): Frame {
    const frame = ComponentFrame.#frames.get(component);

    verify(
      frame,
      isPresent,
      expected.when("in Preact's _diff hook").as("a tracking frame")
    );

    const end = frame.#end(subscription);
    ComponentFrame.#stack.pop();
    return end;
  }

  static unmount(component: InternalComponent): void {
    const frame = ComponentFrame.#frames.get(component);

    if (frame) {
      frame.#unmount();
    }
  }

  private constructor(
    frame: Frame | null,
    active: ActiveFrame,
    subscribed: Unsubscribe | null
  ) {
    this.#frame = frame;
    this.#active = active;
    this.#subscription = subscribed;
  }

  #start(description: Description): void {
    if (this.#frame) {
      this.#active = RUNTIME.autotracking.start();
      // this.#active = TIMELINE.frame.update(this.#frame);
    } else {
      this.#active = TIMELINE.frame.open({
        description,
      });
    }
  }

  #end(subscription: (() => void) | undefined): Frame {
    verify(
      this.#active,
      isPresent,
      expected.when("in preact's _diff hook").as("an active tracking frame")
    );

    const frame = (this.#frame = this.#active.finalize(null, TIMELINE).frame);

    this.#active = null;

    if (subscription) {
      this.#subscription = PUBLIC_TIMELINE.on.change(frame, subscription);
    }

    return frame;
  }

  #unmount(): void {
    if (this.#subscription) {
      this.#subscription();
      this.#subscription = null;
    }
  }
}
