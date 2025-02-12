import type { DebugRuntime } from "@starbeam/interfaces";

import callerStack from "./call-stack/debug/index.js";
import {
  describe,
  describeTagged,
  getUserFacing,
} from "./description/debug/describe.js";
import Desc from "./description/debug/index.js";

const untrackedReadBarrier = (() => {
  /* FIXME: do nothing for now */
}) satisfies DebugRuntime["untrackedReadBarrier"];

export default {
  Desc,
  callerStack,
  getUserFacing,
  untrackedReadBarrier,
  describe,
  describeTagged,
} satisfies DebugRuntime;
