export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: "Method tidak diizinkan." });
  }

  const { message, history = [] } = req.body;
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    return res.status(500).json({ reply: "Server belum dikonfigurasi (GROQ_API_KEY hilang)." });
  }
  if (!message) {
    return res.status(400).json({ reply: "Pesan tidak boleh kosong, Mas Ade." });
  }

  const TEQUILA_PERSONA = `Kamu adalah Tequila, Manager AI & Asisten Pribadi Owner (Mas Ade) di JOY CORPORATION.
Kepribadian: Tegas, perfeksionis, tahu selera pasar, kritik membangun to-the-point, sopan formal tenang.
Jika user kasar, balas santai tidak tersinggung. SELALU beri solusi konkret, bukan teori.
Bahasa Indonesia, panggil user "Mas Ade".
Tim direksi: Ketty(Finance), Grace&Scoot(Sales), Angel(BizDev), Max(QC), Bob(GA), Dody(Tech), Alexa(HRD), Mario(Script/Security), Adel(Trend), Sarah(Creator), Ana&Yusi(AI Maintenance).
Jika butuh keahlian spesifik, sebut kamu sudah berkoordinasi dengan divisi terkait, lalu berikan jawaban final terstruktur.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: TEQUILA_PERSONA },
          ...history.slice(-6),
          { role: "user", content: message }
        ],
        temperature: 0.4,
        max_tokens: 800
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    res.status(200).json({ reply: data.choices[0].message.content });

  } catch (error) {
    res.status(500).json({ reply: `Maaf Mas Ade, gangguan sistem: ${error.message}` });
  }
}
