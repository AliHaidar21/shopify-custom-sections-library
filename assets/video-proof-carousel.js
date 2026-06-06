(function () {
  function initVideoProofCarousel(section) {
    const videos = section.querySelectorAll('.video-proof-carousel__video');

    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;

      if (!video.hasAttribute('autoplay')) {
        return;
      }

      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const playOnInteraction = () => {
            video.play().catch(() => {});

            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
          };

          document.addEventListener('click', playOnInteraction);
          document.addEventListener('touchstart', playOnInteraction);
        });
      }
    });
  }

  function initAllVideoProofCarousels() {
    const sections = document.querySelectorAll('.video-proof-carousel');

    sections.forEach((section) => {
      initVideoProofCarousel(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllVideoProofCarousels);
  } else {
    initAllVideoProofCarousels();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.video-proof-carousel');

    if (section) {
      initVideoProofCarousel(section);
    }
  });
})();
