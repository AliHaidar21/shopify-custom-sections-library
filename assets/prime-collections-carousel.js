(function () {
  function initPrimeCollectionsCarousel(section) {
    if (!section || section.dataset.primeCollectionsReady === 'true') {
      return;
    }

    section.dataset.primeCollectionsReady = 'true';

    var track = section.querySelector('[data-pcc-track]');
    var progress = section.querySelector('[data-pcc-progress]');
    var prev = section.querySelector('[data-pcc-prev]');
    var next = section.querySelector('[data-pcc-next]');

    if (!track) {
      return;
    }

    function getScrollAmount() {
      var card = track.querySelector('.prime-collections-carousel__card');
      var gap = 24;

      if (window.getComputedStyle) {
        var styles = window.getComputedStyle(track);
        gap = parseFloat(styles.columnGap || styles.gap || 24) || 24;
      }

      if (!card) {
        return track.clientWidth * 0.8;
      }

      return card.getBoundingClientRect().width + gap;
    }

    function updateProgress() {
      if (!progress) {
        return;
      }

      var maxScroll = track.scrollWidth - track.clientWidth;

      if (maxScroll <= 0) {
        progress.style.width = '100%';
        return;
      }

      var percent = Math.max(0, Math.min(100, (track.scrollLeft / maxScroll) * 100));
      progress.style.width = percent + '%';
    }

    function scrollByCard(direction) {
      track.scrollBy({
        left: getScrollAmount() * direction,
        behavior: 'smooth'
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        scrollByCard(-1);
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        scrollByCard(1);
      });
    }

    track.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    updateProgress();
    window.setTimeout(updateProgress, 250);
  }

  function initAllPrimeCollectionsCarousels() {
    document.querySelectorAll('[data-prime-collections-carousel]').forEach(function (section) {
      initPrimeCollectionsCarousel(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPrimeCollectionsCarousels);
  } else {
    initAllPrimeCollectionsCarousels();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var section = event.target.querySelector('[data-prime-collections-carousel]');

    if (section) {
      initPrimeCollectionsCarousel(section);
    }
  });
})();
