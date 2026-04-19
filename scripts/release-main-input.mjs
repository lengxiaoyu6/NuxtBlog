import process from 'node:process';
import { createInterface } from 'node:readline/promises';

const INTERACTIVE_COMMIT_MESSAGE_ERROR = '当前终端环境无法交互输入提交说明，请通过命令参数传入提交说明';
const EMPTY_COMMIT_MESSAGE_ERROR = '提交说明不能为空';
const DEFAULT_PROMPT = '请输入本次发布的提交说明：';

function normalizeCommitMessage(message) {
  const normalized = message?.trim() ?? '';

  if (!normalized) {
    throw new Error(EMPTY_COMMIT_MESSAGE_ERROR);
  }

  return normalized;
}

export function parseCommitMessageArgs(args = []) {
  if (!Array.isArray(args) || args.length === 0) {
    return null;
  }

  return normalizeCommitMessage(args.join(' '));
}

export async function promptCommitMessage(promptText = DEFAULT_PROMPT) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  try {
    const message = await rl.question(promptText);
    return normalizeCommitMessage(message);
  } finally {
    rl.close();
  }
}

export async function resolveCommitMessage({
  args = [],
  isInteractive = false,
  prompt = promptCommitMessage,
} = {}) {
  const messageFromArgs = parseCommitMessageArgs(args);

  if (messageFromArgs) {
    return messageFromArgs;
  }

  if (!isInteractive) {
    throw new Error(INTERACTIVE_COMMIT_MESSAGE_ERROR);
  }

  return normalizeCommitMessage(await prompt());
}

export {
  DEFAULT_PROMPT,
  EMPTY_COMMIT_MESSAGE_ERROR,
  INTERACTIVE_COMMIT_MESSAGE_ERROR,
};
