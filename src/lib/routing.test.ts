import { describe, expect, it } from 'vitest';
import { getAppPath } from './routing';

describe('getAppPath', () => {
  it('selects the host shell for /host', () => {
    expect(getAppPath('/host')).toBe('/host');
  });

  it('selects the player shell for /play', () => {
    expect(getAppPath('/play')).toBe('/play');
  });

  it('selects the host shell from a hash route', () => {
    expect(getAppPath('/treasure-quiz/', '#/host')).toBe('/host');
  });

  it('selects the player shell from a hash route', () => {
    expect(getAppPath('/treasure-quiz/host', '#/play')).toBe('/play');
  });

  it('selects the host shell for a Pages base-prefixed path', () => {
    expect(getAppPath('/treasure-quiz/host')).toBe('/host');
  });

  it('defaults unknown paths to the player shell', () => {
    expect(getAppPath('/anything-else')).toBe('/play');
  });
});
