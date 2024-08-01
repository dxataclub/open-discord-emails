import Imap from 'imap';
import { simpleParser } from 'mailparser';

const host = process.env.HOST || 'imap.gmail.com'
const port = process.env.PORT || 993

const imap = new Imap({
    user: process.env.EMAIL,
    password: process.env.PASSWORD,
    host,
    port,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    },
});

function handleMail(emailCb, emailReadErr) {
    imap.search(['UNSEEN'], (err, results) => {
        if (err) return emailReadErr(err);
        if (!results || !results.length) return;

        const f = imap.fetch(results[results.length - 1], { bodies: '' })
        let mailBuffer = Buffer.from('');

        f.on('message', msg => {
            msg.once('body', stream => {
                stream.on('data', chunk => {
                    mailBuffer = Buffer.concat([mailBuffer, chunk])
                })
            });

            msg.once('attributes', function (attrs) {
                const { uid } = attrs;
                imap.addFlags(uid, ['\\Seen']);
            })
        })

        f.once('error', err => {
            emailReadErr(err);
        });

        f.once('end', () => {
            simpleParser(mailBuffer, (err, mail) => {
                if (err) return emailReadErr(err);
                emailCb(mail.from.value[0], mail.subject, mail.text, mail.attachments);
            })
        });
    })
}

export default function startEmailWatch(startCb, emailCb, emailReadErr, connectErr) {
    imap.on('ready', () => {
        imap.openBox('INBOX', false, err => {
            if (err) throw err;
            startCb()
            imap.on('mail', () => handleMail(emailCb, emailReadErr));
        });
    })

    imap.on('error', err => {
        connectErr(err);
        imap.connect();
    })

    imap.on('end', () => {
        imap.connect();
    })
    
    imap.connect();
}
