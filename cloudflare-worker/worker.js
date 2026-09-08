export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. GET /api/about - Fetch about page data
    if (url.pathname === '/api/about' && request.method === 'GET') {
      const aboutData = await env.APP_KV.get('ABOUT_INFO', { type: 'json' }) || {
        announcement: "Welcome to Heavy Equipment Rental ERP System",
        version: "1.0.0",
        support_link: "https://t.me/your_support_bot",
        status_message: "System is running efficiently"
      };
      return new Response(JSON.stringify(aboutData), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 2. POST /telegram-webhook - Telegram bot webhook
    if (url.pathname === '/telegram-webhook' && request.method === 'POST') {
      const update = await request.json();
      if (update.message && update.message.text) {
        await handleTelegramMessage(update.message, env);
      }
      return new Response('OK', { headers: corsHeaders });
    }

    // 3. POST /api/set-about - Update about data (admin only)
    if (url.pathname === '/api/set-about' && request.method === 'POST') {
      const body = await request.json();
      const currentData = await env.APP_KV.get('ABOUT_INFO', { type: 'json' }) || {};
      const updatedData = {
        ...currentData,
        announcement: body.announcement || currentData.announcement,
        support_link: body.support_link || currentData.support_link,
        version: body.version || currentData.version,
        status_message: body.status_message || currentData.status_message,
        updated_at: new Date().toISOString()
      };
      await env.APP_KV.put('ABOUT_INFO', JSON.stringify(updatedData));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

async function handleTelegramMessage(message, env) {
  const chatId = message.chat.id;
  const text = message.text;
  const adminId = env.ADMIN_TELEGRAM_ID;

  // Only allow admin
  if (String(chatId) !== String(adminId)) {
    await sendTelegramMessage(env, chatId, "❌ Unauthorized.");
    return;
  }

  // /start
  if (text === '/start') {
    await sendTelegramMessage(env, chatId,
      `🤖 *Heavy Equipment ERP Bot*\n\n` +
      `Commands:\n` +
      `/set_about <text> - Update announcement\n` +
      `/set_support <link> - Update support link\n` +
      `/set_version <version> - Update version\n` +
      `/set_status <status> - Update status message\n` +
      `/generate_code <client> <days> - Generate license code\n` +
      `/about - View current about data`
    );
    return;
  }

  // /about - View current data
  if (text === '/about') {
    const data = await env.APP_KV.get('ABOUT_INFO', { type: 'json' }) || {};
    await sendTelegramMessage(env, chatId,
      `📋 *Current About Data:*\n\n` +
      `📢 Announcement: ${data.announcement || 'N/A'}\n` +
      `🔗 Support: ${data.support_link || 'N/A'}\n` +
      `📦 Version: ${data.version || 'N/A'}\n` +
      `📊 Status: ${data.status_message || 'N/A'}`
    );
    return;
  }

  // /set_about <text>
  if (text.startsWith('/set_about')) {
    const newText = text.replace('/set_about', '').trim();
    if (!newText) {
      await sendTelegramMessage(env, chatId, "Usage: /set_about <announcement text>");
      return;
    }
    const currentData = await env.APP_KV.get('ABOUT_INFO', { type: 'json' }) || {};
    currentData.announcement = newText;
    currentData.updated_at = new Date().toISOString();
    await env.APP_KV.put('ABOUT_INFO', JSON.stringify(currentData));
    await sendTelegramMessage(env, chatId, "✅ Announcement updated successfully!");
    return;
  }

  // /set_support <link>
  if (text.startsWith('/set_support')) {
    const link = text.replace('/set_support', '').trim();
    if (!link) {
      await sendTelegramMessage(env, chatId, "Usage: /set_support <telegram_link>");
      return;
    }
    const currentData = await env.APP_KV.get('ABOUT_INFO', { type: 'json' }) || {};
    currentData.support_link = link;
    currentData.updated_at = new Date().toISOString();
    await env.APP_KV.put('ABOUT_INFO', JSON.stringify(currentData));
    await sendTelegramMessage(env, chatId, "✅ Support link updated!");
    return;
  }

  // /set_version <version>
  if (text.startsWith('/set_version')) {
    const version = text.replace('/set_version', '').trim();
    if (!version) {
      await sendTelegramMessage(env, chatId, "Usage: /set_version <version_number>");
      return;
    }
    const currentData = await env.APP_KV.get('ABOUT_INFO', { type: 'json' }) || {};
    currentData.version = version;
    currentData.updated_at = new Date().toISOString();
    await env.APP_KV.put('ABOUT_INFO', JSON.stringify(currentData));
    await sendTelegramMessage(env, chatId, `✅ Version updated to ${version}!`);
    return;
  }

  // /set_status <status>
  if (text.startsWith('/set_status')) {
    const status = text.replace('/set_status', '').trim();
    if (!status) {
      await sendTelegramMessage(env, chatId, "Usage: /set_status <status message>");
      return;
    }
    const currentData = await env.APP_KV.get('ABOUT_INFO', { type: 'json' }) || {};
    currentData.status_message = status;
    currentData.updated_at = new Date().toISOString();
    await env.APP_KV.put('ABOUT_INFO', JSON.stringify(currentData));
    await sendTelegramMessage(env, chatId, "✅ Status message updated!");
    return;
  }

  // /generate_code <client> <days>
  if (text.startsWith('/generate_code')) {
    const parts = text.split(' ');
    const clientName = parts[1] || 'Client';
    const days = parseInt(parts[2] || '30', 10);

    const payload = {
      client: clientName,
      days: days,
      created_at: Date.now(),
      nonce: Math.random().toString(36).substring(7)
    };

    const jsonStr = JSON.stringify(payload);
    const encodedCode = btoa(jsonStr);

    // Store generated codes
    const codes = await env.APP_KV.get('GENERATED_CODES', { type: 'json' }) || [];
    codes.push({ ...payload, code: encodedCode, generated_at: new Date().toISOString() });
    await env.APP_KV.put('GENERATED_CODES', JSON.stringify(codes));

    const responseMsg =
      `🔑 *New License Code Generated*\n\n` +
      `👤 Client: ${clientName}\n` +
      `⏱️ Duration: ${days} days\n` +
      `📜 Code:\n\`\`\`\n${encodedCode}\n\`\`\`\n\n` +
      `Send this code to the client for activation.`;

    await sendTelegramMessage(env, chatId, responseMsg);
    return;
  }

  await sendTelegramMessage(env, chatId, "❓ Unknown command. Use /start to see available commands.");
}

async function sendTelegramMessage(env, chatId, text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}
