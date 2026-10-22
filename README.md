# Research Share — Plan C

Research Share lets researchers share a private research brief with collaborators while requiring shared approval before new readers gain access.

**Current implementation: an explicitly labelled local simulation. Real TideCloak authentication and QEA are not working yet.** The user authorized hackathon Plan C after the original TideCloak VRK setup failed. The original app integration, realm and persistent database are retained.

## Project overview

- **Idea:** A small research room where an outside collaborator reads a synthetic unpublished brief after a jointly approved access grant.
- **Trust constraint:** Teams must otherwise trust a single administrator's authority to admit readers. Shared approval can make collaboration more acceptable to the contributors.
- **Value:** A collaborator can obtain the methods needed for a replication study through an agreed review process.
- **Why Tide matters:** The intended real integration uses QEA to govern the research_reader role grant and verifies tokens, DPoP and roles at the document API. Plan C currently simulates those transitions; ordinary application logic controls the demo identities and votes.
- **Demo:** A reader gets 403. One approval cannot commit the grant. Two distinct demo approvals plus commit update the role store. The reader's old session still gets 403; refresh or re-login makes it 200.

## Run Plan C

Dependencies are already installed in this workspace. Node.js is available through Codex's bundled runtime; npm is not on this machine's PATH.

The local .env.local contains AUTH_MODE=simulation. For another checkout, create it with that exact line, then install dependencies with pnpm install (or npm install) and run:

```powershell
node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1
```

Open http://localhost:3000. Docker and a working VRK are not needed for Plan C. Never use the simulation with real research data or expose it publicly.

## Try the demo

1. Choose Người đọc, optionally enter a display name, and sign in. Click Thử mở nghiên cứu: 403.
2. Choose Mai · Người duyệt A and sign in. Propose the grant, then approve it. Try commit: 409 and no role change.
3. Choose An · Người duyệt B and sign in. Approve, then commit. Two approvals without commit do not grant access.
4. Sign in as Người đọc again (fresh role snapshot). Open the research brief: 200.
5. Log out. Direct /api/document access returns 401.

For the stale-session demonstration, keep Người đọc in a separate private browser window, and use the regular window for Mai/An. After commit, the old reader session remains 403 until Làm mới phiên is clicked. Use the same hostname throughout; localhost and 127.0.0.1 have separate cookies.

Mai or An can expand Kiểm tra phiên cũ và bắt đầu lại and select Reset demo. This clears only data/simulation/state.json and invalidates demo sessions; it does not touch the live realm, VRK, licence or H2 database. Demo state otherwise persists across server restarts.

## Verification

```powershell
node scripts/test-plan-c.mjs
node node_modules/next/dist/bin/next build --webpack
```

The integration script uses separate cookie jars for reader and approvers. It checks sign-in/logout, 401/403, ignored browser-supplied roles, distinct approvals, duplicate-vote rejection, premature commit rejection, ready-but-uncommitted denial, stale session denial, refresh success, protected document response, approver-without-reader denial, reset and cross-origin rejection. It resets disposable demo state; do not run it during a presentation.

To check mode separation, run a temporary real-mode server on a free local port with AUTH_MODE=tidecloak, then run scripts/check-auth-boundary.mjs (default http://localhost:3001). A missing real adapter must show setup pending and reject fake/demo credentials.

[Tide integration plan](docs/TIDE-INTEGRATION.md) maps every simulated boundary to real TideCloak and records MCP guidance. [Original VRK diagnostics](docs/vrk-blocker.md) preserve the setup blocker. No fake adapter or key was created.

---

## Historical real integration setup — Milestone 1

Next.js + TypeScript, built from Tide MCP Agent Pack 1.9.33's official Next.js template.

## Current status

The website can display an honest setup-pending page. Real authentication is wired but NOT verified: TideCloak initial vendor-key provisioning failed. No mock authentication or document feature is implemented.

- App: http://localhost:3000
- Tide Console: http://localhost:8080/realms/research-share/tide-console/
- Realm/client: research-share / research-share-client
- Docker: research-share-tidecloak, only 127.0.0.1:8080
- Persistent H2 data: data/h2 (do not delete)
- Secrets: .env, ignored by Git. Never share it or container environment dumps.
- Real adapter destination: data/tidecloak.json, ignored by Git; currently absent.
- User preferences: keep Tide branding; optional display name only, stored as firstName via the user's Account API and DPoP secureFetch.

## Run

With Node.js and dependencies available:

```powershell
docker compose up -d
node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1
```

Production check: `node node_modules/next/dist/bin/next build --webpack`.

This machine currently uses Codex's bundled Node and pnpm; npm is not on PATH. Docker's bin directory may need a new terminal after installation.

## Blocking issue — 2026-10-22

Initial `setUpTideRealm` returned HTTP 500, TIDE-IDPEXT-VENDOR-KEYGEN_FAILED.
Server log: Midgard.FinalizeWallet returned upstream HTTP 500.
Read-back: licence expiry is in the future and isPendingLicenseActive=true, but pendingGVRK is unsigned; active gVRK, vvkId and certificates are absent.
IGA is enabled and iga.attestor=tide. Bootstrap adopt requests remain pending.
The official Console Sign VRK action (force-rotate-vrk) also returned HTTP 500: NullPointerException in ModelRequest.ToString / Midgard.SignModel / MANUAL_SignNewVRK.
Adapter export returns HTTP 500 because KeyWrapper.getPublicKey() is null.

Image digest: tideorg/tidecloak-dev@sha256:3f52d0bc3e4e3ae5153e172960003bbe94705cd40af6561fd4c7c4434aaa2708

Bootstrap was stopped. Do not toggle IGA again, fabricate adapter keys, clear the database, or repeat setup blindly. The resume script now requires an active VRK as well as an active licence. A Tide maintainer must clarify safe recovery of the initial wallet/VRK state. No support message was sent.

After recovery: complete bootstrap, link the admin's real Tide account in the browser, export the adapter, run Tide doctor against the running site, test login/authenticated state/logout, and test the display-name save by reading it back. Do not start document access features until these pass.

## Template adjustments

Container lifecycle moved to compose.yaml; destructive cleanup removed from init. Both website and TideCloak bind only to loopback. Invite links are saved privately under work rather than printed. No default secrets. SDK versions resolved from npm and pinned. DPoP relay copied byte-for-byte and hash-checked. The account form uses secureFetch because DPoP is enabled. Template customer/demo routes removed.
