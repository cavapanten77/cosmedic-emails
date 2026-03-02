-- ===========================================
-- AGGIORNA TEMPLATE EMAIL CON TESTO COSMEDIC
-- ===========================================

-- Elimina template esistente
DELETE FROM template_email;

-- Inserisci il nuovo template personalizzato
INSERT INTO template_email (nome, contenuto, attivo) VALUES (
    'Template Cosmedic 2026',
    '{saluto} {titolo} {cognome},
con la seguente sono a confermarLe l''intervento di {tipoOperazione} per il giorno {dataIntervento}. Alle ore {oraInizio}
Si richiede di presentarsi in clinica {tempoArrivo} prima dell''orario dell''intervento (quindi alle ore {orarioArrivo}) presso {sedeclinica}.

In preparazione di tale intervento vorrei porre la Sua attenzione su alcuni punti fondamentali perché si svolga tutto nel migliore dei modi:
- PRE-OPERATORIO: nei giorni precedenti all''intervento, La contatterà l''infermiera professionista Monica Fantacci, che diventerà la Sua referente per il preoperatorio e alla quale dovrà inviare via mail l''esito degli esami. La preghiamo quindi di interfacciarsi solo con Monica e di non far riferimento al personale dello studio Cosmedic o direttamente alla dottoressa Taidelli per non generare confusione.
- ESAMI PRE-OPERATORI: Alleghiamo copia della ricetta medica per Vs controllo esami. Le prescrizioni sono valide per gli esami da eseguire in regime privato, in caso desiderereste accedere con SSN, rivolgersi al proprio medico di base.
- GIORNO DELL''INTERVENTO: Il giorno dell''intervento viene indicato in capo all''e-mail, in caso di cambiamenti di orario o giorno, gli stessi verranno prontamente comunicati. Si prega presentarsi il giorno dell''intervento a digiuno di cibo ed acqua dalla mezzanotte, con vestiti comodi; in caso di gel alle unghie dovrà essere totalmente rimosso dal dito indice della mano destra, senza trucco, e con le Vs medicine (se previste nel Vs piano di cura quotidiano) assunte con una minima quantità d''acqua solo per permetterne l''ingerimento, salvo diversa comunicazione precedentemente data dall''anestesista o dalla infermiera.
- RECESSO: La disdetta dell''intervento, che dovrà essere inviata tassativamente all''indirizzo mail segreteria@cosmedic.it, può essere effettuata entro 15 giorni lavorativi dall''intervento senza costi aggiuntivi o penali. Sarà altresì giustificata, anche il giorno dell''intervento, solo in caso di comprovata emergenza, accompagnata da adeguata certificazione medica o legale. Viceversa, la metà dell''ammontare dell''intervento Le verrà fatturata come acconto sulla riprogrammazione dello stesso o come rimborso spese in caso non venga più effettuato.
- ASSICURAZIONE INTERVENTO: Consigliamo una assicurazione per le eventuali complicanze relative all''intervento con validità da 1 a 5 anni, a vostra discrezione. Per la sottoscrizione verrà contattata personalmente dal dott. Cardini Mattia, referente Medassure che ci legge in copia, lo stesso le invierà la documentazione necessaria per la sottoscrizione e per il saldo, che dovrà essere da lei effettuato prima dell''intervento, tutto direttamente con assicuratore. L''ammontare di tale somma, ricordiamo, non è annoverato nelle voci del preventivo. Se si desidera sottoscrivere la procedura di adesione, si ricorda che LA SOTTOSCRIZIONE della stessa dovrà essere effettuata entro E NON OLTRE le ore 24.00 del giorno precedente la data programmata per l''intervento, poi riceverà la Polizza al Suo indirizzo di posta elettronica. In caso il Dottor Cardini non la contattasse, le chiediamo la cortesia di scrivergli direttamente Lei una mail.
- MODALITA'' DI PAGAMENTO: il saldo dell''intervento verrà versato il giorno dell''intervento con modalità previamente concordata con la Dottoressa Taidelli in sede di colloquio. Nei giorni successivi all''intervento riceverà le fatture relative ai pagamenti effettuati e concordati.

Ricordiamo che la data e l''orario dell''intervento potranno subire variazioni fino a 48 ore dallo stesso, a seconda delle prenotazioni e della disponibilità della sala operatoria.
Per confermare la prenotazione dell''intervento, Le chiederei cortesemente di rispondere a questa mail per accettazione delle clausole di cui sopra e di mantenere in copia conoscenza lo Studio Medico Cosmedic nella corrispondenza mail.
Rimaniamo in attesa di gentile riscontro e a disposizione per qualsiasi ulteriore chiarimento.
Cordiali saluti.

Staff Cosmedic Srl',
    true
);

-- Verifica
SELECT nome, attivo, created_at FROM template_email;
