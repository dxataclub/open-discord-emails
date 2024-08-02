import "dotenv/config"
import { Client, GatewayIntentBits, Events, EmbedBuilder, TextChannel } from 'discord.js';
import startEmailWatch, { sendMail } from "./email.js";
import chalk from "chalk";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]})
const CHANNEL_ID = '1265180682741743658';
const ROLE_ID = '1265180425152626768kk';

async function received(author, subject, body, attachments) {
    const emailEmbed = new EmbedBuilder()
        .setAuthor({ name: `${author.name} <${author.address}>`, iconURL: 'https://cdn3.emoji.gg/emojis/7816-mail.png' })
        .setTitle(subject)
        .setDescription(body)
        .setFooter({ text: `${attachments.length} Attachments.${attachments.length > 0 ? ' Open email in client to download.' : ''}`, iconURL: 'https://cdn-icons-png.freepik.com/512/3756/3756616.png' });
    
    try {
        const mainChannel: TextChannel = client.channels.cache.get(CHANNEL_ID) as TextChannel;

        if (!mainChannel || !mainChannel.isTextBased()) {
            throw 'Channel ID provided is not a text channel or does not exist.'
        }

        await mainChannel.send({ content: `<@&${ROLE_ID}>`, embeds: [emailEmbed] });
        console.log(`you got mail! 💻📨 (from ${author.address})`)
    }
    catch (sendErr) {
        console.error(`Could not send an email from ${author.address} in discord due to an error: ${sendErr}.\nThis may be due to Discord itself or a connection issue/program bug.`)
    }
}

async function readFail() {
    const emailEmbed = new EmbedBuilder()
        .setColor(0xf25a5a)
        .setDescription('An email was received but could not be read; it can be viewed in the email client.')

    try {
        const mainChannel: TextChannel = client.channels.cache.get(CHANNEL_ID) as TextChannel;

        if (!mainChannel || !mainChannel.isTextBased()) {
            throw 'Channel ID provided is not a text channel or does not exist.'
        }

        await mainChannel.send({ content: `<@&${ROLE_ID}>`, embeds: [emailEmbed] });
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
    const ref = msg.reference;

    try {
        if (!msg.author.bot && msg.author.id !== client.user.id && ref.channelId === CHANNEL_ID) {
            const refMsg = await msg.channel.messages.fetch(ref.messageId)
            const thread = msg.channel;
    
            if (thread.parentId !== CHANNEL_ID)
                return;
    
            const mainChannel: TextChannel = client.channels.cache.get(CHANNEL_ID) as TextChannel;
    
            if (!mainChannel || !mainChannel.isTextBased()) {
                throw 'Channel ID provided is not a text channel or does not exist.'
            }
    
            const emailMsg = await mainChannel.messages.fetch(thread.id);
            const prevEmail = emailMsg.embeds[0].data;
            let atag = prevEmail.author.name.split('<');
    
            const subject = prevEmail.title;
            const author: string = atag[atag.length - 1].split('>')[0]; 
    
            await sendMail(author, `Re: ${subject}`, msg.content);
    
            msg.channel.send("Sent");
            //await msg.react('✅');
            //await msg.reply(`Reply sent. This thread will not reply to emails anymore.`)
            // console.log(`Sent email with content: ${msg.content}`);
        }
    }
    catch (replyErr) {
        console.error(`Could not handle potential email reply due to error: ${sendErr}.\nThis may be due to Discord itself or a connection issue/program bug.`)
    }
})

client.on(Events.ShardError, () => {
    console.error('An issue occured, but the app is stil running. Discord or your connection may be experiencing issues.')
})

client.login(process.env.DISCORD);