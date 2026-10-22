import { Providers, type AdapterConfig } from "./providers";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { authMode } from "@/lib/auth/mode";
import "./globals.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Research Share", description: "Private research sharing with TideCloak" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const simulated = authMode() === 'simulation';
  let config: AdapterConfig | null = null;
  try {
    const adapter = JSON.parse(readFileSync(join(process.cwd(), "data/tidecloak.json"), "utf8"));
    if (adapter.jwk && adapter.vendorId && adapter.homeOrkUrl && adapter.realm && adapter["auth-server-url"]) config = adapter;
  } catch { /* No authentication is offered until a real adapter has been exported. */ }
  return (
    <html lang="vi">
      <body>
        {simulated ? children : config ? <Providers config={config}>{children}</Providers> : (
          <main className="shell">
            <p>RMIT HACKATHON · TIDECLOAK THẬT</p>
            <h1>Research Share</h1>
            <p role="status">Đăng nhập chưa sẵn sàng.</p>
            <p>TideCloak chưa hoàn tất khởi tạo khóa xác thực. Website đang chờ cấu hình xác thực hợp lệ từ server.</p>
            <p>Chưa có phiên đăng nhập hoặc quyền truy cập tài liệu.</p>
          </main>
        )}
      </body>
    </html>
  );
}
