import OpenAI from 'openai'; // atau pakai Anthropic untuk Claude
import nodemailer from 'nodemailer';

// Konfigurasi OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Konfigurasi Email (pakai Gmail SMTP atau layanan lain)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App Password
    }
});

// Fungsi cek jam operasional
function isJamOperasional() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Minggu, 6 = Sabtu
    
    // Contoh: Senin-Jumat jam 9 pagi - 5 sore
    const isWeekday = day >= 1 && day <= 5;
    const isDuringHours = hour >= 9 && hour < 17;
    
    return isWeekday && isDuringHours;
}

// Fungsi generate balasan AI
async function generateAIResponse(nama, saran) {
    const jamOperasional = isJamOperasional();
    
    const systemPrompt = jamOperasional 
        ? `Anda adalah customer service profesional. Balas saran pelanggan dengan ramah dan informatif. Jelaskan bahwa tim akan segera meninjau saran mereka.`
        : `Anda adalah asisten AI customer service di luar jam operasional (jam kerja: Senin-Jumat 09.00-17.00). Balas saran dengan ramah, jelaskan bahwa ini balasan otomatis AI, dan tim akan menghubungi mereka saat jam kerja. Berikan informasi relevan jika bisa.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // atau gpt-4o untuk hasil lebih baik
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Nama: ${nama}\nSaran: ${saran}` }
        ],
        temperature: 0.7,
        max_tokens: 500
    });

    return completion.choices[0].message.content;
}

// Fungsi kirim ke WhatsApp
async function kirimKeWhatsApp(nama, email, saran) {
    // Pakai API WhatsApp (contoh: Fonnte)
    try {
        await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': process.env.FONNTE_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: process.env.ADMIN_WHATSAPP, // nomor WA admin
                message: `🔔 *SARAN BARU*\n\n` +
                         `👤 Nama: ${nama}\n` +
                         `📧 Email: ${email}\n` +
                         `💬 Saran:\n${saran}\n\n` +
                         `⏰ ${new Date().toLocaleString('id-ID')}`
            })
        });
    } catch (error) {
        console.error('Error kirim WA:', error);
    }
}

// Main Handler
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { nama, email, saran } = req.body;

        // 1. Generate balasan AI
        const aiResponse = await generateAIResponse(nama, saran);

        // 2. Kirim email balasan ke user
        const jamOperasional = isJamOperasional();
        const emailSubject = jamOperasional 
            ? 'Terima kasih atas saran Anda'
            : 'Terima kasih atas saran Anda (Balasan Otomatis AI)';

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: emailSubject,
            html: `
                <h2>Halo ${nama},</h2>
                <p>${aiResponse.replace(/\n/g, '<br>')}</p>
                <br>
                <p>Salam hangat,<br>Tim Customer Service</p>
                ${!jamOperasional ? '<p><em>* Ini adalah balasan otomatis dari AI Assistant kami</em></p>' : ''}
            `
        });

        // 3. Kirim notifikasi ke WhatsApp admin
        await kirimKeWhatsApp(nama, email, saran);

        // 4. Response sukses
        return res.status(200).json({ 
            success: true,
            message: 'Saran berhasil dikirim',
            jamOperasional
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Terjadi kesalahan server' 
        });
    }
}