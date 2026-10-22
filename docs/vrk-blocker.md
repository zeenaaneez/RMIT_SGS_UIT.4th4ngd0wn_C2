# Research Share — Milestone 1

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
