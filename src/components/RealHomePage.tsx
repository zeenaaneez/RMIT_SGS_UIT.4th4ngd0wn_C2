"use client";

import { useTideCloak } from "@tidecloak/nextjs";

// Public home page. No auth required.
export default function HomePage() {
  const { authenticated, login, logout, isInitializing } =
    useTideCloak();

  if (isInitializing) {
    return <p>Loading...</p>;
  }

  if (!authenticated) {
    return (
      <div>
        <h1>Research Share</h1>
        <p>Nền tảng chia sẻ nghiên cứu riêng tư.</p>
        <p role="status">Bạn chưa đăng nhập.</p>
        <button onClick={login}>Đăng nhập với TideCloak</button>
        <p>Milestone 1 · Kiểm tra đăng nhập và đăng xuất thật.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Research Share</h1>
      <p role="status">Đã đăng nhập bằng TideCloak.</p>
      <button onClick={logout}>Đăng xuất</button>
      <p>Tài liệu nghiên cứu sẽ được bổ sung ở milestone sau.</p>
    </div>
  );
}
