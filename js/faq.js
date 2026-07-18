document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.parentElement;

    // Toggle the 'active' class
    item.classList.toggle('active');

    // Optional: Close others if you want only one open at a time
    /*
    document.querySelectorAll('.faq-item').forEach(otherItem => {
      if (otherItem !== item) otherItem.classList.remove('active');
    });
    */
  });
});
