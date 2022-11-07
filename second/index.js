const fs = require('fs')
const _ = require('lodash')
const async = require('async')
const Discord = require('discord.js-selfbot-v13')
const client = new Discord.Client({ checkUpdate: false })
const config = require('./config.json')
const pg = require('pg');
const url = require('url');
const mongoose = require('mongoose')
const Intervals = require('./models/intervals.js')

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




async function init() {
    setInterval(() => {
        async.eachOf(config.servers, (server, i, done) => {
            let list = []
            async.eachOfSeries(server.monitoredChannels, (channelID, k, callback) => {
                let channel = client.channels.cache.find(c => c.id == channelID)
                if (channel) {
                    channel.messages.fetch().then(messages => {
                        messages.map(async (message) => {
                            list.push({ id: message.id, time: message.createdTimestamp })
                            let amount = 0;
                            let array = []
                            let calculated_count = 0
                            message.reactions.cache.forEach(async (reaction) => {
                                calculated_count += reaction.count
                                amount++
                                let emojiid = reaction.emoji.id
                                if (emojiid === null) emojiid = ""
                                array.push({ "emojiname": `${reaction.emoji.name}:${emojiid}`, "emojicount": `${reaction.count}` })
                            })
                            let finalarray = JSON.stringify(array)
                            let data = {
                                content: message.cleanContent,
                                embeds: message.embeds.map(e => {
                                    delete e.message
                                    delete e.type
                                    e = _.mapValues(e, (value, key) => {
                                        if (key == "fields") {
                                            value = value.map(v => {
                                                delete v.embed
                                                return JSON.parse(JSON.stringify(v))
                                            })
                                        }
                                        return value
                                    })
                                    return e
                                }),
                                userID: message.author.id,
                                messageID: message.id,
                                channelID: message.channel.id,
                                guildID: message.guild.id,
                                emojireactions: amount,
                                emojisnumber: calculated_count,
                                emojiarray: finalarray,
                                username: message.author.tag,
                                channelname: message.channel.name,
                                guildname: message.guild.name,
                                content: message.content
                            }

                            const text = `SELECT * FROM public.second WHERE "messageID"= '${data.messageID}' AND "guildID"= '${data.guildID}' AND "channelID" = '${data.channelID}'`
                            await dbclient.query(text, async (err, res) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    if (res.rows[0]) {
                                        const text = `UPDATE public.second  SET "emojicount" = $1,"emojis" = $2, "emojisnumber" = $3 WHERE "messageID"= '${data.messageID}' AND "guildID"= '${data.guildID}' `
                                        const values = [`${data.emojireactions}`, `${data.emojiarray}`, `${data.emojisnumber}`]
                                        await dbclient.query(text, values, (err, res) => {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                            }
                                        })
                                        Intervals.findOne({ messageID: data.messageID, channelID: data.channelID, guildID: data.guildID }, async (err, rex) => {
                                            if (err) return console.log(err)

                                            let position = 0
                                            var d = new Date();
                                            var v = new Date();
                                            let minutes = parseInt(config.intervals.intervals[position])
                                            v.setMinutes(d.getMinutes() + minutes);
                                            if (!rex) {
                                                const newInterval = new Intervals({
                                                    channelID: data.channelID,
                                                    messageID: data.messageID,
                                                    guildID: data.guildID,
                                                    enddate: v,
                                                    position: 1
                                                })
                                                newInterval.save().catch((err) => {
                                                    console.log(err)
                                                })
                                            }
                                        })

                                    } else {
                                        const text = 'INSERT INTO public.second("authorID", "guildID", "messageID", "channelID", "emojicount", "emojis", "authorName", "channelName", "guildName", "messageContent")  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)'
                                        const values = [`${data.userID}`, `${data.guildID}`, `${data.messageID}`, `${data.channelID}`, `${data.emojireactions}`, `${data.emojiarray}`, `${data.username}`, `${data.channelname}`, `${data.guildname}`, `${data.content}`]
                                        await dbclient.query(text, values, (err, res) => {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                            }
                                        })
                                        Intervals.findOne({ messageID: data.messageID, channelID: data.channelID, guildID: data.guildID }, async (err, rex) => {
                                            if (err) return console.log(err)
                                            let position = 0
                                            var d = new Date();
                                            var v = new Date();
                                            let minutes = parseInt(config.intervals.intervals[position])
                                            v.setMinutes(d.getMinutes() + minutes);
                                            if (!rex) {
                                                const newInterval = new Intervals({
                                                    channelID: data.channelID,
                                                    messageID: data.messageID,
                                                    guildID: data.guildID,
                                                    enddate: v,
                                                    position: 1
                                                })
                                                newInterval.save().catch((err) => {
                                                    console.log(err)
                                                })
                                            }
                                        })
                                    }
                                }
                            })

                        })
                        callback()
                    })
                        .catch(e => {
                            console.error(e)
                            callback()
                        })
                }
                else {
                    config.servers[i].monitoredChannels.splice(k, 1)
                    callback()
                }
            }, () => {
                if (list.length > 0) {
                    config.servers[i].lastMessageID = list.reduce((a, b) => a.time > b.time ? a : b).id
                }
                done()
            })
        }, () => {
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 4), "utf-8")
        })
    }, 10000)
}


client.on('error', console.error)
client.on('ready', () => {
    client.guilds.cache.map(guild => {
        let a = _.findIndex(config.servers, (s) => s.guildID == guild.id)
        if (a == -1) {
            config.servers.push({ guildID: guild.id, guildName: guild.name, monitoredChannels: [], lastMessageID: "0" })
            a = config.servers.length - 1
        }
        guild.channels.cache.map(channel => {
            if ((channel.name.toLowerCase().includes("announcement") && channel.type == "text") || channel.type == "news") {
                if (!config.servers[a].monitoredChannels.includes(channel.id)) {
                    config.servers[a].monitoredChannels.push(channel.id)
                    console.log("Added " + channel.name + " channel from " + guild.name + " server to the configuration")
                }
            }
        })
    })
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 4), "utf-8")

    console.log(`${client.user.tag} is logged in!`)


    init()
})
client.login(config.token)

async function update(messageid, channelid, guildid) {
    await dbclient.query(`SELECT * from public.second WHERE "messageID"= '${messageid}' AND "channelID"= '${channelid}' AND "guildID" = '${guildid}'`, async (err, rex) => {
        if (err) {
            return console.log(err)
        } else {
            if (rex.rows) {
                let mainarray = rex.rows[0].reactionhistory
                let sec_array = []
                sec_array.push({ "emojicount": `${rex.rows[0].emojicount}`, "emojisnumber": `${rex.rows[0].emojisnumber}`, "updatedat": `${new Date()}` })
                let finishedarrays = ""
                if (mainarray === null) finishedarrays = sec_array
                if (mainarray !== null) finishedarrays = mainarray.concat(sec_array)
                const text = `UPDATE public.second  SET "reactionhistory" = $1 WHERE "messageID"= '${messageid}' AND "channelID"= '${channelid}' AND "guildID" = '${guildid}'`
                const values = [`${JSON.stringify(finishedarrays)}`]
                await dbclient.query(text, values, (err, res) => {
                    if (err) {
                        console.log(err)
                    } else {
                    }
                })

            } else {
            }
        }
    })
}


setInterval(() => {
    Intervals.find({ enddate: { $lte: new Date() } }, async (err, res) => {
        if (err) return console.log(err)
        if (!res) {
        } else {
            res.forEach((doc) => {
                update(doc.messageID, doc.channelID, doc.guildID).then(() => {
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

            })
        }
    })
}, 10000)