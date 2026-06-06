(function () {
  function initEditorialImageCollage(section) {
    if (!section || section.dataset.animate !== 'true') {
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
})();
