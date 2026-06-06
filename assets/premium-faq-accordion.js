(function () {
  function initPremiumFaq(section) {
    const items = section.querySelectorAll('.premium-faq-accordion__item');
    const singleOpen = section.dataset.singleOpen === 'true';

    items.forEach((item) => {
      const button = item.querySelector('.premium-faq-accordion__question');
      const answer = item.querySelector('.premium-faq-accordion__answer');
      const icon = item.querySelector('.premium-faq-accordion__icon');

      if (!button || !answer || button.dataset.premiumFaqReady === 'true') {
        return;
      }

      button.dataset.premiumFaqReady = 'true';

      button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        if (singleOpen) {
          items.forEach((otherItem) => {
            if (otherItem === item) {
              return;
            }

            const otherButton = otherItem.querySelector('.premium-faq-accordion__question');
            const otherAnswer = otherItem.querySelector('.premium-faq-accordion__answer');
            const otherIcon = otherItem.querySelector('.premium-faq-accordion__icon');

            otherItem.classList.remove('is-active');

            if (otherButton) {
              otherButton.setAttribute('aria-expanded', 'false');
            }

            if (otherAnswer) {
              otherAnswer.hidden = true;
            }

            if (otherIcon) {
              otherIcon.textContent = otherIcon.dataset.plus || '+';
            }
          });
        }

        item.classList.toggle('is-active', !isOpen);
        button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        answer.hidden = isOpen;

        if (icon) {
          icon.textContent = isOpen ? icon.dataset.plus || '+' : icon.dataset.minus || '×';
        }
      });
    });
  }

  function initAllPremiumFaqs() {
    document.querySelectorAll('[data-premium-faq]').forEach((section) => {
      initPremiumFaq(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPremiumFaqs);
  } else {
    initAllPremiumFaqs();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const section = event.target.querySelector('[data-premium-faq]');

    if (section) {
      initPremiumFaq(section);
    }
  });
})();
