import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';

// Inisialisasi Claude
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY // atau CLAUDE_API_KEY
});

// Konfigurasi Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Cek jam operasional
function isJamOperasional() {
    const now = new Date();
    constjakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const hour = jakartaTime.getHours();
    const day = jakartaTime.getDay();
    
    // Senin-Jumat, 09:00-17:00 WIB
    return (day >= 1 && day <= 5) && (hour >= 9 && hour < 17);
}

// Generate balasan dengan Claude
async function generateClaudeResponse(nama, saran) {
    const jamOperasional = isJamOperasional();
    
    const systemPrompt = jamOperasional 
        ? `Anda adalah customer service profesional untuk sebuah website. 
           Tugas Anda adalah membalas saran pelanggan dengan ramah, profesional, dan helpful dalam bahasa Indonesia.
           
           Panduan balasan:
           - Ucapkan terima kasih atas sarannya
           - Tunjukkan apresiasi dan bahwa saran akan ditinjau tim
           - Bersikap warm dan personal
           - Jika saran spesifik, berikan insight singkat
           - Tutup dengan profesional
           
           Panjang balasan: 3-5 kalimat, tidak perlu terlalu panjang.`
        : `Anda adalah AI Assistant untuk customer service di luar jam operasional.
           
           Info penting:
           - Jam operasional: Senin-Jumat, 09:00-17:00 WIB
           - Sekarang di luar jam kerja, jadi ini balasan otomatis
           
           Tugas Anda:
           - Ucapkan terima kasih atas sarannya
           - Jelaskan dengan ramah bahwa ini balasan otomatis dari AI
           - Sampaikan tim akan meninjau saran saat jam kerja
           - Jika bisa, berikan informasi helpful terkait sarannya
           - Tutup dengan ramah
           
           Tone: Ramah, profesional, tidak kaku. Bahasa Indonesia.
           Panjang: 4-6 kalimat.`;

    try {
        const message = await anthropic.messages.create({
            model: "claude-haiku-4-20250514", // Model termurah & cepat
            // Atau pakai: "claude-sonnet-4-5-20250929" untuk kualitas terbaik
            max_tokens: 600,
            temperature: 0.7,
            system: systemPrompt,
            messages: [{
                role: "user",
                content: `Pelanggan bernama ${nama} memberikan saran berikut:

"${saran}"

Buatkan balasan email yang profesional dan ramah untuk mereka.`
            }]
        });

        return message.content[0].text;
        
    } catch (error) {
        console.error('Error Claude API:', error);
        // Fallback response jika API error
        return jamOperasional
            ? `Halo ${nama},\n\nTerima kasih atas saran Anda! Tim kami akan segera meninjaunya dan menghubungi Anda kembali.\n\nSalam hangat,\nTim Customer Service`
            : `Halo ${nama},\n\nTerima kasih atas saran Anda! Saat ini kami sedang di luar jam operasional (Senin-Jumat, 09:00-17:00 WIB). Tim kami akan meninjau saran Anda dan menghubungi kembali pada jam kerja.\n\nSalam hangat,\nTim Customer Service`;
    }
}

// Kirim ke WhatsApp
async function kirimKeWhatsApp(nama, email, saran) {
    const jamInfo = isJamOperasional() ? '✅ Jam Kerja' : '⏰ Luar Jam Kerja (AI Auto-Reply)';
    
    try {
        await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': process.env.FONNTE_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: process.env.ADMIN_WHATSAPP,
                message: `🔔 *SARAN BARU* - ${jamInfo}\n\n` +
                         `👤 *Nama:* ${nama}\n` +
                         `📧 *Email:* ${email}\n\n` +
                         `💬 *Saran:*\n${saran}\n\n` +
                         `⏰ ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
            })
        });
    } catch (error) {
        console.error('Error kirim WhatsApp:', error);
    }
}

// Main Handler
export default async function handler(req, res) {
    // CORS headers (jika diperlukan)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { nama, email, saran } = req.body;

        // Validasi input
        if (!nama || !email || !saran) {
            return res.status(400).json({ 
                success: false, 
                error: 'Data tidak lengkap' 
            });
        }

        // 1. Generate balasan AI dengan Claude
        console.log('Generating AI response...');
        const aiResponse = await generateClaudeResponse(nama, saran);

        // 2. Kirim email balasan ke user
        const jamOperasional = isJamOperasional();
        const emailSubject = jamOperasional 
            ? '✅ Terima kasih atas saran Anda'
            : '🤖 Terima kasih atas saran Anda (Balasan AI)';

        console.log('Sending email...');
        await transporter.sendMail({
            from: `"Customer Service" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: emailSubject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Halo ${nama}! 👋</h2>
                        
                        <div style="line-height: 1.6; color: #555;">
                            ${aiResponse.replace(/\n/g, '<br><br>')}
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                        
                        <p style="color: #888; font-size: 14px; margin-bottom: 5px;">
                            <strong>Saran Anda:</strong>
                        </p>
                        <p style="color: #666; font-size: 14px; font-style: italic; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                            "${saran}"
                        </p>
                        
                        ${!jamOperasional ? `
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-size: 13px;">
                                ℹ️ <strong>Catatan:</strong> Ini adalah balasan otomatis dari AI Assistant kami karena saat ini di luar jam operasional (Senin-Jumat, 09:00-17:00 WIB). Tim kami akan meninjau saran Anda pada jam kerja.
                            </p>
                        </div>
                        ` : ''}
                        
                        <p style="color: #888; font-size: 14px; margin-top: 25px; margin-bottom: 0;">
                            Salam hangat,<br>
                            <strong style="color: #555;">Tim Customer Service</strong>
                        </p>
                    </div>
                </div>
            `
        });

        // 3. Kirim notifikasi WhatsApp ke admin
        console.log('Sending WhatsApp notification...');
        await kirimKeWhatsApp(nama, email, saran);

        // 4. Response sukses
        return res.status(200).json({ 
            success: true,
            message: 'Saran berhasil dikirim dan dibalas otomatis',
            jamOperasional,
            info: jamOperasional 
                ? 'Balasan langsung dari sistem'
                : 'Balasan otomatis AI (luar jam kerja)'
        });

    } catch (error) {
        console.error('Error handler:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Terjadi kesalahan server',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}