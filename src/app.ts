import "dotenv/config"
import { Client, GatewayIntentBits, Events } from 'discord.js';
import Imap from 'imap';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]})
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

client.on(Events.ClientReady, async () => {
    await client.user.setActivity("Receiving Emails");
    console.log('Open Discord Emails, App Running.');
})

client.on(Events.MessageCreate, async msg => {
    console.log(msg);
})

imap.on('ready', () => {
    console.log('email connected');
})

console.log(process.env.EMAIL, process.env.PASSWORD)
imap.connect();
client.login(process.env.DISCORD);