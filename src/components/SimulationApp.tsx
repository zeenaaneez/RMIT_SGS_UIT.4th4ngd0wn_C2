'use client';

import { useCallback, useEffect, useState } from 'react';

type Identity = 'reader' | 'approver-a' | 'approver-b';
type DemoState = {
  mode: 'simulation'; quorum: number;
  session: { identity: Identity; name: string; roles: string[] } | null;
  request: { id: string; proposedBy: Identity; approvals: Identity[]; status: 'pending' | 'ready' | 'committed' } | null;
};
type Brief = { title: string; content: string };
const labels: Record<Identity, string> = { reader: 'Người đọc', 'approver-a': 'Mai · Người duyệt A', 'approver-b': 'An · Người duyệt B' };

export default function SimulationApp() {
  const [state, setState] = useState<DemoState | null>(null);
  const [identity, setIdentity] = useState<Identity>('reader');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [apiResult, setApiResult] = useState('Chưa kiểm tra API.');
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/simulation', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState(data);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không kết nối được server.'); }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => { void load(); }, 4000);
    return () => clearInterval(timer);
  }, [load]);
  const session = state?.session;
  const signature = session ? `${session.identity}:${session.roles.join(',')}` : '';
  useEffect(() => { setBrief(null); setApiResult('Chưa kiểm tra API trong phiên này.'); }, [signature]);

  async function act(action: string) {
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/simulation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, identity, displayName, requestId: state?.request?.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`${response.status} · ${data.error}`);
      setState(data);
      setNotice(({ login: 'Đã đăng nhập mô phỏng.', logout: 'Đã đăng xuất và hủy phiên.', refresh: 'Đã lấy snapshot role mới cho phiên mô phỏng.', propose: 'Đã đề xuất cấp research_reader cho Người đọc. Quyền chưa được áp dụng.', approve: 'Đã ghi nhận một phê duyệt demo. Cần commit để áp dụng.', commit: 'Đã commit mô phỏng. Người đọc cần làm mới phiên hoặc đăng nhập lại.', reset: 'Đã reset dữ liệu và các phiên demo.' } as Record<string, string>)[action]);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Thao tác thất bại.'); }
    finally { setBusy(false); }
  }
  async function openDocument() {
    setBusy(true); setBrief(null);
    try {
      const response = await fetch('/api/document', { cache: 'no-store' });
      const data = await response.json();
      setApiResult(`GET /api/document → ${response.status}${response.ok ? ' · Được phép đọc.' : ` · ${data.error}`}`);
      if (response.ok) setBrief(data.document);
    } catch { setApiResult('Không kết nối được API.'); }
    finally { setBusy(false); }
  }
  const request = state?.request;
  const approver = session?.roles.includes('demo_approver');
  const canRead = session?.roles.includes('research_reader');

  return (
    <div className="shell">
      <div className="demo-banner"><strong>PLAN C · MÔ PHỎNG</strong><span>Sign-in, role và quorum là dữ liệu demo. Chưa có xác thực hay QEA thật từ TideCloak.</span></div>
      <header className="page-header"><div><p className="eyebrow">RMIT HACKATHON</p><h1>Research Share<span className="title-dot">.</span></h1></div><span className="tag">Private research room</span></header>
      <p className="intro">Chia sẻ nghiên cứu chưa công bố với cộng tác viên. Quyền đọc cần được phê duyệt chung trước khi áp dụng.</p>
      <main className="grid">
        <section className="card document-card" aria-labelledby="brief-title">
          <div className="card-top"><span className="eyebrow">RESEARCH BRIEF · 01</span><span className={`tag ${canRead ? 'success' : ''}`}>{canRead ? 'Có quyền trong phiên demo' : 'Nội dung được giới hạn'}</span></div>
          <h2 id="brief-title">Urban Heat Study</h2>
          <p className="muted">Nghiên cứu minh họa về cây xanh và nhiệt độ đô thị. Cộng tác viên cần đọc phương pháp để chuẩn bị nghiên cứu lặp lại.</p>
          <div className="access-note"><strong>{canRead ? 'Bạn có thể mở bản nghiên cứu.' : 'Đang chờ quyền đọc.'}</strong><p>Đăng nhập chưa tự cấp quyền. API chỉ trả nội dung khi phiên hiện tại có <code>research_reader</code>.</p></div>
          <button disabled={busy || !state} onClick={openDocument}>{canRead ? 'Mở nghiên cứu' : 'Thử mở nghiên cứu'}</button>
          <p className="api-result" role="status">{apiResult}</p>
          <p className="small muted"><a href="/api/document" target="_blank" rel="noreferrer">Gọi trực tiếp API ↗</a> · Nội dung giả, được trả từ server sau kiểm tra quyền.</p>
          {brief && <article className="research-content"><h3>{brief.title}</h3><p>{brief.content}</p></article>}
        </section>
        <aside className="card" aria-labelledby="session-title">
          <p className="eyebrow">01 · PHIÊN MÔ PHỎNG</p><h2 id="session-title">{session ? session.name : 'Chọn người tham gia'}</h2>
          <p className="muted small">Tài khoản mẫu để diễn tập luồng. Không dùng mật khẩu hoặc tài khoản thật.</p>
          <form onSubmit={(event) => { event.preventDefault(); void act('login'); }}>
            <label htmlFor="identity">Tài khoản demo</label>
            <select id="identity" value={identity} onChange={(event) => setIdentity(event.target.value as Identity)} disabled={busy}>{Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
            {identity === 'reader' && <><label htmlFor="name">Tên hiển thị <span className="muted">(tùy chọn)</span></label><input id="name" maxLength={60} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tên của bạn" disabled={busy} /></>}
            <button type="submit" className="secondary" disabled={busy || !state}>{session ? 'Đăng nhập bằng tài khoản đã chọn' : 'Đăng nhập mô phỏng'}</button>
          </form>
          <p className="small">Trạng thái: <strong>{session ? 'Đã đăng nhập mô phỏng' : 'Chưa đăng nhập'}</strong></p>
          {session && <><p className="small">Role trong phiên: <code>{session.roles.join(', ') || 'không có'}</code></p><div className="button-row"><button className="secondary" onClick={() => act('refresh')} disabled={busy}>Làm mới phiên</button><button className="text-button" onClick={() => act('logout')} disabled={busy}>Đăng xuất</button></div></>}
        </aside>
        <section className="card governance" aria-labelledby="approval-title">
          <div><p className="eyebrow">02 · PHÊ DUYỆT DEMO</p><h2 id="approval-title">Cấp quyền cho Người đọc</h2><p className="muted">Chính sách minh họa: hai người duyệt khác nhau, sau đó commit. Đây không phải quorum đã cấu hình trên realm thật.</p></div>
          <ol className="steps"><li className={request ? 'done' : ''}>Đề xuất</li><li className={request && request.approvals.length >= 2 ? 'done' : ''}>Phê duyệt {request?.approvals.length || 0}/{state?.quorum || 2}</li><li className={request?.status === 'committed' ? 'done' : ''}>Commit</li><li className={canRead ? 'done' : ''}>Làm mới phiên</li></ol>
          <p className="small">{!request ? 'Chưa có đề xuất.' : request.status === 'committed' ? 'Đã áp dụng role trên dữ liệu demo. Phiên cũ vẫn giữ snapshot quyền cũ.' : request.status === 'ready' ? 'Đủ phê duyệt demo. Chưa áp dụng role cho tới khi commit.' : 'Chưa đủ phê duyệt demo. Role chưa thay đổi.'}</p>
          {request && <p className="small muted">Đã duyệt: {request.approvals.map((id) => labels[id]).join(' · ') || 'chưa có'}</p>}
          {approver ? <div className="button-row"><button onClick={() => act('propose')} disabled={busy || !!request}>Đề xuất cấp quyền</button><button className="secondary" onClick={() => act('approve')} disabled={busy || !request || request.status === 'committed' || request.approvals.includes(session!.identity)}>Phê duyệt với tài khoản này</button><button className="secondary" onClick={() => act('commit')} disabled={busy || !request || request.status === 'committed'}>{request?.status === 'pending' ? 'Thử commit khi chưa đủ phiếu' : 'Commit mô phỏng'}</button></div> : <p className="small muted">Đăng nhập bằng Mai hoặc An để đề xuất, phê duyệt và commit. Người đọc không có quyền này.</p>}
          <p className="small muted">Cách thử: Người đọc mở tài liệu → Mai đề xuất và duyệt → thử commit (bị từ chối) → An duyệt và commit → Người đọc đăng nhập lại rồi mở tài liệu.</p>
          <details><summary>Kiểm tra phiên cũ và bắt đầu lại</summary><p className="small muted">Giữ Người đọc ở cửa sổ ẩn danh, dùng cửa sổ thường cho Mai và An. Sau commit, Người đọc thử mở lại vẫn nhận 403 cho tới khi bấm Làm mới phiên. Trạng thái phê duyệt tự cập nhật mỗi 4 giây.</p><p className="small muted">Reset chỉ xóa dữ liệu mô phỏng và đăng xuất các phiên demo.</p><button className="text-button" disabled={busy || !approver} onClick={() => act('reset')}>Reset demo</button></details>
        </section>
      </main>
      <div className="notice" role="status" aria-live="polite">{notice || (!state ? 'Đang kết nối bản demo…' : 'Bản demo local đã sẵn sàng.')}</div>
      <footer>Research Share · Plan C. Realm TideCloak và dữ liệu VRK hiện có được giữ riêng để tích hợp thật sau.</footer>
    </div>
  );
}
