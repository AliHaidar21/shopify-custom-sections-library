(function () {
  function syncEditorialHeight(section) {
    if (!section || section.dataset.matchTextHeight !== 'true') {
      return;
    }

    if (window.innerWidth <= 968) {
      section.style.removeProperty('--eic-matched-height');
      return;
    }

    const textInner = section.querySelector('.editorial-image-collage__text-inner');

    if (!textInner) {
      return;
    }

    const height = Math.ceil(textInner.getBoundingClientRect().height);
    section.style.setProperty('--eic-matched-height', height + 'px');
  }

  function initEditorialImageCollage(section) {
    if (!section) {
      return;
    }

    syncEditorialHeight(section);

    if (section.dataset.animate !== 'true') {
      section.classList.add('is-visible');
      return;
    }

    if (section.dataset.editorialReady === 'true') {
      return;
    }

    section.dataset.editorialReady = 'true';

    if (!('IntersectionObserver' in window)) {
      section.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            section.classList.add('is-visible');
            observer.unobserve(section);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
  }

  function initAllEditorialImageCollages() {
    document.querySelectorAll('.editorial-image-collage').forEach(function (section) {
      initEditorialImageCollage(section);
    });
  }

  let resizeTimer = null;

  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      document.querySelectorAll('.editorial-image-collage').forEach(function (section) {
        syncEditorialHeight(section);
      });
    }, 120);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllEditorialImageCollages);
  } else {
    initAllEditorialImageCollages();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.editorial-image-collage');

    if (section) {
      initEditorialImageCollage(section);
    }
  });

  document.addEventListener('shopify:block:select', function (event) {
    const section = event.target.closest('.editorial-image-collage');

    if (section) {
      syncEditorialHeight(section);
    }
  });
})();
