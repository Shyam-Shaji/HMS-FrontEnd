import { apiClient } from './api-client';

// Files here are medical records, served only through authenticated API
// routes - so a plain <a href> can't work (it wouldn't carry the bearer
// token). Fetch the bytes with the token, then show them via a blob URL.
async function readableError(err: unknown): Promise<Error> {
  // A failed blob request returns its JSON error body AS a Blob.
  if (err instanceof Blob) {
    try {
      const body = JSON.parse(await err.text());
      return new Error(Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? 'Could not open the file'));
    } catch {
      return new Error('Could not open the file');
    }
  }
  const message = (err as { message?: string | string[] })?.message;
  return new Error(Array.isArray(message) ? message.join(', ') : (message ?? 'Could not open the file'));
}

export async function openProtectedFile(path: string): Promise<void> {
  // Opened synchronously, inside the user's click, so popup blockers allow
  // it; the blob is pointed at once it arrives.
  const tab = window.open('', '_blank');
  try {
    const blob = await apiClient.get<never, Blob>(path, { responseType: 'blob' });
    const url = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = url;
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report';
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    tab?.close();
    throw await readableError(err);
  }
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
