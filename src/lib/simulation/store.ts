// PLAN C ONLY. This local file store is not TideCloak, JWT verification or real QEA.
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const accounts = {
  reader: { name: 'Người đọc', roles: [] as string[] },
  'approver-a': { name: 'Mai · Người duyệt A', roles: ['demo_approver'] },
  'approver-b': { name: 'An · Người duyệt B', roles: ['demo_approver'] },
};
export type Identity = keyof typeof accounts;
export type Session = { identity: Identity; name: string; roles: string[]; expires: number };
type ChangeRequest = { id: string; proposedBy: Identity; approvals: Identity[]; status: 'pending' | 'ready' | 'committed' };
type Store = { version: 1; readerRoles: string[]; readerName: string; sessions: Record<string, Session>; request: ChangeRequest | null };
export const DEMO_COOKIE = 'research_share_demo';
export const DEMO_QUORUM = 2; // Illustrative policy, not the live realm's configured quorum.
const file = () => join(process.cwd(), 'data', 'simulation', 'state.json');
const initial = (): Store => ({ version: 1, readerRoles: [], readerName: accounts.reader.name, sessions: {}, request: null });

export class DemoError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Each transaction is synchronous in this single local Node process. Persist across restarts
// and read per request so Next's separate route bundles share one authoritative demo state.
export function readStore(): Store {
  if (!existsSync(file())) return initial();
  const state = JSON.parse(readFileSync(file(), 'utf8')) as Store;
  if (state.version !== 1) throw new Error('Unsupported simulation state version');
  return state;
}
function save(state: Store) {
  mkdirSync(join(process.cwd(), 'data', 'simulation'), { recursive: true });
  const temporary = file() + '.tmp';
  writeFileSync(temporary, JSON.stringify(state), { mode: 0o600 });
  renameSync(temporary, file());
}
export function sessionFor(state: Store, id?: string): Session | null {
  const session = id ? state.sessions[id] : null;
  return session && session.expires > Date.now() ? session : null;
}
export function publicState(state: Store, id?: string) {
  const session = sessionFor(state, id);
  return {
    mode: 'simulation' as const,
    quorum: DEMO_QUORUM,
    session: session ? { identity: session.identity, name: session.name, roles: session.roles } : null,
    request: state.request,
  };
}
export function command(id: string | undefined, body: Record<string, unknown>) {
  const state = readStore();
  let nextId = id;
  const actor = sessionFor(state, id);
  const requireApprover = () => {
    if (!actor) throw new DemoError(401, 'Hãy đăng nhập mô phỏng.');
    if (!actor.roles.includes('demo_approver')) throw new DemoError(403, 'Chỉ người duyệt demo có thể thực hiện thao tác này.');
  };
  switch (body.action) {
    case 'login': {
      if (typeof body.identity !== 'string' || !Object.hasOwn(accounts, body.identity)) throw new DemoError(400, 'Tài khoản demo không hợp lệ.');
      const identity = body.identity as Identity;
      if (body.displayName !== undefined && (typeof body.displayName !== 'string' || body.displayName.length > 60)) throw new DemoError(400, 'Tên hiển thị tối đa 60 ký tự.');
      if (identity === 'reader' && typeof body.displayName === 'string' && body.displayName.trim()) state.readerName = body.displayName.trim();
      if (id) delete state.sessions[id];
      for (const [key, session] of Object.entries(state.sessions)) if (session.expires <= Date.now()) delete state.sessions[key];
      nextId = randomBytes(32).toString('hex');
      state.sessions[nextId] = {
        identity,
        name: identity === 'reader' ? state.readerName : accounts[identity].name,
        roles: identity === 'reader' ? [...state.readerRoles] : [...accounts[identity].roles],
        expires: Date.now() + 60 * 60 * 1000,
      };
      break;
    }
    case 'logout':
      if (id) delete state.sessions[id];
      nextId = undefined;
      break;
    case 'refresh':
      if (!actor || !id) throw new DemoError(401, 'Phiên mô phỏng đã hết hạn.');
      delete state.sessions[id];
      nextId = randomBytes(32).toString('hex');
      state.sessions[nextId] = { ...actor, roles: actor.identity === 'reader' ? [...state.readerRoles] : [...accounts[actor.identity].roles], expires: Date.now() + 60 * 60 * 1000 };
      break;
    case 'propose':
      requireApprover();
      if (state.request) throw new DemoError(409, 'Đã có đề xuất. Reset demo để bắt đầu lượt mới.');
      state.request = { id: randomUUID(), proposedBy: actor!.identity, approvals: [], status: 'pending' };
      break;
    case 'approve':
    case 'commit': {
      requireApprover();
      const request = state.request;
      if (!request || request.id !== body.requestId) throw new DemoError(409, 'Đề xuất đã thay đổi. Hãy tải lại trạng thái.');
      if (request.status === 'committed') throw new DemoError(409, 'Đề xuất đã được commit.');
      if (body.action === 'approve') {
        if (request.approvals.includes(actor!.identity)) throw new DemoError(409, 'Mỗi người duyệt chỉ có một phiếu.');
        request.approvals.push(actor!.identity);
        if (request.approvals.length >= DEMO_QUORUM) request.status = 'ready';
      } else {
        if (request.approvals.length < DEMO_QUORUM) throw new DemoError(409, 'Chưa đủ 2/2 phê duyệt demo; quyền chưa được áp dụng.');
        state.readerRoles = ['research_reader'];
        request.status = 'committed';
      }
      break;
    }
    case 'reset':
      requireApprover();
      save(initial()); // Only our disposable Plan C state; never H2 or the live realm.
      return { data: publicState(initial()), cookie: undefined };
    default:
      throw new DemoError(400, 'Thao tác mô phỏng không hợp lệ.');
  }
  save(state);
  return { data: publicState(state, nextId), cookie: nextId };
}
