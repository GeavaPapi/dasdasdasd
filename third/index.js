const fs = require('fs')
const _ = require('lodash')
const Discord = require("discord.js-selfbot-v13")
const client = new Discord.Client({ checkUpdate: false })
const details = require("./config.json")
const config = JSON.parse(fs.readFileSync("./config.json"))
const Intervals = require('./models/intervals.js')
const pg = require('pg');
const url = require('url');
const mongoose = require('mongoose')

const postgresqlUri = "postgres://avnadmin:AVNS_gZin0OHKOEMswR_hyml@pg-5e8ac17-sirplsban-be48.aivencloud.com:23349/defaultdb?sslmode=require";


mongoose.connect("mongodb+srv://discordbot:IWSLhBDlCcxLAbpl@cluster0.w653rm3.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

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



client.on("messageCreate", async (message) => {
    if (message.author.id === details.owner_id) {
        const command = message.content.split(/ +/g)[0]
        const msg = message.content.slice(command.length).trim().replace(/\s+/g, ' ')
        const args = msg.split(" ")
        if (message.content.startsWith(config.prefix + "adduser")) {
            const user = args[0]
            if (user && user != "") {
                if (!config.users.includes(user)) {
                    config.users.push(user)
                    fs.writeFile('./config.json', JSON.stringify(config, null, 4), "utf-8", ((err) => { if (err) { console.error(err) } }))
                    console.log("✅ | Added successfully.")
                    let userid = await args[0]
                    let messages = [];
                    let enddate = new Date("January 1, 2022 00:00:01")


                    async function pushtodb(array, reactarr) {
                        const text = `INSERT INTO public.monitorusers("userid","messages", "reactions") VALUES ($1, $2, $3)`
                        const values = [`${userid}`, `${JSON.stringify(array)}`, `${JSON.stringify(reactarr)}`]
                        await dbclient.query(text, values, (err, res) => {
                            if (err) {
                                console.log(err)
                            } else {
                                console.log(`Messages for ${userid} uploaded to DB`)
                            }
                        })
                    }

                    let channel = client.channels.cache.get(`908180707157876801`)
                    let message = await channel.messages
                        .fetch({ limit: 1, })
                        .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

                    while (message) {
                        await channel.messages
                            .fetch({ limit: 100, before: message.id })
                            .then(messagePage => {
                                messagePage.forEach(msg => { if (msg.createdAt > enddate.getTime() && msg.author.id === userid) messages.push(msg) });

                                // Update our message pointer to be last message in page of messages
                                message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
                            })

                    }
                    let array = []
                    let reactions_aray = []
                    messages.forEach(async function (msg, index) {
                        let calculated_count = 0
                        let amount = 0;
                        let finallenght = messages.length - 1
                        if (array.length === finallenght) {
                            pushtodb(array, reactions_aray)
                        }
                        msg.reactions.cache.forEach(async (reaction) => {
                            calculated_count += reaction.count
                            amount++
                        })
                        array.push({ "messageID": `${msg.id}`, "messageLink": `${msg.url}`, "messageTime": `${msg.createdTimestamp}`, "messageChannelID": `${msg.channel.id}`, "messageGuildID": `${msg.guild.id}`, "messageChannelName": `${msg.channel.name}`, "messageGuildName": `${msg.guild.name}`, "messageContent": `${msg.content}` })
                        reactions_aray.push({ "messageID": `${msg.id}`, "emojitypes": `${amount}`, "emojicount": `${calculated_count}` })
                    })
                } else {
                    console.log("❌ | There's already a monitor for that user.")
                    message.delete().catch((err) => { })

                }
            }
            else {
                console.log("❌ | Please specify the user ID.")
                message.delete().catch((err) => { })
            }
        } else if (message.content.startsWith(config.prefix + "deleteuser")) {
            const user = args[0]
            if (user && user != "") {
                const a = config.users.indexOf(user)
                if (a != -1) {
                    config.users.splice(a, 1)
                    fs.writeFile('./config.json', JSON.stringify(config, null, 4), "utf-8", ((err) => { if (err) { console.error(err) } }))
                    console.log("✅ | User Deleted.")
                    const text = `DROP TABLE particular.${args[0]}`
                    await dbclient.query(text, (err, res) => {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log(res)
                        }
                    })


                    message.delete().catch((err) => { })
                }
                else {
                    console.log("❌ | Couldn't find a user with that ID in the list.")
                    message.delete().catch((err) => { })
                }
            }
            else {
                console.log("❌ | Please specify the user ID to delete.")
                message.delete().catch((err) => { })
            }
        } else if (message.content.startsWith(config.prefix + "users")) {
            if (config.users.length > 0) {
                let text = config.users.map(u => "<@" + u + ">").join(", ")
                console.log("**Users:** " + text)
                message.delete().catch((err) => { })

            }
            else {
                console.log("❌ | There are no users currently monitored.")
                message.delete().catch((err) => { })
            }
        }
    }
    else {
        if (config.users.includes(message.author.id)) {
            let data = {
                userID: message.author.id,
                username: message.author.tag,
                channelID: message.channel.id,
                channelName: message.channel.name,
                guildID: message.guild.id,
                guildName: message.guild.name,
                msgLink: message.url,
                msgID: message.id,
                msgTime: message.createdTimestamp,
                content: message.content
            }
            await dbclient.query(`SELECT * from public.monitorusers WHERE "userid" = '${message.author.id}'`, async (err, rex) => {
                if (err) {
                    return console.log(err)
                } else {

                    if (rex.rows[0]) {
                        let mainarray = rex.rows[0].messages
                        let array = []
                        array.push({ "messageID": `${data.msgID}`, "messageLink": `${data.msgLink}`, "messageTime": `${data.msgTime}`, "messageChannelID": `${data.channelID}`, "messageGuildID": `${data.guildID}`, "messageChannelName": `${data.channelName}`, "messageGuildName": `${data.guildName}`, "messageContent": `${data.content}` })
                        let finishedarrays = ''
                        if (mainarray === null) finishedarrays = array
                        if (mainarray !== null) finishedarrays = mainarray.concat(array)
                        const text = `UPDATE public.monitorusers SET "messages" = $1, "username" = $2 WHERE "userid"= '${message.author.id}'`
                        let position = 0
                        var d = new Date();
                        var v = new Date();
                        let minutes = parseInt(config.intervals[position])
                        v.setMinutes(d.getMinutes() + minutes);
                        const newdoc = new Intervals({
                            channelID: data.channelID,
                            messageID: data.msgID,
                            userID: data.userID,
                            guildID: data.guildID,
                            enddate: v,
                            position: position

                        })
                        newdoc.save()
                        const values = [`${JSON.stringify(finishedarrays)}`, `${data.username}`]
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

    }

})

async function update(userid, messageid, channelid) {
    let channel = await client.channels.cache.get(channelid)
    if (channel) {
        await channel.messages.fetch().then(async (messages) => {
            messages.forEach(async (msg) => {
                if (config.users.includes(msg.author.id) && msg.id === messageid) {
                    let amount = 0;
                    let calculated_count = 0
                    msg.reactions.cache.forEach(async (reaction) => {
                        amount++
                        calculated_count += reaction.count
                    })
                    await dbclient.query(`SELECT * from public.monitorusers WHERE "userid" = '${userid}'`, async (err, rex) => {
                        if (err) {
                            return console.log(err)
                        } else {
                            if (rex.rows[0]) {
                                let mainarray = rex.rows[0].reactions
                                const removePlaylistById = (plists, id) => plists.filter(playlist => playlist.messageID !== id);
                                if (mainarray !== null) {
                                    let editedarray = removePlaylistById(mainarray, messageid)
                                    editedarray.push({ "messageID": `${messageid}`, "emojicount": `${calculated_count}`, "emojitypes": `${amount}` })
                                    const text = `UPDATE public.monitorusers SET "reactions" = $1, "userid"= '${userid}'`
                                    const values = [`${JSON.stringify(editedarray)}`]
                                    await dbclient.query(text, values, async (err, res) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            let secmainarray = rex.rows[0].reactionhistory
                                            let sec_array = []
                                            sec_array.push({ "messageID": `${messageid}`, "emojitypes": `${amount}`, "emojicount": `${calculated_count}`, "updatedat": `${new Date()}` })
                                            let finishedarrays = ''
                                            if (secmainarray === null) finishedarrays = sec_array
                                            if (secmainarray !== null) finishedarrays = secmainarray.concat(sec_array)
                                            const text = `UPDATE public.monitorusers  SET "reactionhistory" = $1 WHERE "userid"= '${userid}'`
                                            const values = [`${JSON.stringify(finishedarrays)}`]
                                            await dbclient.query(text, values, (err, res) => {
                                                if (err) {
                                                    console.log(err)
                                                } else {
                                                }
                                            })

                                        }
                                    })
                                } else {
                                    let editedarray = []
                                    editedarray.push({ "messageID": `${messageid}`, "emojicount": `${calculated_count}`, "emojitypes": `${amount}` })
                                    const text = `UPDATE public.monitorusers SET "reactions" = $1, "userid"= '${userid}'`
                                    const values = [`${JSON.stringify(editedarray)}`]
                                    await dbclient.query(text, values, (err, res) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                        }
                                    })
                                }
                            }
                        }
                    })
                }
            })
        })
    }
}

setInterval(() => {
    Intervals.find({ enddate: { $lte: new Date() } }, async (err, res) => {
        if (err) return console.log(err)
        if (!res) {
        } else {
            res.forEach((doc) => {
                update(doc.userID, doc.messageID, doc.channelID)
                let position = doc.position + 1
                var d = new Date();
                var v = new Date();
                let minutes = parseInt(config.intervals[position])
                if (minutes) {
                    v.setMinutes(d.getMinutes() + minutes);
                    doc.enddate = v
                    doc.position = position
                    doc.save()

                } else {
                    position = doc.position
                    let finalminutes = parseInt(config.intervals[position])
                    v.setMinutes(d.getMinutes() + finalminutes);
                    doc.enddate = v
                    doc.position = position
                    doc.save()
                }
            })


        }
    })
}, 15000)


client.on('error', console.error)
client.on('ready', () => {
    console.log("Logged in as " + client.user.username)
})
client.login(details.token)