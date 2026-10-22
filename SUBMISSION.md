# Run the Plan C submission

This folder contains application source, static assets, configuration, lockfile, scripts and documentation. Dependencies, build output, secrets, installer downloads and local databases are excluded.

1. Copy `.env.local.example` to `.env.local` to enable the explicitly labelled simulation.
2. Install Node.js dependencies with `npm install` or `pnpm install`.
3. Run `npm run dev` or `pnpm dev`.
4. Open http://localhost:3000. Stop any other app using that port first.

Run `node scripts/test-plan-c.mjs` against the running local app to verify the simulation. This resets disposable demo state. Docker is not required for Plan C.

Real TideCloak authentication and QEA remain unverified due to the VRK initialization issue. See `docs/TIDE-INTEGRATION.md` for the integration plan and `docs/vrk-blocker.md` for the original diagnostics.
