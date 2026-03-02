const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { ImapFlow } = require('imapflow');
const path = require('path');

// Supabase config
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ihemonzmqpgfaftmvoqu.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// SMTP configuration with timeouts
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Save email copy to IMAP Sent folder
async function saveToSentFolder(rawMessage) {
    const client = new ImapFlow({
        host: process.env.SMTP_HOST,
        port: 993,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        logger: false,
        tls: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Connecting to IMAP...');
        await client.connect();

        const sentFolderPath = 'INBOX/Sent';
        console.log('📤 Saving to Sent folder:', sentFolderPath);

        await client.append(sentFolderPath, rawMessage, ['\\Seen']);
        console.log('✅ Email saved to Sent folder successfully');
        return true;
    } catch (e) {
        console.error('⚠️ IMAP Sent folder error:', e.message);
        return false;
    } finally {
        try { await client.logout(); } catch (_) { }
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const { to, cc, subject, body, attachmentPaths } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({
                success: false,
                message: 'Parametri mancanti: to, subject, body sono obbligatori'
            });
        }

        const attachments = [];

        if (attachmentPaths && attachmentPaths.length > 0) {
            for (const filePath of attachmentPaths) {
                try {
                    const { data, error } = await supabase.storage
                        .from('allegati')
                        .download(filePath);

                    if (error) {
                        console.error(`Errore download allegato ${filePath}:`, error);
                        continue;
                    }

                    const buffer = Buffer.from(await data.arrayBuffer());
                    attachments.push({
                        filename: path.basename(filePath),
                        content: buffer
                    });
                } catch (error) {
                    console.error(`Errore processing allegato ${filePath}:`, error);
                }
            }
        }

        const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: to,
            cc: cc || [],
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br>'),
            attachments: attachments
        };

        // Send email and capture raw message
        console.log('📧 Sending email via SMTP...');
        const info = await transporter.sendMail({
            ...mailOptions
        });
        console.log('✅ SMTP Send successful:', info.messageId);

        // Build raw RFC 2822 message for IMAP
        const now = new Date().toUTCString();
        const ccLine = (cc && cc.length) ? `Cc: ${cc.join(', ')}\r\n` : '';
        const rawMessage = Buffer.from(
            `From: ${mailOptions.from}\r\n` +
            `To: ${to}\r\n` +
            `${ccLine}` +
            `Subject: ${subject}\r\n` +
            `Date: ${now}\r\n` +
            `MIME-Version: 1.0\r\n` +
            `Content-Type: text/html; charset=utf-8\r\n` +
            `\r\n` +
            `${mailOptions.html}`
        );

        // CRITICAL FIX: Await the IMAP save BEFORE returning the HTTP response.
        // Vercel serverless functions freeze immediately when the response is sent.
        console.log('💾 Triggering IMAP save...');
        await saveToSentFolder(rawMessage);

        return res.status(200).json({
            success: true,
            message: 'Email inviata con successo',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Errore invio email:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore durante l\'invio dell\'email',
            error: error.message
        });
    }
};
