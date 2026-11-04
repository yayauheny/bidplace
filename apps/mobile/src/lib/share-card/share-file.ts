export async function shareFile(file: File): Promise<'shared' | 'cancelled' | 'downloaded'> {
  const payload = { files: [file] };
  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare(payload)) {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') return 'cancelled';
      throw error;
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    try { link.click(); } finally { link.remove(); }
    return 'downloaded';
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
