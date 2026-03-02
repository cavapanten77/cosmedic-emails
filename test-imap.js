const Imap = require('imap');
const fs = require('fs');

const imap = new Imap({
    user: 'segreteria@cosmedic.it',
    password: 'Cosmedic!c190',
    host: 'mail.cosmedic.it',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
});

function toConsole(err, boxes, indent = '') {
    if (err) throw err;
    for (let boxName in boxes) {
        let box = boxes[boxName];
        console.log(indent + boxName + ' (attribs: ' + (box.attribs || []).join(', ') + ')');
        if (box.children) {
            toConsole(null, box.children, indent + '  ');
        }
    }
}

imap.once('ready', function () {
    console.log('--- Connected to IMAP ---');
    imap.getBoxes(function (err, boxes) {
        if (err) throw err;
        console.log('--- Folders: ---');
        toConsole(null, boxes);

        // Now try to append to whatever looks like Sent
        const sentBox = 'INBOX.Sent'; // Just trying a common one based on the hierarchy we usually see
        console.log(`\n--- Attempting append to ${sentBox} ---`);
        const rawMessage = Buffer.from(
            'From: segreteria@cosmedic.it\r\n' +
            'To: segreteria@cosmedic.it\r\n' +
            'Subject: Test IMAP Append Native\r\n' +
            'Date: ' + new Date().toUTCString() + '\r\n' +
            'MIME-Version: 1.0\r\n' +
            'Content-Type: text/plain; charset=utf-8\r\n\r\n' +
            'This is a local test appended directly via native IMAP.'
        );

        imap.append(rawMessage, { mailbox: sentBox, flags: ['Seen'] }, function (err) {
            if (err) {
                console.error('Append failed to INBOX.Sent:', err.message);

                // Try the top-level Sent
                console.log(`\n--- Attempting append to Sent ---`);
                imap.append(rawMessage, { mailbox: 'Sent', flags: ['Seen'] }, function (err2) {
                    if (err2) {
                        console.error('Append failed to Sent:', err2.message);
                    } else {
                        console.log('Append successful to Sent!');
                    }
                    imap.end();
                });
            } else {
                console.log('Append successful to INBOX.Sent!');
                imap.end();
            }
        });
    });
});

imap.once('error', function (err) {
    console.log('IMAP Error:', err);
});

imap.once('end', function () {
    console.log('Connection ended');
});

console.log('Connecting...');
imap.connect();
