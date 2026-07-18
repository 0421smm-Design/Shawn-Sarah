$( "#button" ).click(function() {
  $( "#mobile2" ).fadeToggle( "slow", function() {
    // Animation complete.
  });
});

// Grab both buttons and the menu
const openButton = document.getElementById('button'); // Your original menu button
const closeButton = document.getElementById('close-btn');
const mobileMenu = document.getElementById('mobile2');

// OPEN MENU
openButton.addEventListener('click', function() {
  mobileMenu.style.display = 'block';
  document.documentElement.classList.add('no-scroll'); // Lock scrolling
});

// CLOSE MENU
closeButton.addEventListener('click', function(e) {
  e.preventDefault(); // Prevents the '#' from jumping the page up
  mobileMenu.style.display = 'none';
  document.documentElement.classList.remove('no-scroll'); // Unlock scrolling
});