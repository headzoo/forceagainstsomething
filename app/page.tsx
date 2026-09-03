import { ActionsDirectory } from './actions-directory';
import { getDirectoryData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const directory = await getDirectoryData();

  return <ActionsDirectory {...directory} />;
}
