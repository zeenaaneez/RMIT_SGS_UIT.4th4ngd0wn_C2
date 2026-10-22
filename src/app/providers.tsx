"use client";

import { TideCloakProvider } from "@tidecloak/nextjs";
import type { ComponentProps } from "react";
import { ProfileOnboarding } from "@/components/ProfileOnboarding";

export type AdapterConfig = ComponentProps<typeof TideCloakProvider>["config"];

// Playbook: add-auth-nextjs-fresh Step 4a
// useDPoP goes inside config object (not as a separate JSX prop).
// Enables client-side DPoP proof generation (required for secureFetch).
export function Providers({ children, config }: { children: React.ReactNode; config: AdapterConfig }) {
  return (
    <TideCloakProvider
      config={{ ...config, useDPoP: { mode: "strict", alg: "ES256" } }}
    >
      {children}
      <ProfileOnboarding baseUrl={config["auth-server-url"]} realm={config.realm} />
    </TideCloakProvider>
  );
}
