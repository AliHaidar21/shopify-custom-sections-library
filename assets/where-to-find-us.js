(function () {
  function initWhereToFindUs(section) {
    if (!section || section.dataset.whereToFindUsReady === 'true') {
      return;
    }

    section.dataset.whereToFindUsReady = 'true';

    const cards = section.querySelectorAll('[data-location-card]');

    function closeAllCards() {
      cards.forEach(function (card) {
        card.classList.remove('is-active');
      });
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function (event) {
        event.stopPropagation();

        const isActive = card.classList.contains('is-active');
        closeAllCards();

        if (!isActive) {
          card.classList.add('is-active');
        }
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('[data-where-to-find-us]')) {
        closeAllCards();
      }
    });
  }

  function initAllWhereToFindUsSections() {
    document.querySelectorAll('[data-where-to-find-us]').forEach(function (section) {
      initWhereToFindUs(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllWhereToFindUsSections);
  } else {
    initAllWhereToFindUsSections();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('[data-where-to-find-us]');

    if (section) {
      initWhereToFindUs(section);
    }
  });
})();
