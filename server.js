// =====================================================
// JOY CORPORATION - BACKEND SERVER (Render Ready)
// =====================================================
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// =====================================================
// KONFIGURASI ENVIRONMENT VARIABLES (Diatur di Render)
// =====================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// =====================================================
// ENDPOINT 1: CHAT AI (GROQ ENGINE)
// =====================================================
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ reply: "Pesan tidak boleh kosong." });
    }

    try {
        if (!GROQ_API_KEY) {
            return res.status(500).json({ reply: "[SERVER] GROQ_API_KEY belum diatur di Environment Render." });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", 
                messages: [
                    { 
                        role: "system", 
                        content: "Kamu adalah Tequila, Manager AI dari Joy Corporation. Jawab dengan ramah, profesional, dan panggil pengguna dengan sebutan 'Mas Ade'." 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const reply = data.choices[0].message.content;
        res.json({ reply: reply });

    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ reply: `[SERVER ERROR] Gagal menghubungi otak Groq. (${error.message})` });
    }
});

// =====================================================
// ENDPOINT 2: API KEYS (SUPABASE DATABASE)
// =====================================================
app.get('/api/keys', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase belum dikonfigurasi." });

    try {
        const { data, error } = await supabase.from('api_keys').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/keys', async (req, res) => {
    const { nama_layanan, api_key, status } = req.body;
    if (!supabase) return res.status(500).json({ error: "Supabase belum dikonfigurasi." });

    try {
        const { data, error } = await supabase
            .from('api_keys')
            .insert([{ nama_layanan, api_key, status: status || 'Valid' }])
            .select();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/keys/:id', async (req, res) => {
    const { id } = req.params;
    if (!supabase) return res.status(500).json({ error: "Supabase belum dikonfigurasi." });

    try {
        const { error } = await supabase.from('api_keys').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// JALANKAN SERVER
// =====================================================
app.listen(PORT, () => {
    console.log(`🚀 Joy Corp Server berjalan di port ${PORT}`);
    console.log(`✅ Status Groq: ${GROQ_API_KEY ? 'Siap' : 'Belum diset'}`);
    console.log(`✅ Status Supabase: ${supabase ? 'Siap' : 'Belum diset'}`);
});
