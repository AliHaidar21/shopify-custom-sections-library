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
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, Math.round(value).toLocaleString())
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, amount.replace('.', ','));
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
    window.dispatchEvent(new CustomEvent('cart:change', { detail: detail }));
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

  function parseProduct(section) {
    const productScript = section.querySelector('[data-product-json]');
    const variantsScript = section.querySelector('[data-cfp-variants]');

    if (productScript) {
      try {
        const product = JSON.parse(productScript.textContent || '{}');
        return {
          product: product,
          variants: product.variants || [],
          title: product.title || ''
        };
      } catch (error) {
        return { product: {}, variants: [], title: '' };
      }
    }

    if (variantsScript) {
      try {
        return {
          product: {},
          variants: JSON.parse(variantsScript.textContent || '[]'),
          title: ''
        };
      } catch (error) {
        return { product: {}, variants: [], title: '' };
      }
    }

    return { product: {}, variants: [], title: '' };
  }

  function getSelectedOptions(section) {
    const selected = [];
    const checkedInputs = section.querySelectorAll('[data-cfp-option]:checked, [data-fpb-option]:checked');

    checkedInputs.forEach(function (input) {
      let position = Number(input.dataset.optionPosition || 0);

      if (!position) {
        const group = input.closest('[data-fpb-option-index]');
        if (group) {
          position = Number(group.dataset.fpbOptionIndex || 0) + 1;
        }
      }

      if (!position) {
        position = selected.length + 1;
      }

      selected[position - 1] = input.value;
    });

    return selected.filter(function (value) {
      return typeof value !== 'undefined';
    });
  }

  function findVariant(section, variants, currentVariant) {
    const selectedOptions = getSelectedOptions(section);

    if (!selectedOptions.length && currentVariant) {
      return currentVariant;
    }

    if (!selectedOptions.length && variants.length) {
      return variants[0];
    }

    return variants.find(function (variant) {
      return variant.options.every(function (optionValue, index) {
        return selectedOptions[index] === optionValue;
      });
    });
  }

  function updateVariantSummary(section, variant) {
    const selectedOptions = getSelectedOptions(section);
    const variantTitle = variant && variant.title && variant.title !== 'Default Title' ? variant.title : '';

    const summaryLabel =
      section.querySelector('[data-fpb-summary-label]') ||
      section.querySelector('.featured-product-builder__variant-details summary .featured-product-builder__summary-text > span:first-child') ||
      section.querySelector('.featured-product-builder__variant-details summary > span:first-child');

    const selectedText =
      section.querySelector('[data-fpb-selected-options]') ||
      section.querySelector('.featured-product-builder__variant-details summary small');

    if (summaryLabel && variantTitle) {
      summaryLabel.textContent = variantTitle;
    }

    if (selectedText) {
      selectedText.textContent = selectedOptions.length ? 'Selected: ' + selectedOptions.join(' / ') : '';
    }
  }

  function updateWhatsApp(section, variant, productTitle) {
    const link = section.querySelector('[data-fpb-whatsapp], [data-cfp-whatsapp]');
    if (!link || !variant) {
      return;
    }

    const quantityInput = section.querySelector('[data-cfp-quantity-input], [data-fpb-quantity]');
    const quantity = Math.max(1, Number(quantityInput ? quantityInput.value || 1 : 1));
    const number = (link.dataset.number || '').replace(/[^\d]/g, '');
    const baseMessage = link.dataset.message || 'Hello, I am interested in';
    const moneyFormat = section.dataset.moneyFormat || '';
    const total = formatMoney(variant.price * quantity, moneyFormat);
    const variantText = variant.title && variant.title !== 'Default Title' ? ' - ' + variant.title : '';
    const finalMessage = baseMessage + ' ' + productTitle + variantText + ' quantity ' + quantity + ' for ' + total;

    if (!number) {
      link.href = '#';
      link.classList.add('is-missing-number');
      return;
    }

    link.classList.remove('is-missing-number');
    link.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(finalMessage);
  }

  function updateVariant(section, variant, productTitle) {
    if (!variant) {
      return variant;
    }

    const input = section.querySelector('[data-cfp-variant-input], [data-fpb-variant-id]');
    const price = section.querySelector('[data-cfp-current-price], [data-fpb-price]');
    const comparePrice = section.querySelector('[data-cfp-compare-price], [data-fpb-compare-price]');
    const saleBadge = section.querySelector('[data-cfp-sale-badge], [data-fpb-sale-badge]');
    const addButton = section.querySelector('[data-cfp-add-button], [data-fpb-add-button]');
    const addText = section.querySelector('[data-cfp-add-text], [data-fpb-add-text]');
    const mainImage = section.querySelector('[data-main-product-image], [data-fpb-main-image]');
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
        comparePrice.innerHTML = '';
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
      if (!addText.dataset.defaultText) {
        addText.dataset.defaultText = addText.textContent;
      }

      addText.textContent = variant.available
        ? addText.dataset.defaultText
        : (addButton && addButton.dataset.soldOutText ? addButton.dataset.soldOutText : 'Sold out');
    }

    if (mainImage && variant.featured_image && variant.featured_image.src && mainImage.tagName === 'IMG') {
      mainImage.src = variant.featured_image.src;
      mainImage.srcset = '';
    }

    updateVariantSummary(section, variant);
    updateWhatsApp(section, variant, productTitle);

    return variant;
  }

  function setMessage(section, text, isError) {
    const message = section.querySelector('[data-cfp-message], [data-fpb-cart-message]');

    if (!message) {
      return;
    }

    message.textContent = text || '';
    message.classList.toggle('is-error', Boolean(isError));
    message.classList.toggle('is-visible', Boolean(text));
  }

  function initMedia(section) {
    const thumbs = Array.prototype.slice.call(section.querySelectorAll('[data-cfp-thumb], [data-fpb-gallery-dot]'));
    const mainImage = section.querySelector('[data-main-product-image], [data-fpb-main-image]');
    const prev = section.querySelector('[data-cfp-media-prev], [data-fpb-prev]');
    const next = section.querySelector('[data-cfp-media-next], [data-fpb-next]');
    let index = 0;

    function showImage(nextIndex) {
      if (!thumbs.length || !mainImage) {
        return;
      }

      index = (nextIndex + thumbs.length) % thumbs.length;
      const thumb = thumbs[index];
      const src = thumb.dataset.imageSrc || thumb.dataset.src;

      thumbs.forEach(function (item) {
        item.classList.remove('is-active');
      });

      thumb.classList.add('is-active');

      if (mainImage.tagName === 'IMG' && src) {
        mainImage.src = src;
        mainImage.srcset = '';
      }
    }

    thumbs.forEach(function (thumb, thumbIndex) {
      thumb.addEventListener('click', function (event) {
        event.preventDefault();
        showImage(thumbIndex);
      });
    });

    if (prev) {
      prev.addEventListener('click', function (event) {
        event.preventDefault();
        showImage(index - 1);
      });
    }

    if (next) {
      next.addEventListener('click', function (event) {
        event.preventDefault();
        showImage(index + 1);
      });
    }

    if (thumbs.length) {
      showImage(0);
    }
  }

  function initQuantity(section, getCurrentVariant, productTitle) {
    const input = section.querySelector('[data-cfp-quantity-input], [data-fpb-quantity]');
    const minus = section.querySelector('[data-cfp-quantity-minus], [data-fpb-qty-minus]');
    const plus = section.querySelector('[data-cfp-quantity-plus], [data-fpb-qty-plus]');

    if (!input) {
      return;
    }

    if (minus) {
      minus.addEventListener('click', function (event) {
        event.preventDefault();
        const current = Number(input.value || 1);
        input.value = Math.max(1, current - 1);
        input.dispatchEvent(new Event('change', { bubbles: true }));
        updateWhatsApp(section, getCurrentVariant(), productTitle);
      });
    }

    if (plus) {
      plus.addEventListener('click', function (event) {
        event.preventDefault();
        const current = Number(input.value || 1);
        input.value = current + 1;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        updateWhatsApp(section, getCurrentVariant(), productTitle);
      });
    }

    input.addEventListener('change', function () {
      input.value = Math.max(1, Number(input.value || 1));
      updateWhatsApp(section, getCurrentVariant(), productTitle);
    });
  }

  function initCollapsibles(section) {
    const buttons = section.querySelectorAll('[data-cfp-collapsible-button], [data-fpb-collapsible-button]');

    buttons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();

        const parent = button.closest('.featured-product-builder__collapsible, .custom-featured-product__collapsible');
        const content = parent ? parent.querySelector('[data-cfp-collapsible-content], [data-fpb-collapsible-content]') : null;

        if (!parent || !content) {
          return;
        }

        const isOpen = parent.classList.contains('is-open') || button.getAttribute('aria-expanded') === 'true';

        parent.classList.toggle('is-open', !isOpen);
        button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        content.hidden = isOpen;
      });
    });
  }

  function initVideoCarousels(section) {
    section.querySelectorAll('[data-cfp-video-carousel]').forEach(function (carousel) {
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

    section.querySelectorAll('.featured-product-builder__video').forEach(function (video) {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = false;
      video.play().catch(function () {});
    });
  }

  function initAjaxAddToCart(section) {
    const form = section.querySelector('[data-product-form], [data-fpb-product-form]');
    const button = section.querySelector('[data-cfp-add-button], [data-fpb-add-button]');
    const addText = section.querySelector('[data-cfp-add-text], [data-fpb-add-text]');

    if (!form) {
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
        addText.textContent = button && button.dataset.loadingText ? button.dataset.loadingText : 'Adding...';
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

        const successText = button && button.dataset.successText ? button.dataset.successText : 'Added to cart.';
        setMessage(section, successText, false);

        if (section.dataset.afterAdd === 'cart') {
          window.location.href = getRootUrl(section) + 'cart';
          return;
        }

        if (section.dataset.afterAdd === 'checkout') {
          window.location.href = getRootUrl(section) + 'checkout';
          return;
        }
      } catch (error) {
        const errorText = button && button.dataset.errorText ? button.dataset.errorText : error.message || 'Something went wrong.';
        setMessage(section, errorText, true);
      } finally {
        if (button) {
          button.disabled = false;
        }

        if (addText) {
          addText.textContent = originalText;
        }
      }
    });

    if (button) {
      button.addEventListener('click', function () {
        if (form.requestSubmit) {
          form.requestSubmit();
        }
      });
    }
  }

  function initFeaturedProductBuilder(section) {
    if (!section || section.dataset.cfpReady === 'true') {
      return;
    }

    section.dataset.cfpReady = 'true';

    const parsed = parseProduct(section);
    const variants = parsed.variants;
    const productTitle =
      parsed.title ||
      (section.querySelector('.featured-product-builder__title') ? section.querySelector('.featured-product-builder__title').textContent.trim() : '');

    const variantInput = section.querySelector('[data-cfp-variant-input], [data-fpb-variant-id]');
    let currentVariant = variants.find(function (variant) {
      return variantInput && String(variant.id) === String(variantInput.value);
    }) || variants[0];

    function getCurrentVariant() {
      return currentVariant;
    }

    initMedia(section);

    section.querySelectorAll('[data-cfp-option], [data-fpb-option]').forEach(function (input) {
      input.addEventListener('change', function () {
        const variant = findVariant(section, variants, currentVariant);
        currentVariant = updateVariant(section, variant, productTitle) || currentVariant;
      });
    });

    currentVariant = updateVariant(section, findVariant(section, variants, currentVariant), productTitle) || currentVariant;

    initQuantity(section, getCurrentVariant, productTitle);
    initCollapsibles(section);
    initVideoCarousels(section);
    initAjaxAddToCart(section);
    updateWhatsApp(section, currentVariant, productTitle);
  }

  function initAllFeaturedProductBuilders() {
    document.querySelectorAll('[data-cfp-section]').forEach(function (section) {
      initFeaturedProductBuilder(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllFeaturedProductBuilders);
  } else {
    initAllFeaturedProductBuilders();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('[data-cfp-section]');
    if (section) {
      initFeaturedProductBuilder(section);
    }
  });
})();
