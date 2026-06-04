const GAS_URL =
  process.env.GAS_API_URL ||
  "https://script.google.com/macros/s/AKfycbxOeqHyxR8flIAibvy1GeK0Wvzc3OEwjWlpfLLOBAaofDWIJpPYtlxyolSNq2l70scTxA/exec";

async function fetchFollowingRedirects(url, maxRedirects = 10) {
  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect with no Location header");
      currentUrl = location;
      continue;
    }
    return response;
  }
  throw new Error("Too many redirects");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const date = req.query.date || "today";
    const cacheBust = Date.now();
    const url = `${GAS_URL}?date=${encodeURIComponent(date)}&t=${cacheBust}`;

    const response = await fetchFollowingRedirects(url);

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch data from Google Sheets" });
    }

    const data = await response.json();

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json(data);
  } catch (err) {
    console.error("Error proxying to GAS API:", err);
    res.status(500).json({ error: "Internal server error while fetching dashboard data" });
  }
}
