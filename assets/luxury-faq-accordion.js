(function () {
  function initLuxuryFaqAccordion(section) {
    const items = section.querySelectorAll('.luxury-faq-accordion__item');
    const singleOpen = section.dataset.singleOpen === 'true';

    items.forEach((item) => {
      const button = item.querySelector('.luxury-faq-accordion__question');
      const answer = item.querySelector('.luxury-faq-accordion__answer');

      if (!button || !answer) {
        return;
      }

      if (button.dataset.luxuryFaqReady === 'true') {
        return;
      }

      button.dataset.luxuryFaqReady = 'true';

      button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        if (singleOpen) {
          items.forEach((otherItem) => {
            if (otherItem === item) {
              return;
            }

            const otherButton = otherItem.querySelector('.luxury-faq-accordion__question');
            const otherAnswer = otherItem.querySelector('.luxury-faq-accordion__answer');

            otherItem.classList.remove('is-active');

            if (otherButton) {
              otherButton.setAttribute('aria-expanded', 'false');
            }

            if (otherAnswer) {
              otherAnswer.hidden = true;
            }
          });
        }

        item.classList.toggle('is-active', !isOpen);
        button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        answer.hidden = isOpen;
      });
    });
  }

  function initAllLuxuryFaqAccordions() {
    const sections = document.querySelectorAll('.luxury-faq-accordion');

    sections.forEach((section) => {
      initLuxuryFaqAccordion(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllLuxuryFaqAccordions);
  } else {
    initAllLuxuryFaqAccordions();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('.luxury-faq-accordion');

    if (section) {
      initLuxuryFaqAccordion(section);
    }
  });
})();
