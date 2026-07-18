const guestList = ["Shawn Miller", "John Smith", "Sarah Jenkins", "Michael Brown"];

function checkGuest() {
  const input = document.getElementById('guest-search').value.trim();
  const rsvpForm = document.getElementById('rsvp-form');
  const errorMsg = document.getElementById('error-msg');
  const welcomeName = document.getElementById('welcome-name');
  const hiddenName = document.getElementById('hidden-name');

  const found = guestList.find(name => name.toLowerCase() === input.toLowerCase());

  if (found) {
    document.getElementById('search-section').style.display = 'none';
    rsvpForm.style.display = 'block';
    welcomeName.innerText = "Hi, " + found + "!";
    hiddenName.value = found; // Stores the name for the Formspree submission
    errorMsg.style.display = 'none';
  } else {
    errorMsg.style.display = 'block';
  }
}

// Formspree Submission Logic
const form = document.getElementById("rsvp-form");

async function handleSubmit(event) {
  event.preventDefault();
  const status = document.getElementById("status");
  const data = new FormData(event.target);

  // REPLACE 'your-id' with your actual Formspree ID
  fetch("https://formspree.io/f/xqenqqdl", {
    method: "POST",
    body: data,
    headers: {
        'Accept': 'application/json'
    }
  }).then(response => {
    if (response.ok) {
      status.innerHTML = "Thanks for your RSVP!";
      form.reset();
      form.style.display = "none";
    } else {
      status.innerHTML = "Oops! There was a problem submitting your form.";
    }
  }).catch(error => {
    status.innerHTML = "Oops! There was a problem submitting your form.";
  });
}

form.addEventListener("submit", handleSubmit);
