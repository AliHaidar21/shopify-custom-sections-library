(function () {
  function initPremiumAnnouncementBar(section) {
    if (!section || section.dataset.premiumAnnouncementReady === 'true') {
      return;
    }

    section.dataset.premiumAnnouncementReady = 'true';

    var track = section.querySelector('.premium-announcement-bar__track');

    if (!track) {
      return;
    }

    track.addEventListener('animationiteration', function () {
      track.style.transform = 'translate3d(0, 0, 0)';
    });
  }

  function initAllPremiumAnnouncementBars() {
    document.querySelectorAll('[data-premium-announcement-bar]').forEach(function (section) {
      initPremiumAnnouncementBar(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPremiumAnnouncementBars);
  } else {
    initAllPremiumAnnouncementBars();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var section = event.target.querySelector('[data-premium-announcement-bar]');

    if (section) {
      initPremiumAnnouncementBar(section);
    }
  });
})();
