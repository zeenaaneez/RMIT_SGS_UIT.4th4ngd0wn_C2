import assert from 'node:assert/strict';

const base = process.env.APP_URL || 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Local demo only');
function browser() {
  let cookie = '';
  return async (path, body, expected = 200, options = {}) => {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { cookie, origin: base, ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...options.headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const nextCookie = response.headers.get('set-cookie');
    if (nextCookie) cookie = nextCookie.split(';')[0];
    assert.equal(response.status, expected, `${path}: expected ${expected}, got ${response.status}`);
    const data = await response.json();
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return data;
  };
}
const reader = browser();
const adminA = browser();
const adminB = browser();
const anonymous = browser();
const endpoint = '/api/simulation';
await anonymous(endpoint, { action: 'login', identity: 'approver-a' }, 403, { headers: { origin: 'https://untrusted.example' } });
await adminA(endpoint, { action: 'login', identity: 'approver-a' });
await adminA(endpoint, { action: 'reset' });
await adminA(endpoint, { action: 'login', identity: 'approver-a' });
await adminB(endpoint, { action: 'login', identity: 'approver-b' });
await anonymous('/api/document', undefined, 401);
await anonymous('/api/document', undefined, 401, { headers: { cookie: 'research_share_demo=fake' } });
const signedIn = await reader(endpoint, { action: 'login', identity: 'reader', displayName: 'Demo Reader', roles: ['research_reader'] });
assert.deepEqual(signedIn.session.roles, []);
assert.equal(signedIn.session.name, 'Demo Reader');
await reader('/api/document', undefined, 403);
await reader(endpoint, { action: 'propose' }, 403);
const proposed = await adminA(endpoint, { action: 'propose' });
const requestId = proposed.request.id;
await adminA(endpoint, { action: 'commit', requestId }, 409);
await adminA(endpoint, { action: 'approve', requestId: 'stale-request' }, 409);
const one = await adminA(endpoint, { action: 'approve', requestId });
assert.equal(one.request.approvals.length, 1);
assert.equal(one.request.status, 'pending');
await adminA(endpoint, { action: 'approve', requestId }, 409);
await adminA(endpoint, { action: 'commit', requestId }, 409);
await reader(endpoint, { action: 'refresh' });
await reader('/api/document', undefined, 403);
const two = await adminB(endpoint, { action: 'approve', requestId });
assert.equal(two.request.status, 'ready');
await reader(endpoint, { action: 'refresh' });
await reader('/api/document', undefined, 403);
await reader(endpoint, { action: 'commit', requestId }, 403);
const committed = await adminB(endpoint, { action: 'commit', requestId });
assert.equal(committed.request.status, 'committed');
await reader('/api/document', undefined, 403); // Existing session keeps its role snapshot.
const refreshed = await reader(endpoint, { action: 'refresh' });
assert.deepEqual(refreshed.session.roles, ['research_reader']);
const document = await reader('/api/document');
assert.ok(document.document.content.includes('SYNTHETIC'));
await adminA('/api/document', undefined, 403); // Governance authority does not grant document access.
await reader(endpoint, { action: 'logout' });
await reader('/api/document', undefined, 401);
await adminA(endpoint, { action: 'reset' });
await adminB('/api/document', undefined, 401); // Reset invalidates demo sessions.
console.log('PASS: simulated sign-in/logout, API 401/403, role tampering, approver checks, distinct approvals, quorum, commit, stale session, refresh, document access, reset and cross-origin rejection.');
