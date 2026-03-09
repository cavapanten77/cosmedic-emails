const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const Imap = require('imap');
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

// Save email copy to IMAP Sent folder using node-imap (confirmed working locally)
function saveToSentFolder(rawMessage) {
    return new Promise((resolve) => {
        const imap = new Imap({
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD,
            host: process.env.SMTP_HOST,
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 10000,
            authTimeout: 10000
        });

        imap.once('ready', function () {
            console.log('📁 IMAP connected, appending to INBOX.Sent...');
            imap.append(rawMessage, { mailbox: 'INBOX.Sent', flags: ['Seen'] }, function (err) {
                if (err) {
                    console.error('⚠️ IMAP append error:', err.message);
                } else {
                    console.log('✅ Email saved to INBOX.Sent successfully');
                }
                imap.end();
                resolve();
            });
        });

        imap.once('error', function (err) {
            console.error('⚠️ IMAP connection error:', err.message);
            resolve(); // Don't fail the main request
        });

        imap.once('end', function () {
            resolve();
        });

        imap.connect();
    });
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
        const attachmentWarnings = [];

        if (attachmentPaths && attachmentPaths.length > 0) {
            for (const filePath of attachmentPaths) {
                try {
                    console.log(`📎 Tentativo download allegato: "${filePath}"`);

                    const { data, error } = await supabase.storage
                        .from('allegati')
                        .download(filePath);

                    if (error) {
                        const warnMsg = `ERRORE download "${filePath}": ${JSON.stringify(error)}`;
                        console.error('❌', warnMsg);
                        attachmentWarnings.push(warnMsg);

                        // Fallback: prova con signed URL (1 ora)
                        console.log(`🔄 Fallback: tentativo signed URL per "${filePath}"...`);
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('allegati')
                            .createSignedUrl(filePath, 3600);

                        if (signedError || !signedData?.signedUrl) {
                            const signedWarn = `ERRORE signed URL "${filePath}": ${JSON.stringify(signedError)}`;
                            console.error('❌', signedWarn);
                            attachmentWarnings.push(signedWarn);
                            continue;
                        }

                        // Fetch dal signed URL
                        const fetch = require('node-fetch');
                        const fetchResp = await fetch(signedData.signedUrl);
                        if (!fetchResp.ok) {
                            const fetchWarn = `ERRORE fetch signed URL "${filePath}": ${fetchResp.status} ${fetchResp.statusText}`;
                            console.error('❌', fetchWarn);
                            attachmentWarnings.push(fetchWarn);
                            continue;
                        }
                        const buffer = Buffer.from(await fetchResp.arrayBuffer());
                        attachments.push({ filename: path.basename(filePath), content: buffer });
                        console.log(`✅ Allegato scaricato via signed URL: "${filePath}"`);
                        continue;
                    }

                    const buffer = Buffer.from(await data.arrayBuffer());
                    attachments.push({
                        filename: path.basename(filePath),
                        content: buffer
                    });
                    console.log(`✅ Allegato scaricato: "${filePath}"`);
                } catch (err) {
                    const warnMsg = `ECCEZIONE processing allegato "${filePath}": ${err.message}`;
                    console.error('❌', warnMsg);
                    attachmentWarnings.push(warnMsg);
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

        // Send email via SMTP
        console.log('📧 Sending email via SMTP...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ SMTP send successful:', info.messageId);

        // Build raw RFC 2822 message for IMAP
        // Encode subject with RFC 2047 (Base64) to handle special chars like < > ( )
        const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const ccLine = (cc && cc.length) ? `Cc: ${cc.join(', ')}\r\n` : '';
        const rawMessage = Buffer.from(
            `From: ${mailOptions.from}\r\n` +
            `To: ${to}\r\n` +
            `${ccLine}` +
            `Subject: ${encodedSubject}\r\n` +
            `Date: ${new Date().toUTCString()}\r\n` +
            `MIME-Version: 1.0\r\n` +
            `Content-Type: text/html; charset=utf-8\r\n` +
            `\r\n` +
            `${mailOptions.html}`
        );

        // Await IMAP save BEFORE returning (Vercel kills background tasks on res.send)
        await saveToSentFolder(rawMessage);

        return res.status(200).json({
            success: true,
            message: 'Email inviata con successo',
            messageId: info.messageId,
            allegatiCaricati: attachments.length,
            allegatiRichiesti: (attachmentPaths || []).length,
            warnings: attachmentWarnings.length > 0 ? attachmentWarnings : undefined
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
