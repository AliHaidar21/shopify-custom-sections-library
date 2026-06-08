(function () {
  function initPremiumAnnouncementBar(section) {
    if (!section || section.dataset.premiumAnnouncementReady === 'true') {
      return;
    }

    section.dataset.premiumAnnouncementReady = 'true';

    const track = section.querySelector('[data-pab-track]');

    section.querySelectorAll('[data-pab-nudge]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!track) {
          return;
        }

        const direction = button.dataset.pabNudge === 'right' ? -1 : 1;

        track.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(' + direction * 80 + 'px)' },
            { transform: 'translateX(0)' }
          ],
          {
            duration: 420,
            easing: 'cubic-bezier(.22,.61,.36,1)'
          }
        );
      });
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
    const section = event.target.querySelector('[data-premium-announcement-bar]');

    if (section) {
      initPremiumAnnouncementBar(section);
    }
  });
})();
