(function () {
  function formatMoney(cents, moneyFormat) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }

    const value = Number(cents || 0) / 100;
    const formatted = value.toFixed(2);

    if (!moneyFormat) {
      return '$' + formatted;
    }

    return moneyFormat
      .replace(/\{\{\s*amount\s*\}\}/, formatted)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(value).toString())
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, formatted.replace('.', ','));
  }

  function initFeaturedProductBuilder(section) {
    if (!section || section.dataset.fpbReady === 'true') {
      return;
    }

    section.dataset.fpbReady = 'true';

    const productScript = section.querySelector('[data-product-json]');
    const form = section.querySelector('[data-fpb-product-form]');

    if (!productScript || !form) {
      return;
    }

    const product = JSON.parse(productScript.textContent);
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

    let galleryIndex = 0;
    let selectedVariant = product.variants.find(function (variant) {
      return String(variant.id) === String(variantInput ? variantInput.value : '');
    }) || product.variants[0];

    function showGalleryImage(index) {
      if (!dots.length || !mainImage) {
        return;
      }

      galleryIndex = (index + dots.length) % dots.length;

      const dot = dots[galleryIndex];
      mainImage.src = dot.dataset.src;
      mainImage.srcset = '';
      mainImage.alt = dot.dataset.alt || product.title;

      dots.forEach(function (item, itemIndex) {
        item.classList.toggle('is-active', itemIndex === galleryIndex);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showGalleryImage(index);
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showGalleryImage(galleryIndex - 1);
      });
    }

    if (next) {
      next.addEventListener('click', function () {
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

    function getSelectedOptions() {
      const groups = {};

      optionInputs.forEach(function (input) {
        if (input.checked) {
          const fieldset = input.closest('[data-fpb-option-index]');
          if (fieldset) {
            groups[fieldset.dataset.fpbOptionIndex] = input.value;
          }
        }
      });

      return Object.keys(groups)
        .sort(function (a, b) { return Number(a) - Number(b); })
        .map(function (key) { return groups[key]; });
    }

    function findVariantFromOptions() {
      const selectedOptions = getSelectedOptions();

      if (!selectedOptions.length) {
        return selectedVariant;
      }

      return product.variants.find(function (variant) {
        return variant.options.every(function (option, index) {
          return option === selectedOptions[index];
        });
      });
    }

    function updateWhatsAppLink() {
      if (!whatsappLink || !selectedVariant) {
        return;
      }

      const number = whatsappLink.dataset.number || '';
      const baseMessage = whatsappLink.dataset.message || 'Hello, I am interested in this product.';
      const quantity = quantityInput ? Math.max(1, Number(quantityInput.value || 1)) : 1;

      const fullMessage = baseMessage + '\n\nProduct: ' + product.title + '\nVariant: ' + selectedVariant.title + '\nQuantity: ' + quantity;
      whatsappLink.href = 'https://wa.me/' + encodeURIComponent(number) + '?text=' + encodeURIComponent(fullMessage);
    }

    function updateVariantUI() {
      const variant = findVariantFromOptions();

      if (!variant) {
        if (addButton) {
          addButton.disabled = true;
        }

        if (addText) {
          addText.textContent = 'Unavailable';
        }

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

      if (addText) {
        addText.textContent = variant.available ? 'Add to Bag →' : 'Sold out';
      }

      if (variant.featured_image && mainImage) {
        mainImage.src = variant.featured_image.src;
        mainImage.srcset = '';
        mainImage.alt = variant.featured_image.alt || product.title;
      }

      updateWhatsAppLink();
    }

    optionInputs.forEach(function (input) {
      input.addEventListener('change', updateVariantUI);
    });

    section.querySelectorAll('[data-fpb-qty-minus]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!quantityInput) {
          return;
        }

        quantityInput.value = Math.max(1, Number(quantityInput.value || 1) - 1);
        updateWhatsAppLink();
      });
    });

    section.querySelectorAll('[data-fpb-qty-plus]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!quantityInput) {
          return;
        }

        quantityInput.value = Math.max(1, Number(quantityInput.value || 1) + 1);
        updateWhatsAppLink();
      });
    });

    if (quantityInput) {
      quantityInput.addEventListener('change', function () {
        quantityInput.value = Math.max(1, Number(quantityInput.value || 1));
        updateWhatsAppLink();
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!selectedVariant || !selectedVariant.available || !addButton) {
        return;
      }

      const originalText = addText ? addText.textContent : '';
      const quantity = quantityInput ? Math.max(1, Number(quantityInput.value || 1)) : 1;

      addButton.disabled = true;

      if (addText) {
        addText.textContent = 'Adding...';
      }

      if (messageEl) {
        messageEl.classList.remove('is-visible', 'is-error');
        messageEl.textContent = '';
      }

      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: Number(selectedVariant.id),
          quantity: quantity
        })
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Cart add failed');
          }

          return response.json();
        })
        .then(function (item) {
          if (messageEl) {
            messageEl.textContent = item.product_title + ' added to cart successfully!';
            messageEl.classList.add('is-visible');
          }

          document.dispatchEvent(new CustomEvent('cart:refresh'));
          document.dispatchEvent(new CustomEvent('cart:updated'));
          window.dispatchEvent(new CustomEvent('cart:refresh'));
          window.dispatchEvent(new CustomEvent('cart:updated'));
        })
        .catch(function () {
          if (messageEl) {
            messageEl.textContent = 'Error adding to cart. Please try again.';
            messageEl.classList.add('is-visible', 'is-error');
          }
        })
        .finally(function () {
          window.setTimeout(function () {
            addButton.disabled = !selectedVariant.available;

            if (addText) {
              addText.textContent = selectedVariant.available ? originalText : 'Sold out';
            }

            if (messageEl) {
              messageEl.classList.remove('is-visible', 'is-error');
            }
          }, 1800);
        });
    });

    section.querySelectorAll('[data-fpb-collapsible-button]').forEach(function (button) {
      const content = button.parentElement.querySelector('[data-fpb-collapsible-content]');

      button.addEventListener('click', function () {
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

        if (content) {
          content.hidden = isOpen;
        }
      });
    });

    section.querySelectorAll('[data-fpb-review-link]').forEach(function (button) {
      button.addEventListener('click', function () {
        const targetSelector = button.dataset.target || '#shopify-product-reviews';
        const target = document.querySelector(targetSelector) || document.querySelector('[data-reviews]');

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

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
