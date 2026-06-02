import { describe, it, expect, beforeEach } from 'vitest';
import { tokenStore } from '../lib/api';

describe('tokenStore', () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it('starts with null token', () => {
    expect(tokenStore.get()).toBeNull();
  });

  it('sets and gets the token', () => {
    tokenStore.set('my-secret-token');
    expect(tokenStore.get()).toBe('my-secret-token');
  });

  it('clears the token', () => {
    tokenStore.set('my-secret-token');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });
});
