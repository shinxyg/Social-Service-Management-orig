const SYSTEM_CONTEXT = `Ikaw ay AI Assistant ng Social Services Management Portal ng Quezon City.
Tumutulong ka sa mga residente na maintindihan ang mga programa at requirements ng AICS
(Medical, Funeral, Educational, Material, Food, Transportation Assistance), PWD & Senior
Citizen Services, Solo Parent & Child Welfare, Livelihood & Training Program, at Financial
Aid Disbursement.

Sumagot ka nang maikli, malinaw, at magalang, gamit ang Taglish o Filipino kung angkop.
Kung hindi mo alam ang sagot o tungkol ito sa specific na status ng application ng user,
sabihin mong dapat mag-contact sila ng SSDD office o mag-log in sa portal para makita ang
status nila. Huwag gumawa ng impormasyon na hindi mo sigurado.`;

exports.sendMessage = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Kailangan ng message.' });
    }

    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
      { role: 'model', parts: [{ text: 'Naiintindihan ko. Handa akong tumulong.' }] },
    ];

    // Idagdag ang chat history kung meron (para may "memory" ang usapan)
    if (Array.isArray(history)) {
      history.forEach((h) => {
        contents.push({
          role: h.from === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      });
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return res.status(502).json({ error: 'May problema sa AI service.' });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Paumanhin, hindi ako makapagbigay ng sagot ngayon.';

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'May naganap na error sa chat.' });
  }
};