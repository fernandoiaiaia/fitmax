import { describe, it, expect, beforeEach } from 'vitest';
import { api, tokenStore } from '../lib/api';

describe('Web-Client API client & tokenStore Unit Tests', () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it('verifies Axios client is configured with secure defaults', () => {
    expect(api.defaults.baseURL).toBe('/api');
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('correctly sets, gets and clears access tokens in the memory store', () => {
    const fakeToken = 'header.payload.signature-confidential';
    
    // Store is empty initially
    expect(tokenStore.get()).toBeNull();

    // Sets and retrieves
    tokenStore.set(fakeToken);
    expect(tokenStore.get()).toBe(fakeToken);

    // Clears the store
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });
});
