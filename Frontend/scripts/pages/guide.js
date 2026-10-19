
/*
 * FoodConnect - Food Safety Guide
 * Adds accessible expand/collapse behavior to FAQ sections.
 */

document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq details');

  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;

      // Keep only one FAQ answer expanded at a time.
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.open = false;
        }
      });
    });
  });
});
