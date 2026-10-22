import { NextRequest, NextResponse } from 'next/server';
import { authMode } from '@/lib/auth/mode';
import { DemoError } from './store';

export function demoResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function requireLocalSimulation(req: NextRequest, mutation = false) {
  if (authMode() !== 'simulation') throw new DemoError(404, 'Simulation is disabled.');
  const host = req.headers.get('host') || '';
  let hostname: string;
  try { hostname = new URL(`http://${host}`).hostname; } catch { throw new DemoError(403, 'Local demo only.'); }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) throw new DemoError(403, 'Local demo only.');
  if (mutation) {
    let originHost: string;
    try { originHost = new URL(req.headers.get('origin') || '').host; } catch { throw new DemoError(403, 'Same-origin request required.'); }
    if (originHost !== host || req.headers.get('sec-fetch-site') === 'cross-site') throw new DemoError(403, 'Same-origin request required.');
  }
}
export function demoFailure(error: unknown) {
  return demoResponse({ error: error instanceof DemoError ? error.message : 'Không thể đọc dữ liệu demo. Hãy kiểm tra server.' }, error instanceof DemoError ? error.status : 500);
}
