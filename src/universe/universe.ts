import type { anydom, minimal } from "@domtree/flavors";
import { CELLS, scopedCached, scopedReactive } from "../decorator/reactive";
import { ReactiveDOM } from "../dom";
import type { DomEnvironment } from "../dom/environment";
import { DOM, MINIMAL } from "../dom/streaming/compatible-dom";
import { TreeConstructor } from "../dom/streaming/tree-constructor";
import type { ContentProgramNode } from "../program-node/interfaces/program-node";
import type { RenderedContent } from "../program-node/interfaces/rendered-content";
import { Cell } from "../reactive/cell";
import type { AnyReactiveChoice } from "../reactive/choice";
import type { Reactive } from "../reactive/core";
import { Memo } from "../reactive/functions/memo";
import { Matcher, ReactiveMatch } from "../reactive/match";
import { InnerDict, ReactiveRecord } from "../reactive/record";
import { Static } from "../reactive/static";
import { verified } from "../strippable/assert";
import { is } from "../strippable/minimal";
import { expected } from "../strippable/verify-context";
import { Profile } from "./profile";
import { RenderedRoot } from "./root";
import { Timeline } from "./timeline";

export const TIMELINE = Symbol("TIMELINE");

export class Universe {
  /**
   * Create a new timeline in order to manage outputs using SimpleDOM. It's safe
   * to use SimpleDOM with the real DOM as long as you don't need runtime
   * features like event handlers and dynamic properties.
   */
  static environment(
    environment: DomEnvironment,
    profile = Profile.Debug
  ): Universe {
    return new Universe(environment, profile);
  }

  readonly #environment: DomEnvironment;
  readonly #profile: Profile;
  readonly #timeline = Timeline.create();

  readonly dom: ReactiveDOM = new ReactiveDOM();
  readonly reactive = scopedReactive(this.#timeline);
  readonly cached = scopedCached(this.#timeline);

  constructor(document: DomEnvironment, profile: Profile) {
    this.#environment = document;
    this.#profile = profile;
  }

  get<T extends object, K extends keyof T>(object: T, key: K): Reactive<T[K]> {
    let cell = CELLS.get(object, key);

    if (cell) {
      return cell as Reactive<T[K]>;
    }

    let descriptor = verified(
      getReactiveDescriptor(object, key),
      is.Present,
      expected(`the key passed to universe.get`)
        .toBe(`a property of the object`)
        .butGot(() => String(key))
    );

    if (descriptor.value) {
      return this.static(descriptor.value);
    } else {
      return this.memo(() => object[key]);
    }
  }

  cell<T>(value: T): Cell<T> {
    return Cell.create(value, this.#timeline);
  }

  /*
   * Create a memoized value that re-executes whenever any cells used in its
   * computation invalidate.
   */
  memo<T>(callback: () => T): Memo<T> {
    return Memo.create(callback, this.#timeline);
  }

  static<T>(value: T): Static<T> {
    return new Static(value);
  }

  match<C extends AnyReactiveChoice>(
    reactive: Reactive<C>,
    matcher: C extends infer ActualC
      ? ActualC extends AnyReactiveChoice
        ? Matcher<ActualC>
        : never
      : never
  ): ReactiveMatch<C, typeof matcher> {
    return ReactiveMatch.match(reactive, matcher);
  }

  record<T extends InnerDict>(dict: T): ReactiveRecord<T> {
    return new ReactiveRecord(dict);
  }

  render<R extends RenderedContent>(
    node: ContentProgramNode<R>,
    { append }: { append: anydom.ParentNode }
  ): RenderedRoot | null {
    let buffer = TreeConstructor.html(this.#environment);
    let content = node.render(buffer);

    if (content) {
      buffer.replace(this.#appending(append));

      return RenderedRoot.create({
        content,
        into: append as minimal.ParentNode,
      });
    }

    return null;
  }

  #appending(parent: anydom.ParentNode): minimal.TemplateElement {
    let placeholder = MINIMAL.element(
      this.#environment.document,
      parent as minimal.ParentNode,
      "template"
    );

    DOM.insert(placeholder, DOM.appending(parent));
    return placeholder;
  }
}

/**
 * The descriptor may be on the object itself, or it may be on the prototype (as a getter).
 */
function getReactiveDescriptor(
  object: object,
  key: PropertyKey
): PropertyDescriptor | null {
  let target = object;

  while (target) {
    let descriptor = Object.getOwnPropertyDescriptor(target, key);

    if (descriptor) {
      return descriptor;
    }

    target = Object.getPrototypeOf(target);
  }

  return null;
}