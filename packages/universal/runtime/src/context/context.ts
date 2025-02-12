/**
 * An `AppContext` represents the context of a single "application" for a given
 * renderer.
 *
 * An application is a user-space concept that represents a root component and
 * the components that it renders. Its primary purpose is to facilitate
 * services: resources whose lifetime is scoped to the application.
 *
 * Services avoid using module state for app-wide concerns, which makes it
 * possible to have multiple instances of the same service in multiple apps on
 * the same page. This supports efficient acceptance testing and server-side
 * rendering, because it makes it possible to evaluate an app's *code* once and
 * then *instantiate* it multiple times.
 */
export class AppContext {
  #app: object | undefined;
  #singletons = new WeakMap<object, SingletonContext>();

  set app(app: object) {
    this.#app = app;
  }

  get app(): object {
    if (this.#app === undefined) {
      throw Error(
        "You are attempting to use a feature of Starbeam that depends on the application context, but no application context has been set."
      );
    }

    return this.#app;
  }

  hasApp(): boolean {
    return this.#app !== undefined;
  }

  create<Ret>(
    key: object,
    constructor: () => Ret,
    {
      app,
    }: {
      app?: object | undefined;
    } = {}
  ): Ret {
    return this.#appSingletons(app).create(key, constructor);
  }

  #appSingletons(app: object | undefined = this.app): SingletonContext {
    let singletons = this.#singletons.get(app);

    if (singletons === undefined) {
      singletons = new SingletonContext();
      this.#singletons.set(app, singletons);
    }

    return singletons;
  }
}

class SingletonContext {
  #instances = new WeakMap<object, object>();

  create<Ret>(key: object | undefined, constructor: () => Ret): Ret {
    if (key === undefined) {
      return constructor();
    }

    let existing = this.#instances.get(key) as Ret | undefined;

    if (existing === undefined) {
      existing = constructor();
      this.#instances.set(key, existing as object);
    }

    return existing;
  }
}

export const CONTEXT = new AppContext();
