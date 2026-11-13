// Vercel serverless function: read-only sync from the user's Notion job database.
const DATA_SOURCE_ID = "e230210a-39f8-4ab3-b6f9-4ac7b50f0875";
const NOTION_VERSION = "2025-09-03";

function plain(prop) {
  if (!prop) return "";
  const value = prop.title || prop.rich_text || [];
  if (Array.isArray(value)) return value.map(x => x.plain_text || x.text?.content || "").join("");
  return "";
}
function dateValue(prop) {
  return prop?.date?.start || prop?.created_time || "";
}
function normalize(page) {
  const p = page.properties || {};
  const getText = name => plain(p[name]);
  const getSelect = name => p[name]?.select?.name || "";
  const getCheckbox = name => Boolean(p[name]?.checkbox);
  const areas = (p["Area"]?.multi_select || []).map(x => x.name);
  const directUrl = p["🔗 Link candidatura diretta"]?.url || "";
  const listingUrl = p["Link annuncio"]?.url || "";
  const score = p["Compatibilità"]?.number;
  return {
    id: page.id,
    company: getText("Azienda"),
    role: plain(p["Ruolo"]),
    area: areas.join(" · ") || "Da classificare",
    location: getText("Sede") || "Non specificata",
    mode: getSelect("Modalità") || "Non specificata",
    score: Number.isFinite(score) ? score : 0,
    status: getSelect("Stato") || "Da valutare",
    protected: getCheckbox("Categoria protetta / L.68/99"),
    url: directUrl || listingUrl,
    notes: getText("Note"),
    next: getText("🧭 Prossima azione"),
    dateAdded: dateValue(p["Aggiunta alla dashboard"]) || page.created_time || "",
    deadline: dateValue(p["Scadenza"]),
    priority: getSelect("Priorità"),
    applicationMethod: getSelect("Come candidarsi"),
    pageUrl: page.url
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metodo non consentito" });
  }
  const token = process.env.NOTION_KEY || process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: "Variabile NOTION_KEY non configurata su Vercel" });
  try {
    let cursor;
    const pages = [];
    do {
      const response = await fetch("https://api.notion.com/v1/data_sources/" + DATA_SOURCE_ID + "/query", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) })
      });
      const body = await response.json();
      if (!response.ok) {
        const detail = body.message || body.error || ("Notion API HTTP " + response.status);
        return res.status(response.status >= 500 ? 502 : response.status).json({ error: detail });
      }
      pages.push(...(body.results || []));
      cursor = body.has_more ? body.next_cursor : null;
    } while (cursor);
    const jobs = pages.map(normalize).filter(job => job.company || job.role);
    return res.status(200).json({ source: "notion", total: jobs.length, jobs, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Notion API error:", error);
    return res.status(502).json({ error: "Errore durante la sincronizzazione con Notion" });
  }
};
