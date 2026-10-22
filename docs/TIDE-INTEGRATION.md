# Research Share — TideCloak integration plan (Plan C)

The user authorized Plan C on 22 October 2026: simulate sign-in, roles and access checks while retaining the real Tide integration. This is a local product prototype, not a completed TideCloak security integration.

## Where Tide fits

| Boundary | Working Plan C behavior | Real TideCloak integration |
| --- | --- | --- |
| Identity | Select one of three explicitly fictional accounts. Server issues an opaque, expiring, HttpOnly demo cookie. | Official TideCloakProvider + useTideCloak login/logout; account enrollment and consent happen in Tide's browser flow. |
| Role claims | Server holds a snapshot of roles for each demo session; the browser cannot submit its own roles. | Read verified realm/client roles from an access token. The protected role is research_reader. |
| Document access | GET /api/document checks the server session and role; 401 without identity, 403 without role. Content is server-only and synthetic. | The route's existing real-mode branch uses withRole, verifyTideJWT and verifyDpop with the exported embedded JWK. Use SDK secureFetch from the UI. |
| Governance | A demo proposal, distinct approver votes, a two-vote demo threshold and explicit commit. | Use Tide Console's actual IGA/QEA change-request lifecycle; obtain real attestations and honor the realm's actual configured quorum. No manual direct role assignment. |
| Fresh claims | Commit updates the role store, but existing session snapshots stay unchanged until refresh or re-login. | Obtain a fresh TideCloak token after a committed role grant; recheck the protected API. |
| Logout | Server deletes the demo session and expires its cookie. | Official TideCloak logout invalidates the relevant real session. |

The simulation deliberately gives the operator access to any demo identity. Its approvals are ordinary application state, not threshold signatures or QEA attestations. It offers none of Tide's identity or cryptographic guarantees. A two-vote demo policy is not evidence of the live realm's quorum, nor a requirement for one approver from each university.

## MCP guidance consulted

Connected server reports Agent Pack 1.9.33. Called tide_choose_playbook with the explicit Plan C request, then read protect-api-nextjs and setup-iga-admin-panel. The returned work order did not contain a Plan C implementation. We used its server-side role enforcement and proposal/approval/commit boundaries to design a clearly marked local simulation, as the user requested.

The retained SDK, static DPoP relay, provider settings, callback and real token/proof verifiers came from the official pack. The relay has not been edited. Tide doctor still reports the absent adapter because the original real VRK initialization failed. A doctor pass or real login is not claimed for this prototype.

## Explicit mode separation

- AUTH_MODE=simulation must be set explicitly in .env.local; any other/missing value selects tidecloak.
- Simulation endpoints only accept loopback hosts. Mutations require a same-origin JSON request.
- Cookies, identities and role assignments live only in data/simulation/state.json, which is ignored by Git.
- /api/simulation is 404 in real mode. /api/document in real mode never authenticates demo cookies.
- The public page never bundles the document body; denied responses never include it.
- The UI always labels this as Plan C simulation. No fake adapter, VRK, JWT or DPoP proof is generated.
- Local file transactions support this one-process demo. This is not a distributed governance service.

## Return to real TideCloak

1. Follow the Tide team's supported recovery instructions for the existing VRK/licence state (see vrk-blocker.md). Preserve data/h2, .env and the existing realm. Do not blindly rerun initialization or toggle IGA.
2. Complete the real bootstrap and link the user's Tide account. Export the real adapter into data/tidecloak.json; retain its embedded JWK. Never invent an adapter to pass diagnostics.
3. Set AUTH_MODE=tidecloak and restart. This restores the original real login/logout screen; it does not turn the simulation governance UI into a live QEA client.
4. Connect the product document view to the official useTideCloak hook and secureFetch. The document API real-mode branch already requires research_reader and verifies JWT/DPoP. That branch has not been validated with a live token.
5. Set up real approver authority and quorum through supported Tide instructions. Propose/approve/commit the role grant in Tide Console, not via /api/simulation.
6. Run Tide doctor and actual browser login/logout; test 401, wrong-role 403, pending/insufficient approvals, real commit, stale token and fresh-token success against the document API.

## What is not claimed

No end-to-end document encryption, platform-blind storage, participant-consent enforcement or revocation of downloaded copies. The synthetic document stays readable to the local app operator. Real identity, real QEA and real token issuance remain blocked by the original VRK issue.
