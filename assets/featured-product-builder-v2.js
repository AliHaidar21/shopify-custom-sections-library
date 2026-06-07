(function () {
  function formatMoney(cents, moneyFormat) {
    const numericCents = Number(cents || 0);
    const value = numericCents / 100;
    const amount = value.toFixed(2);
    const amountNoDecimals = Math.round(value).toString();

    if (!moneyFormat || moneyFormat.indexOf('{{') === -1) {
      return '$' + amount;
    }

    return moneyFormat
      .replace(/\{\{\s*amount\s*\}\}/g, amount)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, amountNoDecimals)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, amount.replace('.', ','));
  }

  function showMessage(messageEl, text, isError) {
    if (!messageEl) return;

    messageEl.textContent = text;
    messageEl.classList.toggle('is-error', Boolean(isError));
    messageEl.classList.add('is-visible');

    window.setTimeout(function () {
      messageEl.classList.remove('is-visible', 'is-error');
    }, 2400);
  }

  function dispatchCartEvents(cart) {
    document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { cart: cart || null } }));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cart || null } }));
    document.dispatchEvent(new CustomEvent('cart:change', { detail: { cart: cart || null } }));

    window.dispatchEvent(new CustomEvent('cart:refresh', { detail: { cart: cart || null } }));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cart || null } }));
    window.dispatchEvent(new CustomEvent('cart:change', { detail: { cart: cart || null } }));
  }

  function initFeaturedProductBuilder(section) {
    if (!section || section.dataset.fpbV2Ready === 'true') return;

    section.dataset.fpbV2Ready = 'true';

    const productScript = section.querySelector('[data-product-json]');
    const form = section.querySelector('[data-fpb-product-form]');

    if (!productScript || !form) return;

    let product;

    try {
      product = JSON.parse(productScript.textContent);
    } catch (error) {
      console.error('Featured product builder JSON error:', error);
      return;
    }

    const moneyFormat = form.dataset.moneyFormat || '${{amount}}';

    const mainImage = section.querySelector('[data-fpb-main-image]');
    const dots = Array.prototype.slice.call(section.querySelectorAll('[data-fpb-gallery-dot]'));
    const prev = section.querySelector('[data-fpb-prev]');
    const next = section.querySelector('[data-fpb-next]');
    const optionInputs = Array.prototype.slice.call(section.querySelectorAll('[data-fpb-option]'));
    const variantInput = section.querySelector('[data-fpb-variant-id]');
    const priceEl = section.querySelector('[data-fpb-price]');
    const compareEl = section.querySelector('[data-fpb-compare-price]');
    const addButton = section.querySelector('[data-fpb-add-button]');
    const addText = section.querySelector('[data-fpb-add-text]');
    const quantityInput = section.querySelector('[data-fpb-quantity]');
    const messageEl = section.querySelector('[data-fpb-cart-message]');
    const whatsappLink = section.querySelector('[data-fpb-whatsapp]');
    const selectedOptionsText = section.querySelector('[data-fpb-selected-options]');
    const summaryLabel = section.querySelector('[data-fpb-summary-label]');

    let galleryIndex = 0;

    let selectedVariant = product.variants.find(function (variant) {
      return variantInput && String(variant.id) === String(variantInput.value);
    }) || product.variants[0];

    function getQuantity() {
      if (!quantityInput) return 1;

      const qty = Math.max(1, Number(quantityInput.value || 1));
      quantityInput.value = qty;
      return qty;
    }

    function showGalleryImage(index) {
      if (!dots.length || !mainImage) return;

      galleryIndex = (index + dots.length) % dots.length;

      const dot = dots[galleryIndex];

      if (dot.dataset.src) {
        mainImage.src = dot.dataset.src;
        mainImage.srcset = '';
      }

      if (dot.dataset.alt) {
        mainImage.alt = dot.dataset.alt;
      }

      dots.forEach(function (item, itemIndex) {
        item.classList.toggle('is-active', itemIndex === galleryIndex);
      });
    }

    function getSelectedOptions() {
      const selectedOptions = [];
      const optionGroups = section.querySelectorAll('[data-fpb-option-index]');

      optionGroups.forEach(function (group) {
        const checkedInput = group.querySelector('[data-fpb-option]:checked');

        if (checkedInput) {
          selectedOptions[Number(group.dataset.fpbOptionIndex)] = checkedInput.value;
        }
      });

      return selectedOptions.filter(function (value) {
        return typeof value !== 'undefined';
      });
    }

    function findVariantFromOptions() {
      const selectedOptions = getSelectedOptions();

      if (!selectedOptions.length) return selectedVariant;

      return product.variants.find(function (variant) {
        return variant.options.every(function (option, index) {
          return option === selectedOptions[index];
        });
      });
    }

    function updateVariantSummary() {
      const selectedOptions = getSelectedOptions();
      const variantTitle = selectedVariant && selectedVariant.title && selectedVariant.title !== 'Default Title'
        ? selectedVariant.title
        : '';

      if (summaryLabel) {
        summaryLabel.textContent = variantTitle || summaryLabel.dataset.defaultHeading || 'Choose options';
      }

      if (selectedOptionsText) {
        selectedOptionsText.textContent = selectedOptions.length
          ? 'Selected: ' + selectedOptions.join(' / ')
          : '';
      }
    }

    function updateWhatsAppLink() {
      if (!whatsappLink || !selectedVariant) return;

      const number = (whatsappLink.dataset.number || '').replace(/[^\d]/g, '');
      const baseMessage = whatsappLink.dataset.message || 'Hello, I am interested in';
      const quantity = getQuantity();
      const totalPrice = formatMoney(selectedVariant.price * quantity, moneyFormat);

      const variantText = selectedVariant.title && selectedVariant.title !== 'Default Title'
        ? ' - ' + selectedVariant.title
        : '';

      const fullMessage = baseMessage + ' ' + product.title + variantText + ' quantity ' + quantity + ' for ' + totalPrice;

      if (!number) {
        whatsappLink.href = '#';
        whatsappLink.classList.add('is-missing-number');
        return;
      }

      whatsappLink.classList.remove('is-missing-number');
      whatsappLink.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(fullMessage);
    }

    function updateVariantUI() {
      const variant = findVariantFromOptions();

      if (!variant) {
        if (addButton) addButton.disabled = true;
        if (addText) addText.textContent = 'Unavailable';
        updateVariantSummary();
        return;
      }

      selectedVariant = variant;

      if (variantInput) {
        variantInput.value = variant.id;
      }

      if (priceEl) {
        priceEl.textContent = formatMoney(variant.price, moneyFormat);
      }

      if (compareEl) {
        compareEl.textContent = variant.compare_at_price && variant.compare_at_price > variant.price
          ? formatMoney(variant.compare_at_price, moneyFormat)
          : '';
      }

      if (addButton) {
        addButton.disabled = !variant.available;
      }

      if (addText && addButton) {
        addText.textContent = variant.available
          ? (addButton.dataset.defaultText || 'Add to Bag →')
          : (addButton.dataset.soldOutText || 'Sold out');
      }

      if (variant.featured_image && mainImage) {
        mainImage.src = variant.featured_image.src;
        mainImage.srcset = '';
        mainImage.alt = variant.featured_image.alt || product.title;
      }

      updateVariantSummary();
      updateWhatsAppLink();
    }

    async function addCurrentVariantToCart() {
      if (!selectedVariant || !selectedVariant.available || !addButton) return;

      const quantity = getQuantity();

      addButton.disabled = true;

      if (addText) {
        addText.textContent = addButton.dataset.loadingText || 'Adding...';
      }

      try {
        const addResponse = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            id: Number(selectedVariant.id),
            quantity: quantity
          })
        });

        if (!addResponse.ok) {
          throw new Error('Cart add failed');
        }

        await addResponse.json();

        showMessage(messageEl, addButton.dataset.successText || 'Item added to cart successfully!', false);

        const cartResponse = await fetch('/cart.js', {
          headers: {
            'Accept': 'application/json'
          }
        });

        const cart = cartResponse.ok ? await cartResponse.json() : null;
        dispatchCartEvents(cart);
      } catch (error) {
        showMessage(messageEl, addButton.dataset.errorText || 'Error adding to cart. Please try again.', true);
      } finally {
        window.setTimeout(function () {
          addButton.disabled = !selectedVariant.available;

          if (addText) {
            addText.textContent = selectedVariant.available
              ? (addButton.dataset.defaultText || 'Add to Bag →')
              : (addButton.dataset.soldOutText || 'Sold out');
          }
        }, 900);
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function (event) {
        event.preventDefault();
        showGalleryImage(index);
      });
    });

    if (prev) {
      prev.addEventListener('click', function (event) {
        event.preventDefault();
        showGalleryImage(galleryIndex - 1);
      });
    }

    if (next) {
      next.addEventListener('click', function (event) {
        event.preventDefault();
        showGalleryImage(galleryIndex + 1);
      });
    }

    let touchStartX = 0;

    if (mainImage) {
      mainImage.addEventListener('touchstart', function (event) {
        touchStartX = event.touches[0].clientX;
      }, { passive: true });

      mainImage.addEventListener('touchend', function (event) {
        const diff = event.changedTouches[0].clientX - touchStartX;

        if (Math.abs(diff) > 40) {
          showGalleryImage(galleryIndex + (diff > 0 ? -1 : 1));
        }
      }, { passive: true });
    }

    optionInputs.forEach(function (input) {
      input.addEventListener('change', updateVariantUI);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      addCurrentVariantToCart();
      return false;
    }, true);

    section.addEventListener('click', function (event) {
      const add = event.target.closest('[data-fpb-add-button]');
      const minus = event.target.closest('[data-fpb-qty-minus]');
      const plus = event.target.closest('[data-fpb-qty-plus]');
      const collapsibleButton = event.target.closest('[data-fpb-collapsible-button]');
      const reviewButton = event.target.closest('[data-fpb-review-link]');
      const whatsappButton = event.target.closest('[data-fpb-whatsapp]');

      if (add) {
        event.preventDefault();
        event.stopPropagation();
        addCurrentVariantToCart();
        return;
      }

      if (minus) {
        event.preventDefault();

        if (quantityInput) {
          quantityInput.value = Math.max(1, Number(quantityInput.value || 1) - 1);
          updateWhatsAppLink();
        }

        return;
      }

      if (plus) {
        event.preventDefault();

        if (quantityInput) {
          quantityInput.value = Math.max(1, Number(quantityInput.value || 1) + 1);
          updateWhatsAppLink();
        }

        return;
      }

      if (collapsibleButton) {
        event.preventDefault();

        const content = collapsibleButton.parentElement.querySelector('[data-fpb-collapsible-content]');
        const isOpen = collapsibleButton.getAttribute('aria-expanded') === 'true';

        collapsibleButton.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

        if (content) {
          content.hidden = isOpen;
        }

        return;
      }

      if (reviewButton) {
        event.preventDefault();

        const targetSelector = reviewButton.dataset.target || '#shopify-product-reviews';
        const target = document.querySelector(targetSelector) || document.querySelector('[data-reviews]');

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        return;
      }

      if (whatsappButton && whatsappButton.classList.contains('is-missing-number')) {
        event.preventDefault();
      }
    });

    if (quantityInput) {
      quantityInput.addEventListener('input', updateWhatsAppLink);
      quantityInput.addEventListener('change', function () {
        quantityInput.value = Math.max(1, Number(quantityInput.value || 1));
        updateWhatsAppLink();
      });
    }

    section.querySelectorAll('.featured-product-builder__video').forEach(function (video) {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.controls = false;

      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch(function () {
          const playOnInteraction = function () {
            video.play().catch(function () {});
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
          };

          document.addEventListener('click', playOnInteraction);
          document.addEventListener('touchstart', playOnInteraction);
        });
      }
    });

    if (dots.length) {
      showGalleryImage(0);
    }

    updateVariantUI();
    updateWhatsAppLink();
  }

  function initAllFeaturedProductBuilders() {
    document.querySelectorAll('[data-featured-product-builder]').forEach(function (section) {
      initFeaturedProductBuilder(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllFeaturedProductBuilders);
  } else {
    initAllFeaturedProductBuilders();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('[data-featured-product-builder]');

    if (section) {
      initFeaturedProductBuilder(section);
    }
  });
})();
