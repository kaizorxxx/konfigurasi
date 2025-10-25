export async function sendWA(name, mail, text) {
    await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': process.env.C5Bq7bEimJ7sZYES4gKZ },
        body: JSON.stringify({
            target: process.env.6285183141720,
            message: `Dari: ${name}\nEmail: ${mail}\nPesan: ${text}`
        })
    });
}
