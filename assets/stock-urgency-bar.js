(function () {
  function initStockUrgencyBar(section) {
    if (!section || section.dataset.stockUrgencyReady === 'true') {
      return;
    }

    section.dataset.stockUrgencyReady = 'true';

    var fill = section.querySelector('[data-stock-urgency-fill]');
    var targetPercent = Number(section.dataset.targetPercent || 0);
    var shouldAnimate = section.dataset.animateFill === 'true';

    if (!fill) {
      return;
    }

    targetPercent = Math.max(0, Math.min(100, targetPercent));

    if (!shouldAnimate) {
      fill.style.width = targetPercent + '%';
      return;
    }

    fill.style.width = '0%';

    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        fill.style.width = targetPercent + '%';
      }, 120);
    });
  }

  function initAllStockUrgencyBars() {
    document.querySelectorAll('[data-stock-urgency-bar]').forEach(function (section) {
      initStockUrgencyBar(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllStockUrgencyBars);
  } else {
    initAllStockUrgencyBars();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var section = event.target.querySelector('[data-stock-urgency-bar]');

    if (section) {
      section.dataset.stockUrgencyReady = 'false';
      initStockUrgencyBar(section);
    }
  });
})();
