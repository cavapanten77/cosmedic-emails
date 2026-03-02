-- ===========================================
-- CONFIGURAZIONE PERSONALIZZATA TIPI OPERAZIONI
-- Studio Medico - Chirurgia Plastica
-- ===========================================

-- Elimina i dati di esempio (se presenti)
DELETE FROM tipi_operazioni;

-- ===========================================
-- BLEFAROPLASTICHE
-- Tutte usano: ESAMI BLEFAR-INT PICCOLI.pdf
-- ===========================================

INSERT INTO tipi_operazioni (nome, descrizione, allegati, attivo) VALUES
(
    'Blefaroplastica',
    'Intervento di blefaroplastica',
    ARRAY['interventi/ESAMI BLEFAR-INT PICCOLI.pdf'],
    true
),
(
    'Blefaroplastica Totale',
    'Intervento di blefaroplastica totale (superiore + inferiore)',
    ARRAY['interventi/ESAMI BLEFAR-INT PICCOLI.pdf'],
    true
),
(
    'Blefaroplastica Superiore',
    'Intervento di blefaroplastica superiore',
    ARRAY['interventi/ESAMI BLEFAR-INT PICCOLI.pdf'],
    true
),
(
    'Blefaroplastica Inferiore',
    'Intervento di blefaroplastica inferiore',
    ARRAY['interventi/ESAMI BLEFAR-INT PICCOLI.pdf'],
    true
);

-- ===========================================
-- PROTESI E MASTOPLASTICHE
-- Dipendono dall'età del paziente
-- ===========================================

INSERT INTO tipi_operazioni (nome, descrizione, allegati, attivo) VALUES
(
    'Sostituzione Protesi (< 40 anni)',
    'Sostituzione protesi mammarie - paziente sotto i 40 anni',
    ARRAY['interventi/ESAMI ADD-PESSI SOTTO I 40 ANNI.pdf'],
    true
),
(
    'Sostituzione Protesi (≥ 40 anni)',
    'Sostituzione protesi mammarie - paziente dai 40 anni in su',
    ARRAY['interventi/ESAMI ADD-PESSI SOPRA 40 ANNI-PATOLOGIE.pdf'],
    true
),
(
    'Mastoplastica Riduttiva (< 40 anni)',
    'Intervento di mastoplastica riduttiva - paziente sotto i 40 anni',
    ARRAY['interventi/ESAMI ADD-PESSI SOTTO I 40 ANNI.pdf'],
    true
),
(
    'Mastoplastica Riduttiva (≥ 40 anni)',
    'Intervento di mastoplastica riduttiva - paziente dai 40 anni in su',
    ARRAY['interventi/ESAMI ADD-PESSI SOPRA 40 ANNI-PATOLOGIE.pdf'],
    true
),
(
    'Mastoplastica Additiva (< 40 anni)',
    'Intervento di mastoplastica additiva - paziente sotto i 40 anni',
    ARRAY['interventi/ESAMI ADD-PESSI SOTTO I 40 ANNI.pdf'],
    true
),
(
    'Mastoplastica Additiva (≥ 40 anni)',
    'Intervento di mastoplastica additiva - paziente dai 40 anni in su',
    ARRAY['interventi/ESAMI ADD-PESSI SOPRA 40 ANNI-PATOLOGIE.pdf'],
    true
);

-- ===========================================
-- ALTRI INTERVENTI
-- Dipendono dall'età del paziente
-- ===========================================

INSERT INTO tipi_operazioni (nome, descrizione, allegati, attivo) VALUES
(
    'Liposuzione (< 40 anni)',
    'Intervento di liposuzione - paziente sotto i 40 anni',
    ARRAY['interventi/ESAMI PER TUTTI INTERVENTI.pdf'],
    true
),
(
    'Liposuzione (≥ 40 anni)',
    'Intervento di liposuzione - paziente dai 40 anni in su',
    ARRAY['interventi/ESAMI PER TUTTI INTERVENTI CON PZ CON PATOLOGIE.pdf'],
    true
),
(
    'Lifting (< 40 anni)',
    'Intervento di lifting - paziente sotto i 40 anni',
    ARRAY['interventi/ESAMI PER TUTTI INTERVENTI.pdf'],
    true
),
(
    'Lifting (≥ 40 anni)',
    'Intervento di lifting - paziente dai 40 anni in su',
    ARRAY['interventi/ESAMI PER TUTTI INTERVENTI CON PZ CON PATOLOGIE.pdf'],
    true
);

-- ===========================================
-- VERIFICA
-- ===========================================

-- Visualizza tutte le operazioni inserite
SELECT id, nome, array_length(allegati, 1) as numero_allegati, attivo 
FROM tipi_operazioni 
ORDER BY nome;

-- Dovresti vedere 14 righe (4 blefaroplastiche + 6 protesi/mastoplastiche + 4 altri interventi)
