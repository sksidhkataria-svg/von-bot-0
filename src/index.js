const app = require("express")();
const Discord = require('discord.js');
const chalk = require('chalk');
require('dotenv').config();

// Auto-fix for MongoDB variable mismatch between Railway and Bot code
process.env.MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI;

const axios = require('axios');
const webhook = require("./config/webhooks.json");
const config = require("./config/bot.js");
const webHooksArray = ['startLogs', 'shardLogs', 'errorLogs', 'dmLogs', 'voiceLogs', 'serverLogs', 'serverLogs2', 'commandLogs', 'consoleLogs', 'warnLogs', 'voiceErrorLogs', 'creditLogs', 'evalLogs', 'interactionLogs'];
// Check if .env webhook_id and webhook_token are set
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    for (const webhookName of webHooksArray) {
        webhook[webhookName].id = process.env.WEBHOOK_ID;
        webhook[webhookName].token = process.env.WEBHOOK_TOKEN;
    }
}
console.clear();
console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Starting up`)), (chalk.white(`...`)))
console.log(`\u001b[0m`)
console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Version ${require(`${process.cwd()}/package.json`).version}`), (chalk.green(`loaded`)))
console.log(`\u001b[0m`);
app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<iframe style="margin: 0; padding: 0;" width="100%" height="100%" src="https://uoaio.vercel.app/" frameborder="0" allowfullscreen></iframe>`);
    res.end()
});

// MODIFIED FOR RENDER/RAILWAY: Uses dynamic port or falls back to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(chalk.blue(chalk.bold(`Server`)), (chalk.white(`>>`)), (chalk.green(`Running on port`)), (chalk.red(PORT))))

require('./bot')

// Safe Webhooks initialization to prevent crashes if tokens are missing
const consoleLogs = (webhook.consoleLogs?.id && webhook.consoleLogs?.token) 
    ? new Discord.WebhookClient({ id: webhook.consoleLogs.id, token: webhook.consoleLogs.token })
    : null;

const warnLogs = (webhook.warnLogs?.id && webhook.warnLogs?.token)
    ? new Discord.WebhookClient({ id: webhook.warnLogs.id, token: webhook.warnLogs.token })
    : null;

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    if (!consoleLogs) return;
    
    try {
        let errStr = error ? String(error) : "No error";
        if (errStr.length > 950) errStr = errStr.slice(0, 950) + '...';
        
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🚨・Unhandled promise rejection`)
            .addFields([{ name: "Error", value: Discord.codeBlock(errStr) }]);

        consoleLogs.send({ username: 'Bot Logs', embeds: [embed] }).catch(() => {});
    } catch (e) {
        console.log('Webhook logging skipped.');
    }
});

process.on('warning', warn => {
    console.warn("Warning:", warn);
    if (!warnLogs) return;

    try {
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🚨・New warning found`)
            .addFields([{ name: `Warn`, value: `\`\`\`${warn}\`\`\`` }]);

        warnLogs.send({ username: 'Bot Logs', embeds: [embed] }).catch(() => {});
    } catch (e) {
        console.log('Webhook warning skipped.');
    }
});
