let guestList = [];
const sheetUrl = window.GUESTS_SHEET_URL || '';

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
    guestList = (data.guests || []).map(guest => guest.name);
  } catch (error) {
    console.error('Guest data load failed:', error);
    guestList = [];
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
const placeholderPostUrl = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

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

async function handleSubmit(event) {
  event.preventDefault();
  const status = document.getElementById("status");
  const data = new FormData(event.target);
  const payload = Object.fromEntries(data.entries());

  if (!postUrl || postUrl === placeholderPostUrl) {
    status.innerHTML = "RSVP posting URL is not configured yet. Replace the placeholder in rsvp.html with your Google Apps Script web app URL.";
    return;
  }

  try {
    const response = await fetch(postUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      status.innerHTML = "Thanks for your RSVP! We’ve saved your response.";
      form.reset();
      form.style.display = "none";
      document.getElementById('search-section').style.display = 'block';
      document.getElementById('guest-search').value = '';
      document.getElementById('error-msg').style.display = 'none';
      plusOneGroup.style.display = 'none';
    } else {
      status.innerHTML = `Submission failed. Status: ${response.status} ${response.statusText}`;
    }
  } catch (error) {
    status.innerHTML = `Submission failed: ${error.message}`;
  }
}

form.addEventListener("submit", handleSubmit);
loadGuests();
