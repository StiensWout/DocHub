// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for setImmediate (required by winston in Jest)
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args));
global.clearImmediate = global.clearImmediate || ((id) => clearTimeout(id));

// Polyfill for Next.js Request/Response (required for testing Next.js API routes)
// These are needed when importing route handlers that use Next.js server types
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body || null;
      this.bodyUsed = false;
      this.cache = init.cache || 'default';
      this.credentials = init.credentials || 'same-origin';
      this.integrity = init.integrity || '';
      this.keepalive = init.keepalive || false;
      this.mode = init.mode || 'cors';
      this.redirect = init.redirect || 'follow';
      this.referrer = init.referrer || '';
      this.referrerPolicy = init.referrerPolicy || '';
      this.signal = init.signal || null;
    }
    
    async text() {
      return this.body || '';
    }
    
    async json() {
      return JSON.parse(this.body || '{}');
    }
    
    async arrayBuffer() {
      return new ArrayBuffer(0);
    }
    
    async blob() {
      return new Blob();
    }
    
    async formData() {
      return new FormData();
    }
    
    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
      });
    }
  };
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body === undefined ? null : body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
      this.redirected = false;
      this.type = 'default';
      this.url = '';
      this.bodyUsed = false;
    }
    
    async text() {
      if (typeof this.body === 'string') {
        return this.body;
      }
      if (this.body === null) {
        return '';
      }
      return JSON.stringify(this.body);
    }
    
    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }
    
    async arrayBuffer() {
      return new ArrayBuffer(0);
    }
    
    async blob() {
      return new Blob();
    }
    
    async formData() {
      return new FormData();
    }
    
    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }
  };
}

// Mock Next.js server types if needed
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {};
      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this._headers[key.toLowerCase()] = value;
        });
      } else if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
    
    append(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
    
    delete(name) {
      delete this._headers[name.toLowerCase()];
    }
    
    get(name) {
      return this._headers[name.toLowerCase()] || null;
    }
    
    has(name) {
      return name.toLowerCase() in this._headers;
    }
    
    set(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
    
    forEach(callback) {
      Object.entries(this._headers).forEach(([key, value]) => {
        callback(value, key, this);
      });
    }
    
    entries() {
      return Object.entries(this._headers)[Symbol.iterator]();
    }
    
    keys() {
      return Object.keys(this._headers)[Symbol.iterator]();
    }
    
    values() {
      return Object.values(this._headers)[Symbol.iterator]();
    }
    
    [Symbol.iterator]() {
      return this.entries();
    }
  };
}
