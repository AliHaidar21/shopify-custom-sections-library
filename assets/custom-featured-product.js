(function () {
  function getRootUrl(section) {
    const root = section.dataset.rootUrl || '/';
    return root.endsWith('/') ? root : root + '/';
  }

  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }

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
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, Math.round(value).toLocaleString());
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

    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (element) {
        element.textContent = count;
      });
    });

    document.querySelectorAll('.cart-count-bubble').forEach(function (bubble) {
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

  async function fetchCart(section) {
    const response = await fetch(getRootUrl(section) + 'cart.js', {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Unable to refresh cart.');
    }

    return response.json();
  }

  function getSelectedOptions(section) {
    const optionInputs = section.querySelectorAll('[data-cfp-option]:checked');
    const selected = [];

    optionInputs.forEach(function (input) {
      const position = Number(input.dataset.optionPosition || 1);
      selected[position - 1] = input.value;
    });

    return selected;
  }

  function findVariant(section, variants) {
    const selectedOptions = getSelectedOptions(section);

    if (!selectedOptions.length && variants.length) {
      return variants[0];
    }

    return variants.find(function (variant) {
      return variant.options.every(function (optionValue, index) {
        return selectedOptions[index] === optionValue;
      });
    });
  }

  function updateVariant(section, variant) {
    if (!variant) {
      return;
    }

    const input = section.querySelector('[data-cfp-variant-input]');
    const price = section.querySelector('[data-cfp-current-price]');
    const comparePrice = section.querySelector('[data-cfp-compare-price]');
    const saleBadge = section.querySelector('[data-cfp-sale-badge]');
    const addButton = section.querySelector('[data-cfp-add-button]');
    const addText = section.querySelector('[data-cfp-add-text]');
    const mainImage = section.querySelector('[data-main-product-image]');
    const moneyFormat = section.dataset.moneyFormat || '';

    if (input) {
      input.value = variant.id;
    }

    if (price) {
      price.innerHTML = formatMoney(variant.price, moneyFormat);
    }

    if (comparePrice) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        comparePrice.innerHTML = formatMoney(variant.compare_at_price, moneyFormat);
        comparePrice.classList.remove('is-hidden');
      } else {
        comparePrice.classList.add('is-hidden');
      }
    }

    if (saleBadge) {
      saleBadge.classList.toggle('is-hidden', !(variant.compare_at_price && variant.compare_at_price > variant.price));
    }

    if (addButton) {
      addButton.disabled = !variant.available;
    }

    if (addText) {
      if (!variant.available) {
        addText.textContent = 'Sold out';
      } else if (!addText.dataset.defaultText) {
        addText.dataset.defaultText = addText.textContent;
      } else {
        addText.textContent = addText.dataset.defaultText;
      }
    }

    if (mainImage && variant.featured_image && variant.featured_image.src && mainImage.tagName === 'IMG') {
      mainImage.src = variant.featured_image.src;
      mainImage.srcset = '';
    }
  }

  function setMessage(section, text, isError) {
    const message = section.querySelector('[data-cfp-message]');

    if (!message) {
      return;
    }

    message.textContent = text || '';
    message.classList.toggle('is-error', Boolean(isError));
  }

  function initMedia(section) {
    const thumbs = section.querySelectorAll('[data-cfp-thumb]');
    const mainImage = section.querySelector('[data-main-product-image]');

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        thumbs.forEach(function (item) {
          item.classList.remove('is-active');
        });

        thumb.classList.add('is-active');

        if (mainImage && mainImage.tagName === 'IMG' && thumb.dataset.imageSrc) {
          mainImage.src = thumb.dataset.imageSrc;
          mainImage.srcset = '';
        }
      });
    });
  }

  function initQuantity(section) {
    const input = section.querySelector('[data-cfp-quantity-input]');
    const minus = section.querySelector('[data-cfp-quantity-minus]');
    const plus = section.querySelector('[data-cfp-quantity-plus]');

    if (!input) {
      return;
    }

    if (minus) {
      minus.addEventListener('click', function () {
        const current = Number(input.value || 1);
        input.value = Math.max(1, current - 1);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    if (plus) {
      plus.addEventListener('click', function () {
        const current = Number(input.value || 1);
        input.value = current + 1;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }

  function initVariants(section) {
    const variantsScript = section.querySelector('[data-cfp-variants]');
    const optionInputs = section.querySelectorAll('[data-cfp-option]');

    if (!variantsScript || !optionInputs.length) {
      return;
    }

    let variants = [];

    try {
      variants = JSON.parse(variantsScript.textContent || '[]');
    } catch (error) {
      variants = [];
    }

    optionInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        const variant = findVariant(section, variants);
        updateVariant(section, variant);
      });
    });

    const initialVariant = findVariant(section, variants);
    updateVariant(section, initialVariant);
  }

  function initCollapsibles(section) {
    const buttons = section.querySelectorAll('[data-cfp-collapsible-button]');

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const parent = button.closest('.custom-featured-product__collapsible');
        const content = parent ? parent.querySelector('[data-cfp-collapsible-content]') : null;

        if (!parent || !content) {
          return;
        }

        const isOpen = parent.classList.contains('is-open');
        parent.classList.toggle('is-open', !isOpen);
        content.hidden = isOpen;
      });
    });
  }

  function initVideoCarousels(section) {
    const carousels = section.querySelectorAll('[data-cfp-video-carousel]');

    carousels.forEach(function (carousel) {
      const slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-cfp-video-slide]'));
      const prev = carousel.querySelector('[data-cfp-video-prev]');
      const next = carousel.querySelector('[data-cfp-video-next]');
      let index = 0;

      function showSlide(nextIndex) {
        if (!slides.length) {
          return;
        }

        index = (nextIndex + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('is-active', slideIndex === index);

          const video = slide.querySelector('video');
          if (video) {
            video.muted = true;
            video.loop = true;
            video.playsInline = true;

            if (slideIndex === index) {
              video.play().catch(function () {});
            } else {
              video.pause();
            }
          }
        });
      }

      if (prev) {
        prev.addEventListener('click', function () {
          showSlide(index - 1);
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          showSlide(index + 1);
        });
      }

      showSlide(0);
    });
  }

  function initAjaxAddToCart(section) {
    const form = section.querySelector('[data-product-form]');
    const button = section.querySelector('[data-cfp-add-button]');
    const addText = section.querySelector('[data-cfp-add-text]');

    if (!form || section.dataset.ajaxCart !== 'true') {
      return;
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (button && button.disabled) {
        return;
      }

      const originalText = addText ? addText.textContent : '';

      if (button) {
        button.disabled = true;
      }

      if (addText) {
        addText.textContent = 'Adding...';
      }

      setMessage(section, '', false);

      try {
        const response = await fetch(getRootUrl(section) + 'cart/add.js', {
          method: 'POST',
          body: new FormData(form),
          headers: {
            Accept: 'application/json'
          }
        });

        const addedData = await response.json();

        if (!response.ok) {
          throw new Error(addedData.description || 'Unable to add to cart.');
        }

        const cart = await fetchCart(section);
        updateCartCount(cart);
        dispatchCartEvents(cart, addedData);

        setMessage(section, 'Added to cart.', false);

        if (section.dataset.afterAdd === 'cart') {
          window.location.href = getRootUrl(section) + 'cart';
          return;
        }

        if (section.dataset.afterAdd === 'checkout') {
          window.location.href = getRootUrl(section) + 'checkout';
          return;
        }
      } catch (error) {
        setMessage(section, error.message || 'Something went wrong.', true);
      } finally {
        if (button) {
          button.disabled = false;
        }

        if (addText) {
          addText.textContent = originalText;
        }
      }
    });
  }

  function initCustomFeaturedProduct(section) {
    if (!section || section.dataset.cfpReady === 'true') {
      return;
    }

    section.dataset.cfpReady = 'true';

    initMedia(section);
    initQuantity(section);
    initVariants(section);
    initCollapsibles(section);
    initVideoCarousels(section);
    initAjaxAddToCart(section);
  }

  function initAllCustomFeaturedProducts() {
    document.querySelectorAll('[data-cfp-section]').forEach(function (section) {
      initCustomFeaturedProduct(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllCustomFeaturedProducts);
  } else {
    initAllCustomFeaturedProducts();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('[data-cfp-section]');

    if (section) {
      initCustomFeaturedProduct(section);
    }
  });
})();
