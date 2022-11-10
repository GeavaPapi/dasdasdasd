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
    let intervalss = await db.get(`intervals`)
    if (intervalss === null) intervalss = ['']
    if (msg.content.startsWith("!addchannel") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        if (!args[0]) return console.log('You have to mention the channel ID')
        let chido = client.channels.cache.get(args[0])
        if (!chido) return console.log('Invalid Channel ID')
        await db.push(`channels`, args[0])
        console.log('Channel Setted')
        msg.channel.send({ content: `Channel added` })
        msg.delete().catch((err) => (console.log('Not able to delete the command')))

    } else if (msg.content.startsWith("!addword") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        if (!args[0]) return console.log('You have to mention the word')
        await db.push(`channels_words`, args[0])
        console.log('Channel Setted')
        msg.channel.send({ content: `Word added` })
        msg.delete().catch((err) => (console.log('Not able to delete the command')))
    } else if (msg.content.startsWith("!removechannel") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        if (!args[0]) return console.log('You have to mention the word')
        let allchannels = await db.get(`channels`)
        if (allchannels === null) allchannels = ['']
        let filtred = allchannels.filter(element => element !== `${args[0]}`);
        await db.set(`channels`, filtred)
        console.log('Channels updated')
        msg.channel.send({ content: `Removed channel` })
        msg.delete().catch((err) => (console.log('Not able to delete the command')))
    } else if (msg.content.startsWith("!removeword") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        if (!args[0]) return console.log('You have to mention the word')
        let allchannels = await db.get(`channels_words`)
        if (allchannels === null) allchannels = ['']
        let filtred = allchannels.filter(element => element !== `${args[0]}`);
        await db.set(`channels_words`, filtred)
        console.log('Channels updated')
        msg.channel.send({ content: `Word removed` })
        msg.delete().catch((err) => (console.log('Not able to delete the command')))
    }
    else if (msg.content.startsWith("!showchannels") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        let allchannels = await db.get(`channels`)
        let description = ``
        for (let i in allchannels) {
            description += `${allchannels[i]}\n`
        }
        msg.channel.send({ content: `These are the channel idS that are setted now\n${description}` })
        console.log('Channel Setted')

    }
    else if (msg.content.startsWith("!showwords") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        let allchannels = await db.get(`channels_words`)
        let description = ``
        for (let i in allchannels) {
            description += `${allchannels[i]}\n`
        }
        msg.channel.send({ content: `These are the channel Words that are setted now\n${description}` })
        console.log('Channel Setted')

    }
    else if (msg.content.startsWith("!showintervals") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        let allchannels = await db.get(`intervals`)
        let description = ``
        for (let i in allchannels) {
            description += `${allchannels[i]}\n`
        }
        msg.channel.send({ content: `These are the intervals that are setted now\n${description}` })

    }
    else if (msg.content.startsWith("!setintervals") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        let intervals = msg.content.slice(14)
        let intervals_array = intervals.split(',')
        await db.set(`intervals`, intervals_array)
        msg.channel.send({ content: `Intervals updated` })
        console.log('Intervals Setted')

    }
    else if (msg.content.startsWith("!follow") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        if (args[0] === "announcement") {
            await db.set(`channeltypes`, args[0])
            msg.channel.send({ content: `Type added` })
            console.log('Intervals Setted')
        } else {
            return
        }

    }
    else if (msg.content.startsWith("!unfollow") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        await db.set(`channeltypes`, '')
        msg.channel.send({ content: `Type removed` })
        console.log('Intervals Setted')
    } else if (msg.content.startsWith("!addblacklist") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        if (!args[0]) return console.log('You have to mention the word')
        await db.push(`blacklis_words`, args[0])
        console.log('Channel Setted')
        msg.channel.send({ content: `Word added` })
        msg.delete().catch((err) => (console.log('Not able to delete the command')))
    } else if (msg.content.startsWith("!removeblacklist") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        if (!args[0]) return console.log('You have to mention the word')
        let allchannels = await db.get(`blacklis_words`)
        if (allchannels === null) allchannels = ['']
        let filtred = allchannels.filter(element => element !== `${args[0]}`);
        await db.set(`blacklis_words`, filtred)
        console.log('Channels updated')
        msg.channel.send({ content: `Word removed` })
        msg.delete().catch((err) => (console.log('Not able to delete the command')))
    } else if (msg.content.startsWith("!showblacklist") && msg.author.id === config.owner_id) {
        const args = msg.content.slice(1).split(/ +/);
        const command = args.shift().toLowerCase();
        let allchannels = await db.get(`blacklis_words`)
        let description = ``
        for (let i in allchannels) {
            description += `${allchannels[i]}\n`
        }
        msg.channel.send({ content: `These are the Blacklist Words that are setted now\n${description}` })
        console.log('Channel Setted')

    }
    else {
        let channel_words = await db.get(`channels_words`)
        if (channel_words !== null) {
            channel_words.forEach(async (x) => {
                if (x.length < 2) return
                if (msg.channel.name.includes(x.toLowerCase())) {
                    await db.set(`msg_${msg.channel.id}_${msg.id}_${msg.guild.id}`, 'added')
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
                                                        let intervalss = await db.get(`intervals`)
                                                        if (intervalss === null) return
                                                        let minutes = parseInt(intervalss[position])
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
        }
        let channels = await db.get(`channels`)
        if (channels === null) channels = ['']
        if (channels.includes(msg.channel.id)) {
            let toget = await db.get(`msg_${msg.channel.id}_${msg.id}_${msg.guild.id}`)
            if (toget === "added") return
            await db.set(`msg_${msg.channel.id}_${msg.id}_${msg.guild.id}`, 'added')
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
                                                let intervalss = await db.get(`intervals`)
                                                if (intervalss === null) return
                                                let minutes = parseInt(intervalss[position])
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
        let channeltype = await db.get(`channeltypes`)
        if (msg.channel.type === "GUILD_NEWS" && channeltype === "announcement") {
            let badwords = await db.get(`blacklis_words`)
            console.log(badwords)
            let has = []
            if (badwords !== null) {
                badwords.forEach(async (x) => {
                    if (msg.channel.name.includes(x.toLowerCase())) has.push('yes');
                })
            }
            setTimeout(async () => {
                console.log(has)
                if (has.includes('yes')) return
                let toget = await db.get(`msg_${msg.channel.id}_${msg.id}_${msg.guild.id}`)
                if (toget === "added") return
                await db.set(`msg_${msg.channel.id}_${msg.id}_${msg.guild.id}`, 'added')
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
                                                    let intervalss = await db.get(`intervals`)
                                                    if (intervalss === null) return
                                                    let minutes = parseInt(intervalss[position])
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
            }, 1500)
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

setInterval(async () => {
    let intervalss = await db.get(`intervals`)
    if (intervalss === null) return
    Intervals.find({ enddate: { $lte: new Date() } }, async (err, res) => {
        if (err) return console.log(err)
        if (!res) {

        } else {

            res.forEach((doc) => {
                update(doc.messageID, doc.channelID)
                let position = doc.position + 1
                var d = new Date();
                var v = new Date();
                let minutes = parseInt(intervalss[position])
                if (minutes) {
                    v.setMinutes(d.getMinutes() + minutes);
                    doc.enddate = v
                    doc.position = position
                    doc.save()

                } else {
                    position = doc.position
                    let finalminutes = parseInt(intervalss[position])
                    v.setMinutes(d.getMinutes() + finalminutes);
                    doc.enddate = v
                    doc.position = position
                    doc.save()
                }
            })


        }
    })
}, 10000)