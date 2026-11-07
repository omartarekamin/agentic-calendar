"use client";

import { Descope } from "@descope/nextjs-sdk";
import { paths } from "@/lib/paths";

export function DescopeFlow() {
  return (
    <div className="descope-wrap mt-7">
      <Descope
        flowId="sign-up-or-in"
        autoFocus="skipFirstScreen"
        redirectAfterSuccess={paths.dashboard}
        onError={(event) => console.error("sign in failed", event.detail)}
      />
    </div>
  );
}
