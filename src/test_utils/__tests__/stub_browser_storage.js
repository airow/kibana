import expect from 'expect.js';

import StubBrowserStorage from '../stub_browser_storage';

describe('StubBrowserStorage', () => {
  describe('#getItem() / #setItem()', () => {
    it('stores items as strings', () => {
      const store = new StubBrowserStorage();
      store.setItem(1, 1);
      expect(store.getItem(1)).to.be('1');
    });

    it('stores keys as strings', () => {
      const store = new StubBrowserStorage();
      store.setItem(1, 1);
      expect(store.key(0)).to.be('1');
    });

    it('returns null for missing keys', () => {
      const store = new StubBrowserStorage();
      expect(store.getItem('unknown key')).to.be(null);
    });
  });

  describe('#length', () => {
    it('reports the number of items stored', () => {
      const store = new StubBrowserStorage();
      store.setItem(1, 1);
      store.setItem(2, 2);
      store.setItem(3, 3);
      store.setItem(4, 4);
      expect(store).to.have.length(4);
    });

    it('does not trip on items getting reset', () => {
      const store = new StubBrowserStorage();
      store.setItem(1, 1);
      store.setItem(1, 2);
      expect(store).to.have.length(1);
    });
  });

  describe('#key()', () => {
    it('returns the key as a specific index', () => {
      const store = new StubBrowserStorage();
      store.setItem(1, 2);
      expect(store.key(0)).to.be('1');
      expect(store.key(1)).to.be(undefined);
    });
  });

  describe('size limiting', () => {
    it('allows limiting the storage size', () => {
      const store = new StubBrowserStorage();
      store._setSizeLimit(10);
      store.setItem('abc', 'def'); // store size is 6, key.length + val.length
      expect(() => {
        store.setItem('ghi', 'jkl');
      }).throwError(/quota/);
    });

    it('allows defining the limit as infinity', () => {
      const store = new StubBrowserStorage();
      store._setSizeLimit(Infinity);
      store.setItem('abc', 'def');
      store.setItem('ghi', 'jkl'); // unlike the previous test, this doesn't throw
    });

    it('requires setting the limit before keys', () => {
      const store = new StubBrowserStorage();
      store.setItem('key', 'val');
      expect(() => {
        store._setSizeLimit(10);
      }).throwError(/before setting/);
    });

    it('respects removed items', () => {
      const store = new StubBrowserStorage();
      store._setSizeLimit(10);
      store.setItem('abc', 'def');
      store.removeItem('abc');
      store.setItem('ghi', 'jkl'); // unlike the previous test, this doesn't throw
    });
  });
});
