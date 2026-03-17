/**
 * Flavor Passport — Shared Cart Module
 * Plain JS, no imports, no build step.
 * Exposes FP_CART global with full cart state management + drawer UI.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'fp-cart';

  /* ── State ─────────────────────────────────────────────────────────── */
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveState(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  /* ── Public API ────────────────────────────────────────────────────── */
  var FP_CART = {
    add: function (product) {
      var items = loadState();
      var existing = items.find(function (i) { return i.id === product.id; });
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          origin: product.origin,
          price: product.price,
          emoji: product.emoji,
          spice: product.spice,
          qty: 1
        });
      }
      saveState(items);
      FP_CART.syncUI();
      FP_CART.open();
    },

    remove: function (id) {
      var items = loadState().filter(function (i) { return i.id !== id; });
      saveState(items);
      FP_CART.syncUI();
    },

    updateQty: function (id, newQty) {
      if (newQty <= 0) {
        FP_CART.remove(id);
        return;
      }
      var items = loadState();
      var item = items.find(function (i) { return i.id === id; });
      if (item) {
        item.qty = newQty;
        saveState(items);
        FP_CART.syncUI();
      }
    },

    get: function () {
      return loadState();
    },

    count: function () {
      return loadState().reduce(function (sum, i) { return sum + (i.qty || 1); }, 0);
    },

    total: function () {
      return loadState().reduce(function (sum, i) { return sum + (i.price * (i.qty || 1)); }, 0);
    },

    open: function () {
      var drawer = document.getElementById('cart-drawer');
      var overlay = document.getElementById('cart-overlay');
      if (drawer) {
        FP_CART._renderDrawerItems();
        drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    },

    close: function () {
      var drawer = document.getElementById('cart-drawer');
      var overlay = document.getElementById('cart-overlay');
      if (drawer) {
        drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    },

    syncUI: function () {
      /* Update all .cart-count badges */
      var count = FP_CART.count();
      var badges = document.querySelectorAll('.cart-count');
      badges.forEach(function (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });

      /* Re-render drawer items if it's open */
      var drawer = document.getElementById('cart-drawer');
      if (drawer && drawer.classList.contains('open')) {
        FP_CART._renderDrawerItems();
      }
    },

    _renderDrawerItems: function () {
      var listEl = document.getElementById('cart-items-list');
      var emptyEl = document.getElementById('cart-empty-state');
      var footerEl = document.getElementById('cart-footer');
      var totalEl = document.getElementById('cart-total-amount');
      if (!listEl) return;

      var items = loadState();

      if (items.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'flex';
        if (footerEl) footerEl.style.display = 'none';
      } else {
        if (emptyEl) emptyEl.style.display = 'none';
        if (footerEl) footerEl.style.display = 'block';

        listEl.innerHTML = items.map(function (item) {
          var spiceLabel = ['', 'Mild', 'Medium-mild', 'Medium', 'Hot', 'Very Hot'][item.spice] || '';
          return '<div class="cart-item" data-id="' + _esc(item.id) + '">' +
            '<div class="cart-item-emoji">' + _esc(item.emoji) + '</div>' +
            '<div class="cart-item-info">' +
              '<div class="cart-item-name">' + _esc(item.name) + '</div>' +
              '<div class="cart-item-origin">' + _esc(item.origin) + (spiceLabel ? ' · ' + spiceLabel : '') + '</div>' +
              '<div class="cart-item-price">€' + (item.price * item.qty).toFixed(2) + '</div>' +
            '</div>' +
            '<div class="cart-item-controls">' +
              '<button class="cart-qty-btn" data-action="dec" data-id="' + _esc(item.id) + '" aria-label="Decrease quantity">−</button>' +
              '<span class="cart-item-qty">' + item.qty + '</span>' +
              '<button class="cart-qty-btn" data-action="inc" data-id="' + _esc(item.id) + '" aria-label="Increase quantity">+</button>' +
              '<button class="cart-remove-btn" data-action="remove" data-id="' + _esc(item.id) + '" aria-label="Remove item">✕</button>' +
            '</div>' +
          '</div>';
        }).join('');

        if (totalEl) {
          totalEl.textContent = '€' + FP_CART.total().toFixed(2);
        }
      }
    }
  };

  function _esc(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Inject CSS ────────────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('fp-cart-styles')) return;
    var style = document.createElement('style');
    style.id = 'fp-cart-styles';
    style.textContent = [
      /* Overlay */
      '#cart-overlay{position:fixed;inset:0;background:rgba(12,10,9,.55);z-index:900;',
        'opacity:0;pointer-events:none;transition:opacity .3s ease;backdrop-filter:blur(2px);}',
      '#cart-overlay.open{opacity:1;pointer-events:all;}',

      /* Drawer */
      '#cart-drawer{position:fixed;top:0;right:0;height:100%;width:420px;max-width:100vw;',
        'background:#1C1917;z-index:901;display:flex;flex-direction:column;',
        'transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);',
        'box-shadow:-8px 0 48px rgba(0,0,0,.35);}',
      '#cart-drawer.open{transform:translateX(0);}',

      /* Header */
      '#cart-header{display:flex;align-items:center;justify-content:space-between;',
        'padding:24px 24px 20px;border-bottom:1px solid rgba(255,255,255,.08);}',
      '#cart-header h2{font-family:"DM Serif Display",serif;font-style:italic;',
        'font-size:22px;color:#FAFAF9;margin:0;}',
      '#cart-header-meta{display:flex;align-items:center;gap:12px;}',
      '.cart-header-count{font-size:12px;color:rgba(255,255,255,.4);font-family:"DM Sans",sans-serif;}',
      '#cart-close-btn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.06);',
        'border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.6);',
        'cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;',
        'transition:all .15s;font-family:"DM Sans",sans-serif;}',
      '#cart-close-btn:hover{background:rgba(255,255,255,.12);color:#FAFAF9;}',

      /* Items list */
      '#cart-items-list{flex:1;overflow-y:auto;padding:16px 24px;',
        'scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;}',
      '#cart-items-list::-webkit-scrollbar{width:4px;}',
      '#cart-items-list::-webkit-scrollbar-track{background:transparent;}',
      '#cart-items-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px;}',

      /* Individual item */
      '.cart-item{display:flex;align-items:flex-start;gap:14px;padding:16px 0;',
        'border-bottom:1px solid rgba(255,255,255,.06);}',
      '.cart-item:last-child{border-bottom:none;}',
      '.cart-item-emoji{width:48px;height:48px;border-radius:10px;',
        'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);',
        'display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}',
      '.cart-item-info{flex:1;min-width:0;}',
      '.cart-item-name{font-family:"DM Serif Display",serif;font-size:15px;',
        'color:#FAFAF9;margin-bottom:3px;line-height:1.3;}',
      '.cart-item-origin{font-size:11px;color:rgba(255,255,255,.35);',
        'font-family:"DM Sans",sans-serif;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;}',
      '.cart-item-price{font-size:14px;font-weight:600;color:#A16207;font-family:"DM Sans",sans-serif;}',
      '.cart-item-controls{display:flex;align-items:center;gap:6px;flex-shrink:0;}',
      '.cart-qty-btn{width:26px;height:26px;border-radius:6px;background:rgba(255,255,255,.08);',
        'border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);',
        'cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;',
        'transition:all .15s;font-family:"DM Sans",sans-serif;line-height:1;}',
      '.cart-qty-btn:hover{background:rgba(161,98,7,.25);border-color:rgba(161,98,7,.4);color:#A16207;}',
      '.cart-item-qty{font-size:14px;font-weight:600;color:#FAFAF9;',
        'font-family:"DM Sans",sans-serif;min-width:18px;text-align:center;}',
      '.cart-remove-btn{width:26px;height:26px;border-radius:6px;background:transparent;',
        'border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.3);',
        'cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;',
        'transition:all .15s;font-family:"DM Sans",sans-serif;margin-left:2px;}',
      '.cart-remove-btn:hover{background:rgba(220,38,38,.15);border-color:rgba(220,38,38,.3);color:#FCA5A5;}',

      /* Empty state */
      '#cart-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;',
        'flex:1;gap:12px;padding:48px 24px;text-align:center;}',
      '#cart-empty-state .empty-icon{font-size:48px;opacity:.4;margin-bottom:4px;}',
      '#cart-empty-state h3{font-family:"DM Serif Display",serif;font-style:italic;',
        'font-size:20px;color:rgba(255,255,255,.55);margin:0;}',
      '#cart-empty-state p{font-size:13px;color:rgba(255,255,255,.3);',
        'font-family:"DM Sans",sans-serif;margin:0;}',
      '#cart-empty-state a{color:#A16207;text-decoration:underline;',
        'font-family:"DM Sans",sans-serif;font-size:14px;transition:color .15s;}',
      '#cart-empty-state a:hover{color:#FCD34D;}',

      /* Footer */
      '#cart-footer{padding:20px 24px 28px;border-top:1px solid rgba(255,255,255,.08);',
        'background:#1C1917;}',
      '#cart-footer-totals{display:flex;align-items:center;justify-content:space-between;',
        'margin-bottom:16px;}',
      '.cart-total-label{font-size:13px;color:rgba(255,255,255,.45);font-family:"DM Sans",sans-serif;}',
      '#cart-total-amount{font-family:"DM Serif Display",serif;font-size:22px;color:#FAFAF9;}',
      '.cart-shipping-note{font-size:11px;color:rgba(255,255,255,.25);',
        'font-family:"DM Sans",sans-serif;margin-bottom:14px;text-align:center;}',
      '#cart-checkout-btn{width:100%;padding:16px 24px;background:#A16207;color:#fff;',
        'border:none;border-radius:99px;font-family:"DM Serif Display",serif;',
        'font-style:italic;font-size:18px;cursor:pointer;transition:all .2s ease;',
        'display:flex;align-items:center;justify-content:center;gap:8px;}',
      '#cart-checkout-btn:hover{background:#92400E;transform:translateY(-1px);',
        'box-shadow:0 8px 24px rgba(161,98,7,.35);}',

      /* Cart trigger button (nav) */
      '.cart-trigger{position:relative;width:40px;height:40px;border-radius:50%;',
        'background:transparent;border:1.5px solid rgba(255,255,255,.15);',
        'cursor:pointer;display:flex;align-items:center;justify-content:center;',
        'transition:all .15s;color:inherit;}',
      '.cart-trigger:hover{background:rgba(255,255,255,.06);}',
      '.cart-trigger svg{width:18px;height:18px;}',
      '.cart-count{position:absolute;top:-5px;right:-5px;',
        'min-width:18px;height:18px;border-radius:99px;',
        'background:#A16207;color:#fff;',
        'font-size:10px;font-weight:700;font-family:"DM Sans",sans-serif;',
        'display:flex;align-items:center;justify-content:center;padding:0 4px;',
        'line-height:1;}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ── Inject Drawer HTML ────────────────────────────────────────────── */
  function injectDrawer() {
    if (document.getElementById('cart-drawer')) return;

    /* Overlay */
    var overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.addEventListener('click', FP_CART.close);
    document.body.appendChild(overlay);

    /* Drawer */
    var drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Shopping cart');
    drawer.setAttribute('aria-modal', 'true');
    drawer.innerHTML =
      '<div id="cart-header">' +
        '<h2>Your Cart</h2>' +
        '<div id="cart-header-meta">' +
          '<span class="cart-header-count" id="cart-header-count-text"></span>' +
          '<button id="cart-close-btn" aria-label="Close cart">✕</button>' +
        '</div>' +
      '</div>' +

      '<div id="cart-empty-state" style="display:flex;">' +
        '<div class="empty-icon">🧳</div>' +
        '<h3>Your cart is empty</h3>' +
        '<p>Add a flavor to start your journey.</p>' +
        '<a href="#products" id="cart-start-link">Start exploring →</a>' +
      '</div>' +

      '<div id="cart-items-list"></div>' +

      '<div id="cart-footer" style="display:none;">' +
        '<div id="cart-footer-totals">' +
          '<span class="cart-total-label">Total (excl. shipping)</span>' +
          '<span id="cart-total-amount">€0.00</span>' +
        '</div>' +
        '<p class="cart-shipping-note">Free shipping on orders over €40</p>' +
        '<button id="cart-checkout-btn">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>' +
          'Checkout' +
        '</button>' +
      '</div>';

    document.body.appendChild(drawer);

    /* Close button */
    drawer.querySelector('#cart-close-btn').addEventListener('click', FP_CART.close);

    /* Checkout button */
    drawer.querySelector('#cart-checkout-btn').addEventListener('click', function () {
      alert('Coming soon — we\'ll email you when checkout is live!');
    });

    /* "Start exploring" link — close drawer when clicked */
    var startLink = drawer.querySelector('#cart-start-link');
    if (startLink) {
      startLink.addEventListener('click', function () {
        FP_CART.close();
      });
    }

    /* Delegated clicks for qty / remove buttons */
    drawer.querySelector('#cart-items-list').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var id = btn.dataset.id;
      if (action === 'inc') {
        var items = loadState();
        var item = items.find(function (i) { return i.id === id; });
        if (item) FP_CART.updateQty(id, item.qty + 1);
      } else if (action === 'dec') {
        var items2 = loadState();
        var item2 = items2.find(function (i) { return i.id === id; });
        if (item2) FP_CART.updateQty(id, item2.qty - 1);
      } else if (action === 'remove') {
        FP_CART.remove(id);
      }
    });

    /* Keyboard trap: Escape closes drawer */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') FP_CART.close();
    });
  }

  /* ── Init ──────────────────────────────────────────────────────────── */
  function init() {
    injectCSS();
    injectDrawer();
    FP_CART.syncUI();

    /* Update count text in header whenever drawer renders */
    var origSync = FP_CART.syncUI;
    FP_CART.syncUI = function () {
      origSync.call(FP_CART);
      var headerCount = document.getElementById('cart-header-count-text');
      if (headerCount) {
        var c = FP_CART.count();
        headerCount.textContent = c > 0 ? c + (c === 1 ? ' item' : ' items') : '';
      }
    };
    FP_CART.syncUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose globally */
  window.FP_CART = FP_CART;

}());
