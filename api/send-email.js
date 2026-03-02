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
        logger: false
    });

    try {
        await client.connect();
        // Try common Italian/English sent folder names
        const sentFolders = ['Sent', 'Inviati', 'INBOX.Sent', 'Sent Messages'];
        let saved = false;
        for (const folder of sentFolders) {
            try {
                await client.append(folder, rawMessage, ['\\Seen']);
                saved = true;
                break;
            } catch (e) {
                // Try next folder name
            }
        }
        if (!saved) {
            console.warn('⚠️ Could not find Sent folder, tried:', sentFolders);
        }
    } catch (e) {
        console.error('⚠️ IMAP Sent folder error (non-critical):', e.message);
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

        // Send and get raw message for IMAP
        const info = await transporter.sendMail(mailOptions);

        // Save to IMAP Sent folder in background (non-blocking)
        if (info.response) {
            // nodemailer doesn't give us raw message easily, so we build a minimal one
            const rawMsg = `From: ${mailOptions.from}\r\nTo: ${to}\r\nCc: ${(cc || []).join(', ')}\r\nSubject: ${subject}\r\nDate: ${new Date().toUTCString()}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`;
            saveToSentFolder(Buffer.from(rawMsg)).catch(e => console.error('IMAP error:', e));
        }

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
