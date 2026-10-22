import { authMode } from '@/lib/auth/mode';
import RealHomePage from '@/components/RealHomePage';
import SimulationApp from '@/components/SimulationApp';

export default function HomePage() {
  return authMode() === 'simulation' ? <SimulationApp /> : <RealHomePage />;
}
