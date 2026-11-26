export function isWebGLAvailable() {
  if (typeof window === 'undefined') return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get('fallback') === '2d') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const ok = Boolean(gl);
    const ext = gl?.getExtension?.('WEBGL_lose_context');
    if (ext) ext.loseContext();
    return ok;
  } catch {
    return false;
  }
}
