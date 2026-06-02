import { describe, it, expect, beforeEach } from 'vitest';
import { api, tokenStore } from '../lib/api';

describe('API Client & TokenStore Unit Suite - web-pro', () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it('asserts Axios client defaults for security (withCredentials and baseURL)', () => {
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('saves and retrieves JWT access token in TokenStore correctly', () => {
    const testToken = 'pro.test.jwt.payload.confidential';
    tokenStore.set(testToken);
    expect(tokenStore.get()).toBe(testToken);
  });

  it('erases JWT access token in TokenStore when clear is executed', () => {
    const testToken = 'pro.test.jwt.payload.confidential';
    tokenStore.set(testToken);
    expect(tokenStore.get()).toBe(testToken);
    
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });
});
