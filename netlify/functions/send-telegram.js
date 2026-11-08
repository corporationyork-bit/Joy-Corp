exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const { message } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Pesan kosong' })
      };
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🚨 *JOY CORP - Pesan dari Owner*\n\n${message}`,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();

    if (data.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Pesan terkirim!' })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: data.description })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
