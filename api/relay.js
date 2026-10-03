module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "OpenCode Discord Relay is running"
    });
  }

  const secret = req.headers["x-relay-secret"];

  if (!secret || secret !== process.env.RELAY_SECRET) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized"
    });
  }

  const { url } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Missing URL"
    });
  }

  const pattern =
    /^https:\/\/[a-zA-Z0-9.-]+\.daytonaproxy01\.net(?:\/.*)?$/;

  if (!pattern.test(url)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid Daytona URL"
    });
  }

  const payload = {
    username: "OpenCode Daytona",
    embeds: [
      {
        title: "OpenCode Web — New Preview URL",
        description: "A fresh Daytona preview URL has been generated.",
        url: url,
        fields: [
          {
            name: "OpenCode Web",
            value: `[Open Web Interface](${url})`
          },
          {
            name: "Generated",
            value: new Date().toISOString()
          }
        ],
        footer: {
          text: "Automatic Daytona URL Renewal"
        }
      }
    ]
  };

  try {
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();

      return res.status(502).json({
        ok: false,
        error: "Discord webhook failed",
        status: response.status,
        details: text.slice(0, 500)
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Discord notification sent"
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: "Discord connection failed",
      details: String(error)
    });
  }
};
