import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth';

export default async function Home() {
  const s = await readSession();
  if (s?.role === 'admin') redirect('/admin');
  if (s?.role === 'judge') redirect('/judge');
  if (s?.role === 'participant') redirect('/dashboard');
  redirect('/login');
}
