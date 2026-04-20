interface RequestErrorLike {
  data?: {
    statusMessage?: string;
    message?: string;
  };
  statusMessage?: string;
  message?: string;
}

function pickNonEmptyMessage(...candidates: Array<string | undefined>) {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const normalizedCandidate = candidate.trim();

      if (normalizedCandidate) {
        return normalizedCandidate;
      }
    }
  }

  return '';
}

export function resolveRequestErrorMessage(error: unknown, fallbackMessage: string) {
  const requestError = typeof error === 'object' && error
    ? error as RequestErrorLike
    : undefined;

  return pickNonEmptyMessage(
    requestError?.data?.statusMessage,
    requestError?.data?.message,
    requestError?.statusMessage,
    requestError?.message,
    fallbackMessage,
  );
}
