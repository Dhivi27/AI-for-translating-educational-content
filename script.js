// Populate language dropdowns with many options
document.addEventListener("DOMContentLoaded", () => {
  const sourceSel = document.getElementById("sourceLang");
  const targetSel = document.getElementById("targetLang");
  const translateBtn = document.getElementById("translateBtn");

  const LANGS = [
    { code: "auto", name: "Auto-detect" },
    { code: "af", name: "Afrikaans" }, { code: "am", name: "Amharic" },
    { code: "ar", name: "Arabic" }, { code: "az", name: "Azerbaijani" },
    { code: "bg", name: "Bulgarian" }, { code: "bn", name: "Bengali" },
    { code: "bs", name: "Bosnian" }, { code: "ca", name: "Catalan" },
    { code: "cs", name: "Czech" }, { code: "cy", name: "Welsh" },
    { code: "da", name: "Danish" }, { code: "de", name: "German" },
    { code: "el", name: "Greek" }, { code: "en", name: "English" },
    { code: "es", name: "Spanish" }, { code: "et", name: "Estonian" },
    { code: "fa", name: "Persian" }, { code: "fi", name: "Finnish" },
    { code: "fil", name: "Filipino" }, { code: "fr", name: "French" },
    { code: "ga", name: "Irish" }, { code: "gu", name: "Gujarati" },
    { code: "he", name: "Hebrew" }, { code: "hi", name: "Hindi" },
    { code: "hr", name: "Croatian" }, { code: "hu", name: "Hungarian" },
    { code: "hy", name: "Armenian" }, { code: "id", name: "Indonesian" },
    { code: "is", name: "Icelandic" }, { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" }, { code: "jv", name: "Javanese" },
    { code: "ka", name: "Georgian" }, { code: "kk", name: "Kazakh" },
    { code: "km", name: "Khmer" }, { code: "kn", name: "Kannada" },
    { code: "ko", name: "Korean" }, { code: "lo", name: "Lao" },
    { code: "lt", name: "Lithuanian" }, { code: "lv", name: "Latvian" },
    { code: "mk", name: "Macedonian" }, { code: "ml", name: "Malayalam" },
    { code: "mn", name: "Mongolian" }, { code: "mr", name: "Marathi" },
    { code: "ms", name: "Malay" }, { code: "my", name: "Burmese" },
    { code: "ne", name: "Nepali" }, { code: "nl", name: "Dutch" },
    { code: "no", name: "Norwegian" }, { code: "or", name: "Odia" },
    { code: "pa", name: "Punjabi" }, { code: "pl", name: "Polish" },
    { code: "pt", name: "Portuguese" }, { code: "ro", name: "Romanian" },
    { code: "ru", name: "Russian" }, { code: "sa", name: "Sanskrit" },
    { code: "sd", name: "Sindhi" }, { code: "si", name: "Sinhala" },
    { code: "sk", name: "Slovak" }, { code: "sl", name: "Slovenian" },
    { code: "so", name: "Somali" }, { code: "sq", name: "Albanian" },
    { code: "sr", name: "Serbian" }, { code: "su", name: "Sundanese" },
    { code: "sv", name: "Swedish" }, { code: "sw", name: "Swahili" },
    { code: "ta", name: "Tamil" }, { code: "te", name: "Telugu" },
    { code: "th", name: "Thai" }, { code: "ti", name: "Tigrinya" },
    { code: "tr", name: "Turkish" }, { code: "tt", name: "Tatar" },
    { code: "uk", name: "Ukrainian" }, { code: "ur", name: "Urdu" },
    { code: "uz", name: "Uzbek" }, { code: "vi", name: "Vietnamese" },
    { code: "xh", name: "Xhosa" }, { code: "yo", name: "Yoruba" },
    { code: "zh", name: "Chinese (Simplified)" }, { code: "zh-TW", name: "Chinese (Traditional)" },
    { code: "zu", name: "Zulu" }
  ];

  function fill(select, preferred) {
    if (!select) return;
    select.innerHTML = "";
    LANGS.forEach(({ code, name }) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = name;
      if (preferred && code === preferred) opt.selected = true;
      select.appendChild(opt);
    });
  }

  fill(sourceSel, "auto");
  fill(targetSel, "en");
  if (translateBtn) translateBtn.disabled = false;
});
document.getElementById("translateBtn").addEventListener("click", async () => {
  const text = document.getElementById("sourceText").value;
  const target = document.getElementById("targetLang").value;
  const source = document.getElementById("sourceLang").value || "auto";
  const out = document.getElementById("outputText");
  const btn = document.getElementById("translateBtn");

  if (!text || !text.trim()) {
    if (out) out.value = "Please enter text to translate.";
    return;
  }

  if (out) out.value = "Translating...";
  if (btn) btn.disabled = true;

  // Helper: fetch with timeout
  function fetchWithTimeout(url, options = {}, ms = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
  }

  // Helper: try multiple LibreTranslate instances
  async function translateWithLibre(q, src, tgt) {
    const endpoints = [
      "https://libretranslate.com/translate",
      "https://libretranslate.de/translate",
      "https://translate.astian.org/translate"
    ];
    let lastError = null;
    for (const url of endpoints) {
      try {
        const resp = await fetchWithTimeout(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ q, source: src || "auto", target: tgt, format: "text" })
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) { lastError = json?.error || `HTTP ${resp.status}`; continue; }
        if (json && json.translatedText) return json.translatedText;
        lastError = "Empty response";
      } catch (e) {
        lastError = e?.message || "Network error";
      }
    }
    throw new Error(lastError || "All providers failed");
  }

  // Helper: MyMemory fallback (GET, permissive CORS)
  async function translateWithMyMemory(q, src, tgt) {
    const from = (src && src !== 'auto') ? src : 'en';
    const to = tgt || 'en';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;
    const resp = await fetchWithTimeout(url, { headers: { "Accept": "application/json" } }, 8000);
    const json = await resp.json().catch(() => ({}));
    const text = json?.responseData?.translatedText;
    if (text) return text;
    throw new Error(json?.responseStatus ? `HTTP ${json.responseStatus}` : 'No response');
  }

  try {
    // Try your local server first (if running)
    try {
      const res = await fetch("/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, target_language: target })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Translation failed");
      if (out) out.value = data.translation || "No translation";
      return;
    } catch (_) {}

    // Fallback chain: LibreTranslate -> MyMemory
    let translated;
    try {
      translated = await translateWithLibre(text, source, target);
    } catch (_) {
      translated = await translateWithMyMemory(text, source, target);
    }
    if (out) out.value = translated || "No translation";
  } catch (e) {
    if (out) out.value = `Translation failed: ${e?.message || 'Unknown error'}. Please try again.`;
  } finally {
    if (btn) btn.disabled = false;
  }
});
