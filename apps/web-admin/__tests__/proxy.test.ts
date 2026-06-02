import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';

describe('Next.js Proxy Middleware', () => {
  it('redirects to login if accessing /painel without refresh cookie', () => {
    const req = new NextRequest('http://localhost:3002/painel/dashboard');
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3002/?redirect=%2Fpainel%2Fdashboard');
  });

  it('allows access to /painel if refresh cookie is present', () => {
    const req = new NextRequest('http://localhost:3002/painel/dashboard');
    req.cookies.set('fitmax_admin_refresh', 'some-token');
    
    const res = proxy(req);
    expect(res.headers.get('x-middleware-next')).toBe('1'); 
  });

  it('redirects away from login (/) if refresh cookie is present', () => {
    const req = new NextRequest('http://localhost:3002/');
    req.cookies.set('fitmax_admin_refresh', 'some-token');
    
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3002/painel');
  });
});
