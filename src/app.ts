import "dotenv/config"
import { Client, GatewayIntentBits, Events, EmbedBuilder, TextChannel } from 'discord.js';
import startEmailWatch from "./email.js";
import chalk from "chalk";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]})
const CHANNEL_ID = '1265180682741743658';
const ROLE_ID = '1265180425152626768';


async function received(author, subject, body, attachments) {
    const emailEmbed = new EmbedBuilder()
        .setAuthor({ name: `${author.name} <${author.address}>`, iconURL: 'https://cdn3.emoji.gg/emojis/7816-mail.png' })
        .setTitle(subject)
        .setDescription(body)
        .setFooter({ text: `${attachments.length} Attachments.${attachments.length > 0 ? ' Open email in client to download.' : ''}`, iconURL: 'https://cdn-icons-png.freepik.com/512/3756/3756616.png' });
    
    try {
        const channel = await client.channels.cache.get(CHANNEL_ID)
        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send({ content: `<@&${ROLE_ID}>`, embeds: [emailEmbed] });
        }
        else {
            throw 'Channel ID provided is not a text channel or does not exist.'
        }

        console.log(`you got mail! 💻📨 (from ${author.address})`)
    }
    catch (sendErr) {
        console.error(`Could not send an email from ${author.address} in discord due to an error: ${sendErr}.\nThis may be due to Discord itself or a connection issue.`)
    }
}

async function readFail() {
    const emailEmbed = new EmbedBuilder()
        .setColor(0xf25a5a)
        .setDescription('An email was received but could not be read; it can be viewed in the email client.')

    try {
        const channel = await client.channels.cache.get(CHANNEL_ID)
        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send({ content: `<@&${ROLE_ID}>`, embeds: [emailEmbed] });
        }
        else {
            throw 'Channel ID provided is not a text channel or does not exist.'
        }
    }
    catch (sendErr) {
        console.error(`Could not send an error notification in discord due to an error: ${sendErr}.\nThis may be due to Discord itself or a connection issue.`)
    }
}

async function connectFail() {
    console.error('Attempting to reconnect to email.. ensure your credentials and connection are okay.')
}

async function connected() {
    await client.user.setActivity("Receiving Emails..");
    console.log(chalk.green(`Open Discord Emails, App Running 👾\nListening to emails on 📨 ${process.env.EMAIL}\n`));
}

client.on(Events.ClientReady, async () => {
    startEmailWatch(connected, received, readFail, connectFail)
})

client.on(Events.MessageCreate, async msg => {
    if (msg.channel.isThread()) {
        await msg.react('✅');
        console.log(`Sent email with content: ${msg.content}`);
    }
})

client.on(Events.ShardError, () => {
    console.error('An issue occured, but the app is stil running. Discord or your connection may be experiencing issues.')
})

client.login(process.env.DISCORD);