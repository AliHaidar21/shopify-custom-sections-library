(function () {
  function getRootUrl(section) {
    const root = section.dataset.rootUrl || '/';
    return root.endsWith('/') ? root : root + '/';
  }

  function formatMoney(cents, format) {
    const value = Number(cents || 0) / 100;
    const amount = value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (!format) {
      return '$' + amount;
    }

    return format
      .replace(/\{\{\s*amount\s*\}\}/g, amount)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, Math.round(value).toLocaleString())
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, amount.replace('.', ','));
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return escapeHTML(value).replace(/`/g, '&#096;');
  }

  function setOpen(element, isOpen) {
    if (!element) {
      return;
    }

    element.classList.toggle('is-open', isOpen);
    element.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.classList.toggle('premium-header-no-scroll', Boolean(document.querySelector('.premium-header__cart-drawer.is-open, .premium-header__mobile-drawer.is-open, .premium-header__search-modal.is-open')));
  }

  function getItemVariantText(item) {
    if (!item.options_with_values || !item.options_with_values.length) {
      return item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
    }

    return item.options_with_values
      .filter(function (option) {
        return option.value && option.value !== 'Default Title';
      })
      .map(function (option) {
        return option.name + ': ' + option.value;
      })
      .join(' / ');
  }

  function updateCount(section, cart) {
    const count = Number(cart && cart.item_count ? cart.item_count : 0);
    const countText = String(count);
    const readableText = count === 1 ? '1 item' : count + ' items';

    section.querySelectorAll('[data-ph-cart-count]').forEach(function (element) {
      element.textContent = countText;
    });

    section.querySelectorAll('[data-ph-cart-count-sr]').forEach(function (element) {
      element.textContent = readableText;
    });

    section.querySelectorAll('[data-ph-cart-count-bubble]').forEach(function (bubble) {
      bubble.classList.toggle('is-hidden', count === 0);
    });

    const drawerCount = section.querySelector('[data-ph-cart-drawer-count]');
    if (drawerCount) {
      drawerCount.textContent = readableText;
    }
  }

  async function fetchCart(section) {
    const response = await fetch(getRootUrl(section) + 'cart.js', {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Could not fetch cart.');
    }

    return response.json();
  }

  async function changeCartLine(section, line, quantity) {
    const response = await fetch(getRootUrl(section) + 'cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        line: Number(line),
        quantity: Number(quantity)
      })
    });

    if (!response.ok) {
      throw new Error('Could not update cart.');
    }

    return response.json();
  }

  function dispatchCartEvents(cart) {
    const detail = {
      cart: cart
    };

    document.dispatchEvent(new CustomEvent('cart:refresh', { detail: detail }));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: detail }));
    document.dispatchEvent(new CustomEvent('cart:change', { detail: detail }));

    window.dispatchEvent(new CustomEvent('cart:refresh', { detail: detail }));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: detail }));
    window.dispatchEvent(new CustomEvent('cart:change', { detail: detail }));
  }

  function renderCart(section, cart) {
    updateCount(section, cart);

    const body = section.querySelector('[data-ph-cart-body]');
    const subtotal = section.querySelector('[data-ph-cart-subtotal]');
    const footer = section.querySelector('[data-ph-cart-footer]');
    const moneyFormat = section.dataset.moneyFormat || '';

    if (subtotal) {
      subtotal.textContent = formatMoney(cart.total_price, moneyFormat);
    }

    if (!body) {
      return;
    }

    if (!cart.items || !cart.items.length) {
      body.innerHTML = '<div class="premium-header__cart-empty">' + escapeHTML(section.querySelector('[data-ph-cart-drawer]') ? 'Your cart is empty.' : 'Your cart is empty.') + '</div>';
      if (footer) {
        footer.style.display = 'none';
      }
      return;
    }

    if (footer) {
      footer.style.display = '';
    }

    body.innerHTML = '<div class="premium-header__cart-items">' + cart.items.map(function (item, index) {
      const line = index + 1;
      const image = item.image
        ? '<img src="' + escapeAttr(item.image) + '" alt="' + escapeAttr(item.product_title) + '" loading="lazy">'
        : '';
      const variantText = getItemVariantText(item);

      return (
        '<div class="premium-header__cart-item" data-ph-cart-line="' + line + '">' +
          '<a class="premium-header__cart-image" href="' + escapeAttr(item.url) + '">' + image + '</a>' +
          '<div class="premium-header__cart-info">' +
            '<a class="premium-header__cart-title" href="' + escapeAttr(item.url) + '">' + escapeHTML(item.product_title) + '</a>' +
            (variantText ? '<div class="premium-header__cart-variant">' + escapeHTML(variantText) + '</div>' : '') +
            '<div class="premium-header__cart-qty">' +
              '<button type="button" data-ph-cart-qty-minus aria-label="Decrease quantity">-</button>' +
              '<span>' + item.quantity + '</span>' +
              '<button type="button" data-ph-cart-qty-plus aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="premium-header__cart-price">' +
            formatMoney(item.final_line_price, moneyFormat) +
            '<button type="button" class="premium-header__cart-remove" data-ph-cart-remove>Remove</button>' +
          '</div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  async function refreshCart(section) {
    const cart = await fetchCart(section);
    renderCart(section, cart);
    return cart;
  }

  function initPremiumHeader(section) {
    if (!section || section.dataset.premiumHeaderReady === 'true') {
      return;
    }

    section.dataset.premiumHeaderReady = 'true';

    const mobileDrawer = section.querySelector('[data-ph-mobile-drawer]');
    const searchModal = section.querySelector('[data-ph-search-modal]');
    const cartDrawer = section.querySelector('[data-ph-cart-drawer]');
    const cartBody = section.querySelector('[data-ph-cart-body]');
    const searchInput = section.querySelector('[data-ph-search-input]');

    section.querySelectorAll('[data-ph-mobile-open]').forEach(function (button) {
      button.addEventListener('click', function () {
        setOpen(mobileDrawer, true);
      });
    });

    section.querySelectorAll('[data-ph-mobile-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        setOpen(mobileDrawer, false);
      });
    });

    section.querySelectorAll('[data-ph-search-open]').forEach(function (button) {
      button.addEventListener('click', function () {
        setOpen(searchModal, true);
        window.setTimeout(function () {
          if (searchInput) {
            searchInput.focus();
          }
        }, 80);
      });
    });

    section.querySelectorAll('[data-ph-search-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        setOpen(searchModal, false);
      });
    });

    section.querySelectorAll('[data-ph-cart-open]').forEach(function (button) {
      button.addEventListener('click', async function () {
        setOpen(cartDrawer, true);

        if (cartBody) {
          cartBody.innerHTML = '<div class="premium-header__cart-loading">Loading cart...</div>';
        }

        try {
          await refreshCart(section);
        } catch (error) {
          if (cartBody) {
            cartBody.innerHTML = '<div class="premium-header__cart-empty">Could not load cart.</div>';
          }
        }
      });
    });

    section.querySelectorAll('[data-ph-cart-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        setOpen(cartDrawer, false);
      });
    });

    if (cartBody) {
      cartBody.addEventListener('click', async function (event) {
        const item = event.target.closest('[data-ph-cart-line]');

        if (!item) {
          return;
        }

        const line = item.dataset.phCartLine;
        const quantityText = item.querySelector('.premium-header__cart-qty span');
        const currentQuantity = Number(quantityText ? quantityText.textContent : 1);

        let nextQuantity = currentQuantity;

        if (event.target.closest('[data-ph-cart-qty-minus]')) {
          nextQuantity = Math.max(0, currentQuantity - 1);
        } else if (event.target.closest('[data-ph-cart-qty-plus]')) {
          nextQuantity = currentQuantity + 1;
        } else if (event.target.closest('[data-ph-cart-remove]')) {
          nextQuantity = 0;
        } else {
          return;
        }

        event.preventDefault();

        try {
          cartBody.classList.add('is-loading');
          const cart = await changeCartLine(section, line, nextQuantity);
          renderCart(section, cart);
          dispatchCartEvents(cart);
        } catch (error) {
          await refreshCart(section).catch(function () {});
        } finally {
          cartBody.classList.remove('is-loading');
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') {
        return;
      }

      setOpen(mobileDrawer, false);
      setOpen(searchModal, false);
      setOpen(cartDrawer, false);
    });

    document.addEventListener('cart:updated', function (event) {
      if (event.detail && event.detail.cart) {
        renderCart(section, event.detail.cart);
      } else {
        refreshCart(section).catch(function () {});
      }
    });

    document.addEventListener('cart:refresh', function (event) {
      if (event.detail && event.detail.cart) {
        renderCart(section, event.detail.cart);
      } else {
        refreshCart(section).catch(function () {});
      }
    });

    refreshCart(section).catch(function () {});
  }

  function initAllPremiumHeaders() {
    document.querySelectorAll('[data-premium-header]').forEach(function (section) {
      initPremiumHeader(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPremiumHeaders);
  } else {
    initAllPremiumHeaders();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('[data-premium-header]');

    if (section) {
      initPremiumHeader(section);
    }
  });
})();
