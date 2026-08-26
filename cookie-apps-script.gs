function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Cookie request endpoint is ready.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = e && e.parameter ? e.parameter : {};
    const personName = payload.person_name || 'Unknown guest';
    const cookieName = payload.cookie_name || 'Not provided';
    const allergies = payload.cookie_allergies || 'None';

    MailApp.sendEmail({
      to: '0421smm@gmail.com',
      subject: `Wedding Cookie Request - ${personName}`,
      body: [
        'Hello Shawn and Sarah,',
        '',
        `You received a new cookie request from ${personName}.`,
        '',
        `Cookie they will make: ${cookieName}`,
        `Allergies: ${allergies}`,
        '',
        'Thanks!'
      ].join('\n')
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: 'Cookie request received.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
