(function () {
  function getRootUrl() {
    if (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) {
      return window.Shopify.routes.root;
    }

    return '/';
  }

  function updateCartCount(cart) {
    if (!cart || typeof cart.item_count === 'undefined') {
      return;
    }

    const count = String(cart.item_count);
    const selectors = [
      '[data-cart-count]',
      '[data-cart-count-bubble]',
      '.cart-count-bubble span[aria-hidden="true"]',
      '.cart-count-bubble span:not(.visually-hidden)',
      '#CartCount',
      '.site-header__cart-count',
      '.cart-link__bubble-num'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.textContent = count;
      });
    });

    document.querySelectorAll('.cart-count-bubble').forEach((bubble) => {
      bubble.style.display = cart.item_count > 0 ? '' : 'none';
    });
  }

  function dispatchCartEvents(cart, addedData) {
    const detail = {
      cart: cart,
      added: addedData
    };

    document.dispatchEvent(new CustomEvent('cart:refresh', { detail: detail }));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: detail }));
    document.dispatchEvent(new CustomEvent('cart:change', { detail: detail }));
    document.dispatchEvent(new CustomEvent('ajaxProduct:added', { detail: detail }));

    window.dispatchEvent(new CustomEvent('cart:refresh', { detail: detail }));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: detail }));
  }

  function tryOpenCartDrawer() {
    document.dispatchEvent(new CustomEvent('cart:open'));
    window.dispatchEvent(new CustomEvent('cart:open'));

    const drawerTriggers = [
      '[data-cart-drawer-toggle]',
      '[data-cart-toggle]',
      '[data-drawer-open="cart"]',
      '[aria-controls="CartDrawer"]',
      '.js-drawer-open-cart'
    ];

    const trigger = drawerTriggers
      .map((selector) => document.querySelector(selector))
      .find(Boolean);

    if (trigger) {
      trigger.click();
    }
  }

  async function fetchCart() {
    const response = await fetch(getRootUrl() + 'cart.js', {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Unable to fetch cart.');
    }

    return response.json();
  }

  async function addToCart(variantId, quantity) {
    const response = await fetch(getRootUrl() + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            id: Number(variantId),
            quantity: Number(quantity)
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data && data.description ? data.description : 'Unable to add item to cart.';
      throw new Error(message);
    }

    return data;
  }

  async function applyDiscount(discountCode) {
    if (!discountCode) {
      return null;
    }

    const response = await fetch(getRootUrl() + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        discount: discountCode
      })
    });

    if (!response.ok) {
      throw new Error('Item was added, but the discount code could not be applied.');
    }

    return response.json();
  }

  function setMessage(section, text, isError) {
    const message = section.querySelector('[data-offer-message]');

    if (!message) {
      return;
    }

    message.textContent = text || '';
    message.classList.toggle('is-error', Boolean(isError));
  }

  function setButtonLoading(button, isLoading) {
    if (!button) {
      return;
    }

    if (isLoading) {
      button.dataset.originalText = button.textContent.trim();
      button.classList.add('is-loading');
      button.disabled = true;

      if (button.dataset.loadingText) {
        button.setAttribute('aria-label', button.dataset.loadingText);
      }

      return;
    }

    button.classList.remove('is-loading');
    button.disabled = false;

    if (button.dataset.originalText) {
      button.removeAttribute('aria-label');
    }
  }

  async function handleOfferClick(section, button) {
    const variantId = button.dataset.variantId;
    const quantity = button.dataset.quantity || '1';
    const discountCode = button.dataset.discountCode || '';
    const afterAdd = section.dataset.afterAdd || 'stay';
    const shouldOpenDrawer = section.dataset.openDrawer === 'true';

    if (!variantId) {
      setMessage(section, 'Choose a product or variant ID first.', true);
      return;
    }

    setMessage(section, '', false);
    setButtonLoading(button, true);

    try {
      const addedData = await addToCart(variantId, quantity);

      if (discountCode) {
        await applyDiscount(discountCode);
      }

      const cart = await fetchCart();

      updateCartCount(cart);
      dispatchCartEvents(cart, addedData);

      setMessage(section, button.dataset.successText || 'Added to cart.', false);

      if (afterAdd === 'cart') {
        window.location.href = getRootUrl() + 'cart';
        return;
      }

      if (afterAdd === 'checkout') {
        window.location.href = getRootUrl() + 'checkout';
        return;
      }

      if (shouldOpenDrawer) {
        tryOpenCartDrawer();
      }
    } catch (error) {
      setMessage(section, error.message || 'Something went wrong. Please try again.', true);
    } finally {
      setButtonLoading(button, false);
    }
  }

  function initTwoOptionOffer(section) {
    const buttons = section.querySelectorAll('[data-offer-button]');

    buttons.forEach((button) => {
      if (button.dataset.twoOptionReady === 'true') {
        return;
      }

      button.dataset.twoOptionReady = 'true';

      button.addEventListener('click', () => {
        handleOfferClick(section, button);
      });
    });
  }

  function initAllTwoOptionOffers() {
    document.querySelectorAll('.two-option-offer').forEach((section) => {
      initTwoOptionOffer(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllTwoOptionOffers);
  } else {
    initAllTwoOptionOffers();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.two-option-offer');

    if (section) {
      initTwoOptionOffer(section);
    }
  });
})();
