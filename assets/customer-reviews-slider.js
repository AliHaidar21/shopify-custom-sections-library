(function () {
  function initCustomerReviewsSlider(section) {
    const track = section.querySelector('[data-reviews-track]');

    if (!track || track.dataset.reviewsReady === 'true') {
      return;
    }

    track.dataset.reviewsReady = 'true';

    const originalCards = Array.prototype.slice.call(track.children);
    const originalCount = originalCards.length;

    if (!originalCount) {
      return;
    }

    const clonesPerSide = Math.min(3, originalCount);

    function createClone(card) {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.dataset.clone = 'true';
      return clone;
    }

    for (let i = originalCount - clonesPerSide; i < originalCount; i += 1) {
      track.insertBefore(createClone(originalCards[i]), track.firstChild);
    }

    for (let j = 0; j < clonesPerSide; j += 1) {
      track.appendChild(createClone(originalCards[j]));
    }

    let currentIndex = clonesPerSide;
    let isAnimating = false;
    let resizeTimer = null;
    let autoplayTimer = null;

    function getGap() {
      const styles = window.getComputedStyle(track);
      return parseFloat(styles.gap || styles.columnGap || 0) || 0;
    }

    function getCardWidth() {
      const first = track.children[0];
      return first ? first.getBoundingClientRect().width : 0;
    }

    function getStep() {
      return getCardWidth() + getGap();
    }

    function setTrackPosition(index, animate) {
      const step = getStep();

      if (!step) {
        return;
      }

      track.style.transition = animate ? 'transform 0.45s ease' : 'none';
      track.style.transform = 'translate3d(' + (-index * step) + 'px, 0, 0)';
    }

    function jumpIfNeeded() {
      if (currentIndex >= originalCount + clonesPerSide) {
        currentIndex = clonesPerSide;
        setTrackPosition(currentIndex, false);
      } else if (currentIndex < clonesPerSide) {
        currentIndex = originalCount + clonesPerSide - 1;
        setTrackPosition(currentIndex, false);
      }
    }

    function goToNext() {
      if (isAnimating) {
        return;
      }

      currentIndex += 1;
      isAnimating = true;
      setTrackPosition(currentIndex, true);
    }

    function goToPrev() {
      if (isAnimating) {
        return;
      }

      currentIndex -= 1;
      isAnimating = true;
      setTrackPosition(currentIndex, true);
    }

    track.addEventListener('transitionend', function () {
      isAnimating = false;
      jumpIfNeeded();
    });

    let dragStartX = 0;
    let dragStartY = 0;
    let dragDeltaX = 0;
    let startTranslate = 0;
    let isDragging = false;
    let isTouchDragging = false;
    let isHorizontalSwipe = false;

    function getCurrentTranslateX() {
      const styles = window.getComputedStyle(track);
      const matrix = styles.transform || styles.webkitTransform || styles.mozTransform;

      if (matrix && matrix !== 'none') {
        const values = matrix.match(/matrix.*\((.+)\)/);

        if (values && values[1]) {
          const parts = values[1].split(',');

          if (parts.length >= 6) {
            return parseFloat(parts[4]);
          }
        }
      }

      return -currentIndex * getStep();
    }

    function onDragStart(clientX, clientY, isTouch) {
      if (isAnimating) {
        return;
      }

      stopAutoplay();

      isDragging = true;
      isTouchDragging = Boolean(isTouch);
      isHorizontalSwipe = false;
      dragStartX = clientX;
      dragStartY = clientY || 0;
      dragDeltaX = 0;
      startTranslate = getCurrentTranslateX();

      track.classList.add('is-dragging');
      track.style.transition = 'none';
    }

    function onDragMove(clientX, clientY) {
      if (!isDragging) {
        return;
      }

      const deltaX = clientX - dragStartX;
      const deltaY = (clientY || 0) - dragStartY;

      if (isTouchDragging && !isHorizontalSwipe) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
          isHorizontalSwipe = true;
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
          onDragEnd(false);
          return;
        }
      }

      dragDeltaX = deltaX;
      track.style.transform = 'translate3d(' + (startTranslate + dragDeltaX) + 'px, 0, 0)';
    }

    function onDragEnd(shouldSnap) {
      if (!isDragging) {
        return;
      }

      isDragging = false;
      isTouchDragging = false;
      isHorizontalSwipe = false;
      track.classList.remove('is-dragging');

      if (shouldSnap === false) {
        setTrackPosition(currentIndex, true);
        isAnimating = true;
        startAutoplay();
        return;
      }

      const threshold = Math.min(120, getCardWidth() * 0.18);

      if (dragDeltaX <= -threshold) {
        goToNext();
      } else if (dragDeltaX >= threshold) {
        goToPrev();
      } else {
        isAnimating = true;
        setTrackPosition(currentIndex, true);
      }

      startAutoplay();
    }

    function startAutoplay() {
      const shouldAutoplay = section.dataset.autoplay === 'true';
      const interval = parseInt(section.dataset.autoplayInterval, 10) || 4000;

      if (!shouldAutoplay || autoplayTimer) {
        return;
      }

      autoplayTimer = window.setInterval(function () {
        goToNext();
      }, interval);
    }

    function stopAutoplay() {
      if (!autoplayTimer) {
        return;
      }

      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    track.addEventListener('mousedown', function (event) {
      onDragStart(event.clientX, event.clientY, false);
    });

    window.addEventListener('mousemove', function (event) {
      onDragMove(event.clientX, event.clientY);
    });

    window.addEventListener('mouseup', function () {
      onDragEnd(true);
    });

    track.addEventListener('touchstart', function (event) {
      if (event.touches && event.touches[0]) {
        onDragStart(event.touches[0].clientX, event.touches[0].clientY, true);
      }
    }, { passive: true });

    track.addEventListener('touchmove', function (event) {
      if (event.touches && event.touches[0]) {
        onDragMove(event.touches[0].clientX, event.touches[0].clientY);

        if (isHorizontalSwipe) {
          event.preventDefault();
        }
      }
    }, { passive: false });

    track.addEventListener('touchend', function () {
      onDragEnd(true);
    });

    track.addEventListener('touchcancel', function () {
      onDragEnd(true);
    });

    track.addEventListener('mouseleave', function () {
      if (isDragging && !isTouchDragging) {
        onDragEnd(true);
      }
    });

    track.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });

    if (section.dataset.pauseOnHover === 'true') {
      section.addEventListener('mouseenter', stopAutoplay);
      section.addEventListener('mouseleave', startAutoplay);
    }

    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        setTrackPosition(currentIndex, false);
      }, 120);
    });

    setTrackPosition(currentIndex, false);
    startAutoplay();
  }

  function initAllCustomerReviewsSliders() {
    document.querySelectorAll('[data-customer-reviews-slider]').forEach(function (section) {
      initCustomerReviewsSlider(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllCustomerReviewsSliders);
  } else {
    initAllCustomerReviewsSliders();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('[data-customer-reviews-slider]');

    if (section) {
      initCustomerReviewsSlider(section);
    }
  });
})();
