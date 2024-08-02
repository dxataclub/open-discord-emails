import "dotenv/config"
import { Client, GatewayIntentBits, Events, EmbedBuilder, TextChannel } from 'discord.js';
import startEmailWatch, { sendMail } from "./email.js";
import chalk from "chalk";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]})
const CHANNEL_ID = '1265180682741743658';
const ROLE_ID = '1265180425152626768';

const READY_IND = '(reply to email by replying to msg)';
const DONE_IND = '*(email replied to)*';

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

        await mainChannel.send({ content: `<@&${ROLE_ID}> ${READY_IND}`, embeds: [emailEmbed] });
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

    if (!ref)
        return;

    try {
        if (!msg.author.bot && msg.author.id !== client.user.id && ref.channelId === CHANNEL_ID) {
            const refMsg = await msg.channel.messages.fetch(ref.messageId)

            if (refMsg.author.id !== client.user.id || !refMsg.content.endsWith(READY_IND))
                return

            const mainChannel: TextChannel = client.channels.cache.get(CHANNEL_ID) as TextChannel;
            const prevEmail = refMsg.embeds[0].data;
            let atag = prevEmail.author.name.split('<');
    
            const subject = prevEmail.title;
            const author: string = atag[atag.length - 1].split('>')[0]; 
    
            await sendMail(author, `Re: ${subject}`, msg.content);
    
            const successEmbed = new EmbedBuilder()
                .setColor(0x6dd164)
                .setDescription('Reply was sent. Further replies can only be made to new emails.');
                
            await refMsg.edit(`<@&${ROLE_ID}> ${DONE_IND}`)
            await msg.react('✅');
            const successMsg = await msg.reply({ embeds: [successEmbed] });
            console.log(`@${msg.author.globalName} replied to email (subj: ${subject}) from ${prevEmail.author.name}`);

            setTimeout(async () => {
                try {
                    await successMsg.delete();
                }
                catch {}
            }, 6000);
        }
    }
    catch (replyErr) {
        console.error(`Could not handle potential email reply due to error: ${replyErr}.\nThis may be due to Discord itself or a connection issue/program bug.`)
    }
})

client.on(Events.ShardError, () => {
    console.error('An issue occured, but the app is stil running. Discord or your connection may be experiencing issues.')
})

client.login(process.env.DISCORD);