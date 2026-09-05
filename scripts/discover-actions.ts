import { discoverNewActions } from '../lib/action-discovery';

function option(name: string) {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const maxValue = option('max');
const maxNewActionsPerIssue = maxValue === undefined ? undefined : Number(maxValue);

if (maxNewActionsPerIssue !== undefined && (!Number.isSafeInteger(maxNewActionsPerIssue) || maxNewActionsPerIssue < 1 || maxNewActionsPerIssue > 10)) {
  throw new Error('--max must be a whole number between 1 and 10.');
}

const result = await discoverNewActions({
  dryRun: process.argv.includes('--dry-run'),
  issueSlug: option('issue'),
  maxNewActionsPerIssue,
});

console.log(JSON.stringify(result, null, 2));

if (result.errors.length > 0) process.exitCode = 1;
