import { getActiveIssues } from '@/lib/db';
import { SubmissionFlow } from './submission-flow';

export const dynamic = 'force-dynamic';

export default async function SubmitPage() {
  const issues = await getActiveIssues();
  return <SubmissionFlow issues={issues} />;
}
