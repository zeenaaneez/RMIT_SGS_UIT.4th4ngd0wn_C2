import { redirect } from 'next/navigation';
import { authMode } from '@/lib/auth/mode';
import RealAuthRedirect from '@/components/RealAuthRedirect';

export default function AuthRedirectPage() {
  if (authMode() === 'simulation') redirect('/');
  return <RealAuthRedirect />;
}
