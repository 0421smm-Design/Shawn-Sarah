let guestList = [];
let currentGuest = null;
const sheetUrl = window.GUESTS_SHEET_URL || '';
const fallbackGuestNames = ['Bob Price', 'Tina Lina', 'Shawn Miller'];
const postUrl = (window.RSVP_POST_URL || '').trim();
const recipientEmail = (window.RSVP_EMAIL_RECIPIENT || '').trim();

function normalizeName(value) {
  return (value || '').toLowerCase().trim();
}

function createGuestEntry(value) {
  if (typeof value === 'string') {
    return { name: value.trim() };
  }

  if (value && typeof value === 'object') {
    return {
      name: (value.name || value.guest_name || '').trim(),
      email: (value.email || value.guest_email || '').trim(),
      plusOneAllowed: value.plusOneAllowed !== false
    };
  }

  return null;
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }
      currentRow.push(currentValue);
      currentValue = '';
      if (currentRow.some(cell => cell.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentValue += char;
    }
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some(cell => cell.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

async function loadGuests() {
  guestList = fallbackGuestNames.map(createGuestEntry).filter(Boolean);

  if (Array.isArray(window.GUESTS_DATA) && window.GUESTS_DATA.length) {
    guestList = window.GUESTS_DATA.map(createGuestEntry).filter(Boolean);
    return;
  }

  try {
    if (sheetUrl) {
      const response = await fetch(sheetUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Unable to load Google Sheet data');
      const csvText = await response.text();
      const rows = parseCsv(csvText);
      const names = rows
        .map(row => row[0] && row[0].trim())
        .filter(Boolean)
        .filter(name => !name.toLowerCase().includes('name'));

      if (names.length) {
        guestList = names.map(name => ({ name }));
        return;
      }
    }
  } catch (error) {
    console.error('Guest data load failed:', error);
  }
}

function showStatus(message, isError) {
  const status = document.getElementById('status');
  if (!status) return;
  status.innerHTML = message;
  status.style.color = isError ? '#b22222' : '#2d6a4f';
}

function showSuccessModal(message) {
  const modal = document.getElementById('rsvp-success-modal');
  const modalMessage = document.getElementById('rsvp-success-message');
  if (!modal || !modalMessage) return;
  modalMessage.innerText = message;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function hideSuccessModal() {
  const modal = document.getElementById('rsvp-success-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

async function checkGuest() {
  if (!guestList.length) {
    await loadGuests();
  }

  const input = document.getElementById('guest-search').value.trim();
  const rsvpForm = document.getElementById('rsvp-form');
  const errorMsg = document.getElementById('error-msg');
  const welcomeName = document.getElementById('welcome-name');
  const hiddenName = document.getElementById('hidden-name');
  const plusOneGroup = document.getElementById('plus-one-group');
  const plusOneInput = document.getElementById('plus-one-name');
  const emailInput = document.getElementById('guest-email');

  const foundGuest = guestList.find(guest => normalizeName(guest.name).includes(normalizeName(input)));

  if (foundGuest) {
    currentGuest = foundGuest;
    document.getElementById('search-section').style.display = 'none';
    rsvpForm.style.display = 'block';
    welcomeName.innerText = `Hi, ${foundGuest.name}!`;
    hiddenName.value = foundGuest.name;
    errorMsg.style.display = 'none';
    plusOneGroup.style.display = 'none';
    plusOneInput.value = '';
    emailInput.value = foundGuest.email || '';
    rsvpForm.reset();
    if (emailInput.value) {
      emailInput.value = foundGuest.email;
    }
  } else {
    errorMsg.style.display = 'block';
  }
}

const form = document.getElementById('rsvp-form');
const yesRadio = document.getElementById('yes');
const noRadio = document.getElementById('no');
const plusOneGroup = document.getElementById('plus-one-group');
const plusOneInput = document.getElementById('plus-one-name');

function buildMailtoLink(payload) {
  const guestName = payload.guest_name || 'Unknown guest';
  const attendance = payload.attendance || 'Not provided';
  const plusOne = payload.plus_one || 'None';
  const allergies = payload.allergies || 'None';
  const email = payload.guest_email || 'Not provided';
  const subject = encodeURIComponent(`Wedding RSVP Update - ${guestName}`);
  const bodyLines = [
    'Hello Shawn and Sarah,',
    '',
    `You received a new RSVP from ${guestName}.`,
    '',
    `Attendance: ${attendance}`,
    `Email: ${email}`,
    `Plus one: ${plusOne}`,
    `Dietary notes / allergies: ${allergies}`,
    '',
    'Thanks!'
  ];
  const body = encodeURIComponent(bodyLines.join('\n'));
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}

function togglePlusOneField() {
  if (yesRadio && yesRadio.checked) {
    plusOneGroup.style.display = 'block';
  } else {
    plusOneGroup.style.display = 'none';
    plusOneInput.value = '';
  }
}

if (yesRadio && noRadio) {
  yesRadio.addEventListener('change', togglePlusOneField);
  noRadio.addEventListener('change', togglePlusOneField);
}

async function handleSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const payload = Object.fromEntries(data.entries());
  const guestName = payload.guest_name || 'Unknown guest';

  if (!payload.guest_name) {
    showStatus('Please find your name before submitting your RSVP.', true);
    return;
  }

  try {
    const submissionPayload = {
      ...payload,
      recipient_email: recipientEmail
    };

    if (postUrl) {
      const response = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(submissionPayload)
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    showStatus(`Thanks, ${guestName}! Your RSVP has been received and sent to Shawn and Sarah.`, false);
    showSuccessModal(`Thanks, ${guestName}! We’ve received your RSVP and will be in touch soon.`);
  } catch (error) {
    console.error('RSVP submission failed:', error);
    showStatus('Your RSVP could not be sent automatically right now. Please try again shortly.', true);
  }

  form.reset();
  form.style.display = 'none';
  document.getElementById('search-section').style.display = 'block';
  document.getElementById('guest-search').value = '';
  document.getElementById('error-msg').style.display = 'none';
  plusOneGroup.style.display = 'none';
  currentGuest = null;
}

if (form) {
  form.addEventListener('submit', handleSubmit);
}

const closeModalButton = document.getElementById('rsvp-close-modal');
if (closeModalButton) {
  closeModalButton.addEventListener('click', hideSuccessModal);
}

document.getElementById('guest-search').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    checkGuest();
  }
});

loadGuests();
