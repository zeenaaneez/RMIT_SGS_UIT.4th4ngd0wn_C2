import { NextRequest } from 'next/server';
import { authMode } from '@/lib/auth/mode';
import { withRole } from '@/lib/auth/protect';
import { DEMO_COOKIE, readStore, sessionFor } from '@/lib/simulation/store';
import { demoFailure, demoResponse, requireLocalSimulation } from '@/lib/simulation/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Server-only fake content. It never ships in the public page's JavaScript.
const document = {
  title: 'Urban Heat Study — Research Brief',
  content: 'SYNTHETIC RESEARCH — DỮ LIỆU GIẢ CHO HACKATHON\n\nMục tiêu: So sánh nhiệt độ tại các điểm có cây xanh và các điểm ít bóng mát.\n\nPhương pháp giả định: Đo tại 12 vị trí trong 7 ngày, cùng khung giờ buổi trưa.\n\nKết quả minh họa: Các vị trí có bóng cây thấp hơn trung bình 2,1°C. Các con số được tạo cho demo, không phải kết quả nghiên cứu thực tế.\n\nBước tiếp theo: Đối tác đọc phương pháp và chuẩn bị một nghiên cứu lặp lại tại địa điểm khác.',
};
const realDocument = withRole('research_reader', async () => demoResponse({ document, mode: 'tidecloak' }));

export async function GET(req: NextRequest) {
  if (authMode() === 'tidecloak') {
    const response = await realDocument(req);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
  try {
    requireLocalSimulation(req);
    const session = sessionFor(readStore(), req.cookies.get(DEMO_COOKIE)?.value);
    if (!session) return demoResponse({ error: 'Chưa đăng nhập mô phỏng.' }, 401);
    if (!session.roles.includes('research_reader')) return demoResponse({ error: 'Phiên hiện tại chưa có role research_reader.' }, 403);
    return demoResponse({ document, mode: 'simulation' });
  } catch (error) { return demoFailure(error); }
}
