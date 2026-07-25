let guestList = [];
const sheetUrl = window.GUESTS_SHEET_URL || '';
const fallbackGuestNames = ['Bob Price', 'Tina Lina', 'Shawn Miller'];

function normalizeName(value) {
  return value.toLowerCase().trim();
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
  guestList = fallbackGuestNames.slice();

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
        guestList = names;
        return;
      }
    }

    const fallbackResponse = await fetch('data/guests.json');
    if (!fallbackResponse.ok) throw new Error('Unable to load fallback guest data');
    const data = await fallbackResponse.json();
    const localNames = (data.guests || []).map(guest => guest.name).filter(Boolean);
    if (localNames.length) {
      guestList = localNames;
    }
  } catch (error) {
    console.error('Guest data load failed:', error);
    guestList = fallbackGuestNames.slice();
  }
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

  const found = guestList.find(name => normalizeName(name).includes(normalizeName(input)));

  if (found) {
    document.getElementById('search-section').style.display = 'none';
    rsvpForm.style.display = 'block';
    welcomeName.innerText = "Hi, " + found + "!";
    hiddenName.value = found;
    errorMsg.style.display = 'none';
    plusOneGroup.style.display = 'none';
    plusOneInput.value = '';
    rsvpForm.reset();
  } else {
    errorMsg.style.display = 'block';
  }
}

const form = document.getElementById("rsvp-form");
const yesRadio = document.getElementById("yes");
const noRadio = document.getElementById("no");
const plusOneGroup = document.getElementById("plus-one-group");
const plusOneInput = document.getElementById("plus-one-name");
const postUrl = (window.RSVP_POST_URL || '').trim();
const recipientEmail = (window.RSVP_EMAIL_RECIPIENT || '').trim();
const placeholderPostUrl = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

function buildMailtoLink(payload) {
  const guestName = payload.guest_name || 'Unknown guest';
  const attendance = payload.attendance || 'Not provided';
  const plusOne = payload.plus_one || 'None';
  const allergies = payload.allergies || 'None';
  const subject = encodeURIComponent(`Wedding RSVP Update - ${guestName}`);
  const bodyLines = [
    `Hello Shawn and Sarah,`,
    '',
    `You received a new RSVP from ${guestName}.`,
    '',
    `Attendance: ${attendance}`,
    `Plus one: ${plusOne}`,
    `Dietary notes / allergies: ${allergies}`,
    '',
    `Thanks!`
  ];
  const body = encodeURIComponent(bodyLines.join('\n'));
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}

function togglePlusOneField() {
  if (yesRadio.checked) {
    plusOneGroup.style.display = 'block';
  } else {
    plusOneGroup.style.display = 'none';
    plusOneInput.value = '';
  }
}

if (yesRadio && noRadio) {
  yesRadio.addEventListener("change", togglePlusOneField);
  noRadio.addEventListener("change", togglePlusOneField);
}

function handleSubmit(event) {
  event.preventDefault();
  const status = document.getElementById("status");
  const data = new FormData(event.target);
  const payload = Object.fromEntries(data.entries());

  if (recipientEmail && recipientEmail !== 'YOUR_EMAIL@example.com') {
    window.location.href = buildMailtoLink(payload);
    status.innerHTML = "Your email app should open with the RSVP details. Please send it to finish the submission.";
  } else {
    status.innerHTML = "Your RSVP was received locally. Please add your email address in the RSVP settings to send it by email.";
  }

  form.reset();
  form.style.display = "none";
  document.getElementById('search-section').style.display = 'block';
  document.getElementById('guest-search').value = '';
  document.getElementById('error-msg').style.display = 'none';
  plusOneGroup.style.display = 'none';
}

form.addEventListener("submit", handleSubmit);
loadGuests();
