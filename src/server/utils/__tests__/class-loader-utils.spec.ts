import { loadClass } from '../class-loader-utils';

describe('Class Loader Suite', () => {
  it('should throw on invalid path', async () => {
    expect.assertions(1);
    try {
      await loadClass('invalid/path');
    } catch (err) {
      expect(err.message).toContain('Could not load class');
    }
  });
});
