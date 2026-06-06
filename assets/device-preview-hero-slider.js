(function () {
  function initDevicePreviewHero(section) {
    if (!section || section.dataset.devicePreviewReady === 'true') {
      return;
    }

    const slides = Array.prototype.slice.call(section.querySelectorAll('[data-device-preview-slide]'));
    const dots = Array.prototype.slice.call(section.querySelectorAll('[data-device-preview-dot]'));
    const prev = section.querySelector('[data-device-preview-prev]');
    const next = section.querySelector('[data-device-preview-next]');

    if (!slides.length) {
      return;
    }

    section.dataset.devicePreviewReady = 'true';

    let index = 0;
    let timer = null;

    function showSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startAutoplay() {
      const shouldAutoplay = section.dataset.autoplay === 'true';
      const interval = parseInt(section.dataset.autoplayInterval, 10) || 5000;

      if (!shouldAutoplay || slides.length < 2 || timer) {
        return;
      }

      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, interval);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        stopAutoplay();
        showSlide(index - 1);
        startAutoplay();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        stopAutoplay();
        showSlide(index + 1);
        startAutoplay();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        stopAutoplay();
        showSlide(Number(dot.dataset.devicePreviewDot || 0));
        startAutoplay();
      });
    });

    section.addEventListener('mouseenter', stopAutoplay);
    section.addEventListener('mouseleave', startAutoplay);

    showSlide(0);
    startAutoplay();
  }

  function initAllDevicePreviewHeroes() {
    document.querySelectorAll('[data-device-preview-hero]').forEach(function (section) {
      initDevicePreviewHero(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllDevicePreviewHeroes);
  } else {
    initAllDevicePreviewHeroes();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('[data-device-preview-hero]');

    if (section) {
      initDevicePreviewHero(section);
    }
  });
})();
