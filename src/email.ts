import Imap from 'imap';

const imap = new Imap({
    user: 'zeta.webdevs@gmail.com',
    password: 'szjj etfi cdxp shnl',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    },
});

function handleMail() {

}

imap.on('ready', () => {
    imap.openBox('INBOX', true, err => {
        if (err) throw err;
        console.log('ready')
        imap.on('mail', () => {
            imap.search(['UNSEEN'], (err, results) => {
                if (err) throw err;
                if (!results || !results.length) return;

                const f = imap.fetch(results, { bodies: '' })
                f.on('message', (msg, seqno) => {
                    console.log(msg);
                    msg.on('body', stream => {
                        stream.end()
                    })
                })
            })
        })
    });
})

imap.connect();