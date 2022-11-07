const Discord = require("discord.js-selfbot-v13")
const client = new Discord.Client({ checkUpdate: false })
const config = require('./config.json')
const { QuickDB } = require("quick.db");
const Intervals = require('./models/intervals.js')
const mongoose = require("mongoose")
const db = new QuickDB();

client.login(config.token)

const fs = require('fs');
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
mongoose.connect("mongodb+srv://discordbot:IWSLhBDlCcxLAbpl@cluster0.w653rm3.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const dbclient = new pg.Client(xszy);
dbclient.connect()


client.on('ready', async () => {
    console.log(`The bot is logged in on ${client.user.tag}`)

})

client.on('messageCreate', async (msg) => {
    if (msg.content.startsWith("!setup") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        if (!args[0]) return console.log('You have to mention the channel ID from which the messages come')
        if (!args[1]) return console.log('You have to mention the channel ID where the messages will go')

        let chido = client.channels.cache.get(args[0])
        let chid1 = client.channels.cache.get(args[1])
        if (!chid1 || !chido) return console.log('Invalid Channel IDs')
        await db.set(`sender_${args[0]}`, args[1])
        console.log('Channel Setted')
        msg.delete().catch((err) => (console.log('Not able to delete the command')))
    } else {
        config.words_included.find(async (x) => {
            if (x.length < 2) return
            if (msg.channel.name.includes(x.toLowerCase())) {

                const text = 'INSERT INTO public.mesgs("authorID", "guildID", "messageID", "messageLink", "channelID", "messageContent", "channelName", "guildName", "authorName")  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)'
                const values = [`${msg.author.id}`, `${msg.guild.id}`, `${msg.id}`, `${msg.url}`, `${msg.channel.id}`, `${msg.content}`, `${msg.channel.name}`, `${msg.guild.name}`, `${msg.author.tag}`]
                await dbclient.query(text, values, (err, res) => {
                    if (err) {
                        console.log(err)
                    } else {
                        setTimeout(async () => {
                            await dbclient.query("SELECT * from public.mesgs", (err, res) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    if (res.rows) {
                                        res.rows.forEach(async (row) => {
                                            if (row.messageID === msg.id && row.channelID === msg.channel.id) {
                                                update(row.messageID, row.channelID)
                                                Intervals.findOne({ messageID: row.messageID, channelID: row.channelID }, async (err, rex) => {
                                                    if (err) return console.log(err)

                                                    let position = 1
                                                    var d = new Date();
                                                    var v = new Date();
                                                    let minutes = parseInt(config.intervals.intervals[position])
                                                    v.setMinutes(d.getMinutes() + minutes);

                                                    const newInterval = new Intervals({
                                                        channelID: row.channelID,
                                                        messageID: row.messageID,
                                                        enddate: v,
                                                        position: 1
                                                    })
                                                    newInterval.save().catch((err) => {
                                                        console.log(err)
                                                    })

                                                })
                                            }
                                        })
                                    }
                                }
                            })


                        }, 6000)
                    }
                })

            }
        })

        if (config.channel_ids.includes(msg.channel.id)) {

            const text = 'INSERT INTO public.mesgs("authorID", "guildID", "messageID", "messageLink", "channelID", "messageContent", "channelName", "guildName", "authorName")  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)'
            const values = [`${msg.author.id}`, `${msg.guild.id}`, `${msg.id}`, `${msg.url}`, `${msg.channel.id}`, `${msg.content}`, `${msg.channel.name}`, `${msg.guild.name}`, `${msg.author.tag}`]
            await dbclient.query(text, values, (err, res) => {
                if (err) {
                    console.log(err)
                } else {
                    setTimeout(async () => {
                        await dbclient.query("SELECT * from public.mesgs", (err, res) => {
                            if (err) {
                                console.log(err)
                            } else {
                                if (res.rows) {
                                    res.rows.forEach(async (row) => {
                                        if (row.messageID === msg.id && row.channelID === msg.channel.id) {
                                            update(row.messageID, row.channelID)
                                            Intervals.findOne({ messageID: row.messageID, channelID: row.channelID }, async (err, rex) => {
                                                if (err) return console.log(err)

                                                let position = 1
                                                var d = new Date();
                                                var v = new Date();
                                                let minutes = parseInt(config.intervals.intervals[position])
                                                v.setMinutes(d.getMinutes() + minutes);

                                                const newInterval = new Intervals({
                                                    channelID: row.channelID,
                                                    messageID: row.messageID,
                                                    enddate: v,
                                                    position: 1
                                                })
                                                newInterval.save().catch((err) => {
                                                    console.log(err)
                                                })

                                            })
                                        }
                                    })
                                }
                            }
                        })


                    }, 6000)
                }
            })

        }
        let chido = await db.get(`sender_${msg.channel.id}`)
        if (chido !== null || chido !== undefined) {
            let chtosend = client.channels.cache.get(`${chido}`)
            if (chtosend) {
                chtosend.send(`Message sent by ${msg.author.tag}\nContent: ${msg.content}`)

            }
        }
    }

})



