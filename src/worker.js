/* Booking form -> Telegram.
 *
 * The site is still plain static files; this Worker exists only so the form
 * has somewhere to POST. Everything that is not the booking endpoint is handed
 * straight back to the asset layer, so html_handling and the 404 page behave
 * exactly as they did before.
 *
 * Required Cloudflare variables (set as Secrets, not plain text — the token
 * lets anyone post as the bot):
 *   BOT_TOKEN  (also accepted: TELEGRAM_BOT_TOKEN)
 *   CHAT_ID    (also accepted: TELEGRAM_CHAT_ID)
 */

const ENDPOINT = "/api/booking";

// Anything longer is either a mistake or an attempt to stuff the message.
const LIMITS = {
  name: 120, phone: 40, email: 160, service: 120,
  duration: 40, therapist: 60, date: 30, time: 20, note: 2000,
};

const LABELS = {
  service: "Zabieg",
  name: "Imię i nazwisko",
  phone: "Telefon",
  email: "E-mail",
  duration: "Długość",
  therapist: "Terapeutka",
  date: "Data",
  time: "Godzina",
  note: "Wiadomość",
};

function pick(env, names) {
  for (const n of names) {
    const v = env[n];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// Telegram parses HTML, so anything the visitor typed has to be neutralised
// before it goes into the message.
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function clean(value, max) {
  if (typeof value !== "string") return "";
  // Strip control characters, collapse runaway whitespace, then cap. Newlines
  // survive so the message field keeps its shape, but long runs are trimmed.
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function buildMessage(d) {
  const lines = ["<b>Nowe zgłoszenie ze strony</b>", ""];
  for (const key of ["service", "name", "phone", "email", "duration", "therapist", "date", "time"]) {
    if (d[key]) lines.push("<b>" + LABELS[key] + ":</b> " + esc(d[key]));
  }
  if (d.note) lines.push("", "<b>" + LABELS.note + ":</b>", esc(d.note));
  return lines.join("\n");
}

async function handleBooking(request, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  // Only accept posts that came from this site's own pages.
  const origin = request.headers.get("origin");
  if (origin) {
    let sameSite = false;
    try {
      sameSite = new URL(origin).host === new URL(request.url).host;
    } catch (e) {
      sameSite = false;
    }
    if (!sameSite) return json({ ok: false, error: "bad_origin" }, 403);
  }

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  if (!data || typeof data !== "object") return json({ ok: false, error: "bad_json" }, 400);

  // Honeypot: a real person never sees this field, so anything in it is a bot.
  // Answer 200 so the sender learns nothing from the response.
  if (clean(data.company, 100)) return json({ ok: true });

  const d = {};
  for (const key of Object.keys(LIMITS)) d[key] = clean(data[key], LIMITS[key]);

  if (!d.name || !d.phone) return json({ ok: false, error: "missing_fields" }, 400);

  const token = pick(env, ["BOT_TOKEN", "TELEGRAM_BOT_TOKEN"]);
  const chatId = pick(env, ["CHAT_ID", "TELEGRAM_CHAT_ID"]);
  if (!token || !chatId) {
    // Names only — never echo the values.
    return json(
      {
        ok: false,
        error: "not_configured",
        missing: [!token ? "BOT_TOKEN" : null, !chatId ? "CHAT_ID" : null].filter(Boolean),
      },
      500
    );
  }

  const api =
    (env.TELEGRAM_API_BASE || "https://api.telegram.org") + "/bot" + token + "/sendMessage";
  let res, payload;
  try {
    res = await fetch(api, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(d),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    payload = await res.json();
  } catch (e) {
    return json({ ok: false, error: "telegram_unreachable" }, 502);
  }

  if (!res.ok || !payload || payload.ok !== true) {
    // description is Telegram's own wording ("chat not found", "Unauthorized")
    return json(
      { ok: false, error: "telegram_rejected", description: payload && payload.description },
      502
    );
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === ENDPOINT) return handleBooking(request, env);
    return env.ASSETS.fetch(request);
  },
};
