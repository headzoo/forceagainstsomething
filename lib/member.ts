import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function getMemberSession() {
  return auth.api.getSession({ headers: await headers() });
}

export function isAdminEmail(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.trim().toLowerCase());
}
