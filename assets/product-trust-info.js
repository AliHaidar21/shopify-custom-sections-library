(function () {
  function initProductTrustInfo(section) {
    const toggles = section.querySelectorAll('.product-trust-info__collapsible-header');

    toggles.forEach((toggle) => {
      if (toggle.dataset.productTrustInfoReady === 'true') {
        return;
      }

      toggle.dataset.productTrustInfoReady = 'true';

      toggle.addEventListener('click', function () {
        const content = toggle.nextElementSibling;
        const icon = toggle.querySelector('.product-trust-info__toggle-icon');

        if (!content) {
          return;
        }

        const isOpen = toggle.getAttribute('aria-expanded') === 'true';

        toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        content.hidden = isOpen;

        if (icon) {
          icon.textContent = isOpen ? '+' : '−';
        }
      });
    });
  }

  function initAllProductTrustInfoSections() {
    const sections = document.querySelectorAll('.product-trust-info');

    sections.forEach((section) => {
      initProductTrustInfo(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllProductTrustInfoSections);
  } else {
    initAllProductTrustInfoSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.product-trust-info');

    if (section) {
      initProductTrustInfo(section);
    }
  });
})();
