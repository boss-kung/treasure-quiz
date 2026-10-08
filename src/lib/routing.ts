export type AppPath = '/host' | '/play';

export function getAppPath(
  pathname = typeof window === 'undefined' ? '/play' : window.location.pathname,
  hash = typeof window === 'undefined' ? '' : window.location.hash,
): AppPath {
  const path = hash.startsWith('#/')
    ? hash.slice(1)
    : pathname.replace(/^\/treasure-quiz(?=\/|$)/, '') || '/play';

  return path === '/host' ? '/host' : '/play';
}
