'use client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  return (
    <button onClick={logout} className="btn-secondary h-9 w-full whitespace-nowrap text-sm">
      <LogOut className="h-4 w-4 shrink-0" />
      <span>Sign out</span>
    </button>
  );
}
