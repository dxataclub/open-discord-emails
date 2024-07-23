import "dotenv/config"
import { Client, GatewayIntentBits, Events } from 'discord.js';
import startEmailWatch from "./email.js";
import chalk from "chalk";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]})

async function received() {

}

async function readFail() {

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

client.on(Events.ShardError, () => {
    console.error('An issue occured, but the app is stil running. Discord or your connection may be experiencing issues.')
})

client.login(process.env.DISCORD);