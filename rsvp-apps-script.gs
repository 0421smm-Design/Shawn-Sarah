function doGet() {
  return ContentService
    .createTextOutput('RSVP endpoint is ready.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const payload = e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};

    const guestName = payload.guest_name || 'Unknown guest';
    const attendance = payload.attendance || 'Not provided';
    const plusOne = payload.plus_one || 'None';
    const allergies = payload.allergies || 'None';
    const guestEmail = payload.guest_email || 'Not provided';
    const recipientEmail = payload.recipient_email || '0421smm@gmail.com';

    const subject = `Wedding RSVP Update - ${guestName}`;
    const body = [
      'Hello Shawn and Sarah,',
      '',
      `You received a new RSVP from ${guestName}.`,
      '',
      `Attendance: ${attendance}`,
      `Email: ${guestEmail}`,
      `Plus one: ${plusOne}`,
      `Dietary notes / allergies: ${allergies}`,
      '',
      'Thanks!'
    ].join('\n');

    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: 'RSVP received.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