async function update(messageid, channelid) {

    let channel = client.channels.cache.get(`${channelid}`)
    if (channel) {
        channel.messages.fetch().then(async (messages) => {
            messages.forEach(async (msg) => {
                if (msg.id === messageid) {
                    let amount = 0;
                    let array = []
                    let calculated_count = 0
                    msg.reactions.cache.forEach(async (reaction) => {
                        amount++
                        calculated_count += reaction.count
                        let emojiid = reaction.emoji.id
                        if (emojiid === null) emojiid = ""
                        array.push({ "emojiname": `${reaction.emoji.name}:${emojiid}`, "emojicount": `${reaction.count}` })
                    })
                    let finalarray = JSON.stringify(array)

                    await dbclient.query(`SELECT * from public.mesgs WHERE "messageID"= '${msg.id}' AND "guildID"= '${msg.guild.id}'`, async (err, rex) => {
                        if (err) {
                            return console.log(err)
                        } else {
                            if (rex.rows[0]) {
                                let mainarray = rex.rows[0].reactionhistory
                                let sec_array = []
                                sec_array.push({ "emojicount": `${amount}`, "emojisnumber": `${calculated_count}`, "updatedat": `${new Date()}` })
                                let finishedarrays = ''
                                if (mainarray === null) finishedarrays = sec_array
                                if (mainarray !== null) finishedarrays = mainarray.concat(sec_array)
                                const text = `UPDATE public.mesgs  SET "emojicount" = $1,"emojis" = $2, "emojisnumber" = $3, "reactionhistory" = $4 WHERE "messageID"= '${msg.id}' AND "guildID"= '${msg.guild.id}' `
                                const values = [`${amount}`, `${finalarray}`, `${calculated_count}`, `${JSON.stringify(finishedarrays)}`]
                                await dbclient.query(text, values, (err, res) => {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                    }
                                })

                            }
                        }
                    })
                }
            })
        })

    } else {

    }
}

setInterval(() => {
    Intervals.find({ enddate: { $lte: new Date() } }, async (err, res) => {
        if (err) return console.log(err)
        if (!res) {

        } else {

            res.forEach((doc) => {
                update(doc.messageID, doc.channelID)
                let position = doc.position + 1
                var d = new Date();
                var v = new Date();
                let minutes = parseInt(config.intervals.intervals[position])
                if (minutes) {
                    v.setMinutes(d.getMinutes() + minutes);
                    doc.enddate = v
                    doc.position = position
                    doc.save()

                } else {
                    position = doc.position
                    let finalminutes = parseInt(config.intervals.intervals[position])
                    v.setMinutes(d.getMinutes() + finalminutes);
                    doc.enddate = v
                    doc.position = position
                    doc.save()
                }
            })


        }
    })
}, 10000)