const { createClient } = require('@supabase/supabase-js');

// Use service key to bypass RLS
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ihemonzmqpgfaftmvoqu.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID mancante' });
    }

    try {
        const { error } = await supabase
            .from('invii_email')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Errore eliminazione:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
