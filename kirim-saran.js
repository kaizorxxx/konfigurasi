import { generateReply } from '../utils/ai.js';
import { sendEmail } from '../utils/mailer.js';
import { sendWA } from '../utils/wa.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { nama, email, saran } = req.body;
        if (!nama || !email || !saran) return res.status(400).end();

        const reply = await generateReply(nama, saran);
        await sendEmail(email, nama, reply, saran);
        await sendWA(nama, email, saran);

        return res.status(200).json({ success: true });
    } catch (ex) {
        return res.status(500).json({ success: false });
    }
}