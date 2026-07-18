$(function () {
  const openButton = document.getElementById('button');
  const closeButton = document.getElementById('close-btn');
  const mobileMenu = document.getElementById('mobile2');

  function lockScroll() {
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
  }

  function unlockScroll() {
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
  }

  if (openButton && closeButton && mobileMenu) {
    openButton.addEventListener('click', function (e) {
      e.preventDefault();
      $(mobileMenu).stop(true, true).fadeIn('slow');
      lockScroll();
    });

    closeButton.addEventListener('click', function (e) {
      e.preventDefault();
      $(mobileMenu).stop(true, true).fadeOut('slow', unlockScroll);
    });

    $(mobileMenu).find('a').on('click', function () {
      $(mobileMenu).stop(true, true).fadeOut('slow', unlockScroll);
    });
  }
});