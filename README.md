[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

Research Share helps research teams share unpublished documents with collaborators through jointly approved access.

Built with the official [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked) SDK; this Plan C prototype currently simulates authentication and governance.

### 1. Vision & originality

Research Share proposes a private research room where contributing teams share control over admitting readers. Collaboration can begin without placing the admission decision in one administrator’s hands.

### 2. Trust constraint insight

Sensitive findings are difficult to share when one administrator, or someone compromising their account, can grant access alone. Collective approval gives contributors an agreed process for deciding who can read their work.

### 3. Value & impact

University teams and external collaborators benefit. For example, a researcher can obtain an unpublished study’s methods to prepare a replication after the required reviewers approve access.

### 4. Why TideCloak matters

The intended integration uses TideCloak QEA to govern grants of the `research_reader` role. The document API verifies identity and permissions before returning content.

Tide MCP informed these integration boundaries. Sign-in, roles and quorum are currently simulated; real authentication and QEA remain unverified because VRK initialization failed.

### 5. Prototype & storytelling

A reader opens a synthetic research brief and receives 403. One approval cannot commit access. Two distinct demo approvers approve, then commit. The reader’s existing session remains blocked until refreshed; the document then opens.

This demonstrates the intended experience, with every simulated step labelled.

## Setup

Requires Node.js 24 and npm.

1. Copy `.env.local.example` to `.env.local` to enable simulation.
2. Run `npm install`, then `npm run dev`.
3. Open [localhost:3000](http://localhost:3000).

Docker is unnecessary for Plan C. Run `node scripts/test-plan-c.mjs` against the running app to verify the demo; this resets demo state.

