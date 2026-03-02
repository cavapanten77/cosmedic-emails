import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

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
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 15000,
    socketTimeout: 15000,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const { to, cc, subject, body, attachmentPaths } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros faltantes: to, subject, body son obligatorios'
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

                    const arrayBuffer = await data.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

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

        const info = await transporter.sendMail(mailOptions);

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
}
