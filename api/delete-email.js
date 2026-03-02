const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ihemonzmqpgfaftmvoqu.supabase.co';

module.exports = async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID mancante' });
    }

    // Use service key (bypasses RLS); fall back to anon key
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    console.log('Using key type:', process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 'ANON_KEY');

    const supabase = createClient(
        process.env.SUPABASE_URL || SUPABASE_URL,
        serviceKey
    );

    const { data, error, count } = await supabase
        .from('invii_email')
        .delete()
        .eq('id', id)
        .select(); // .select() makes Supabase return deleted rows, confirming the delete happened

    console.log('Delete result - data:', data, 'error:', error, 'count:', count);

    if (error) {
        return res.status(500).json({ success: false, message: error.message, code: error.code });
    }

    // If data is empty array, RLS silently blocked the delete
    if (!data || data.length === 0) {
        return res.status(403).json({
            success: false,
            message: 'Nessuna riga eliminata — accesso bloccato (RLS). Aggiungere policy DELETE su Supabase.'
        });
    }

    return res.status(200).json({ success: true, deleted: data });
};
