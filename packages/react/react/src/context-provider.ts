import { RUNTIME } from "@starbeam/runtime";
import { useLifecycle } from "@starbeam/use-strict-lifecycle";
import type { FunctionComponent, PropsWithChildren } from "react";
import { createContext, createElement, useContext } from "react";

const StarbeamContext = createContext(null as null | ReactApp);

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyProps = PropsWithChildren<{}>;

export const Starbeam: FunctionComponent<EmptyProps> = ({ children }) => {
  const owner = useLifecycle().render<ReactApp>(({ on }, _, prev) => {
    const owner = prev ? ReactApp.reactivate(prev) : new ReactApp();

    on.cleanup(() => {
      owner.finalize();
    });

    return owner;
  });

  return createElement(StarbeamContext.Provider, {
    value: owner,
    children,
  });
};

export class ReactApp {
  static instance(owner: ReactApp): object {
    return owner.#instance;
  }

  static reactivate(owner: ReactApp): ReactApp {
    owner.#instance = {};
    return owner;
  }

  #instance = {};
  finalize(): void {
    RUNTIME.finalize(this.#instance);
    this.#instance = {};
  }
}

export function useStarbeamApp(options: {
  feature: string;
  allowMissing: true;
}): ReactApp | null;
export function useStarbeamApp(options: {
  feature: string;
  allowMissing?: false | undefined;
}): ReactApp;
export function useStarbeamApp({
  feature,
  allowMissing = false,
}: {
  feature: string;
  allowMissing?: boolean | undefined;
}): ReactApp | null {
  const app = useContext(StarbeamContext);

  if (app === null && !allowMissing) {
    missingApp(feature);
  }

  return app;
}

export function verifiedApp(app: ReactApp | null, feature: string): ReactApp {
  if (!app) missingApp(feature);
  return app;
}

export function missingApp(feature: string): never {
  throw Error(
    `You are attempting to use a feature of Starbeam (${feature}) that depends on the current app, but you didn't wrap your application in the \`Starbeam\` component.`
  );
}
