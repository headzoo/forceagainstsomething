import { notFound } from 'next/navigation';
import { getActiveIssues } from '@/lib/db';
import { ActionEditor } from './editor';

export const dynamic = 'force-dynamic';

type EditActionPageProps = { params: Promise<{ id: string }> };

export default async function EditActionPage({ params }: EditActionPageProps) {
  const { id: value } = await params;
  const actionId = Number(value);
  if (!Number.isSafeInteger(actionId) || actionId < 1) notFound();

  const issues = await getActiveIssues();
  return <ActionEditor actionId={actionId} issues={issues} />;
}
