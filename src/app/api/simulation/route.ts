import { NextRequest } from 'next/server';
import { command, DEMO_COOKIE, DemoError, publicState, readStore } from '@/lib/simulation/store';
import { demoFailure, demoResponse, requireLocalSimulation } from '@/lib/simulation/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    requireLocalSimulation(req);
    return demoResponse(publicState(readStore(), req.cookies.get(DEMO_COOKIE)?.value));
  } catch (error) { return demoFailure(error); }
}
export async function POST(req: NextRequest) {
  try {
    requireLocalSimulation(req, true);
    if (!req.headers.get('content-type')?.startsWith('application/json')) throw new DemoError(415, 'JSON required.');
    let body: unknown;
    try { body = await req.json(); } catch { throw new DemoError(400, 'Invalid JSON.'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DemoError(400, 'Invalid command.');
    const result = command(req.cookies.get(DEMO_COOKIE)?.value, body as Record<string, unknown>);
    const response = demoResponse(result.data);
    response.cookies.set(DEMO_COOKIE, result.cookie || '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: result.cookie ? 3600 : 0 });
    return response;
  } catch (error) { return demoFailure(error); }
}
