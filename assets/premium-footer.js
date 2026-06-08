(function () {
  function initPremiumFooter(footer) {
    if (!footer || footer.dataset.premiumFooterReady === 'true') {
      return;
    }

    footer.dataset.premiumFooterReady = 'true';

    footer.querySelectorAll('[data-premium-footer-top]').forEach(function (button) {
      button.addEventListener('click', function () {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
  }

  function initAllPremiumFooters() {
    document.querySelectorAll('[data-premium-footer]').forEach(function (footer) {
      initPremiumFooter(footer);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPremiumFooters);
  } else {
    initAllPremiumFooters();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const footer = event.target.querySelector('[data-premium-footer]');

    if (footer) {
      initPremiumFooter(footer);
    }
  });
})();
