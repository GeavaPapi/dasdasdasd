const fs = require('fs')
const Discord = require("discord.js-selfbot-v13")
const client = new Discord.Client({ checkUpdate: false })
const config = require("./config.json")


const pg = require('pg');
const url = require('url');

const postgresqlUri = "postgres://avnadmin:AVNS_gZin0OHKOEMswR_hyml@pg-5e8ac17-sirplsban-be48.aivencloud.com:23349/defaultdb?sslmode=require";

const conn = new URL(postgresqlUri);
conn.search = "";
let keyfile = fs.readFileSync('./ca.pem').toString()
const xszy = {
    connectionString: conn.href,
    ssl: {
        rejectUnauthorized: true,
        ca: keyfile,
    },
};


const dbclient = new pg.Client(xszy);
dbclient.connect()


client.login(config.token)
client.on('ready', async () => {
    async function pushtodb(array, channelid) {
        let channel = client.channels.cache.get(`${channelid}`)
        let chname = ''
        if (channel) chname = channel.name
        const text = `INSERT INTO public.channelhistory("channelID","history", "channelName") VALUES ($1, $2, $3)`
        const values = [`${channelid}`, `${JSON.stringify(array)}`, `${chname}`]
        await dbclient.query(text, values, (err, res) => {
            if (err) {
                console.log(err)
            } else {
                console.log(`Messages from ${channelid} uploaded to DB`)
            }
        })
    }
    async function fetchAllMessages() {

        const channel = client.channels.cache.get(config.channel_id);
        let guild = client.guilds.cache.get(config.guild_id)
        await guild.roles.fetch()
        let messages = [];
        let enddate = new Date("January 1, 2022 00:00:01")
        console.log(enddate.getTime())
        // Create message pointer
        let message = await channel.messages
            .fetch({ limit: 1, })
            .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

        while (message) {
            await channel.messages
                .fetch({ limit: 100, before: message.id })
                .then(messagePage => {
                    messagePage.forEach(msg => { if (msg.createdAt > enddate.getTime()) messages.push(msg) });

                    // Update our message pointer to be last message in page of messages
                    message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
                })
        }

        let array = []
        messages.forEach(async function (msg, index) {
            let msgmember = await msg.guild.members.fetch(`${msg.author.id}`).catch((err) => { })
            let roles = " "
            let rolesarray = []
            let finallenght = messages.length - 1
            if (array.length === finallenght) pushtodb(array, msg.channel.id)
            console.log(array.length)
            if (msgmember !== undefined) {
                if (msgmember._roles !== null || msgmember._roles !== undefined) roles = msgmember._roles
            }
            for (let i in roles) {
                let roletopush = msg.guild.roles.cache.get(roles[i])
               if(roletopush) rolesarray.push(`${roletopush.name}`)
            }

            array.push({ "messageID": msg.id, "messageAuthor": msg.author.id, "messageAuthorUsername": msg.author.tag, "messageLink": msg.url, "messageAuthorRoles": rolesarray })


        })


    }
    fetchAllMessages()
})

