import '@testing-library/jest-dom';
import { vi } from 'vitest';

// REQ-F83/REQ-F92: Mock robusto usando uma classe para suportar o 'new'
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);