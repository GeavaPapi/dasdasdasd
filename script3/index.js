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
const { QuickDB } = require("quick.db");
const db = new QuickDB();

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
    let checkuser = require('./config.json')
    if (message.author.id === details.owner_id) {
        const command = message.content.split(/ +/g)[0]
        const msg = message.content.slice(command.length).trim().replace(/\s+/g, ' ')
        const args = msg.split(" ")
        if (message.content.startsWith("!adduser") && message.author.id === config.owner_id) {
            let user = args[0]
            let followedchannels = args[1]
            if (!user || !followedchannels) return message.channel.send({ content: "❌ | Please specify the user ID & the  channels (all/ids)." })
            if (checkuser.users.includes(user)) return message.channel.send({ content: "❌ | There's already a monitor for that user." })
            config.users.push(user)
            fs.writeFile('./config.json', JSON.stringify(config, null, 4), "utf-8", ((err) => { if (err) { console.error(err) } }))
            let userid = await args[0]
            let messages = [];
            let enddate = new Date("January 1, 2022 00:00:01")
            pushtodb()

            async function pushtodb() {
                const text = `INSERT INTO public.monitorusers("userid") VALUES ($1)`
                const values = [`${userid}`]
                await dbclient.query(text, values, async (err, res) => {
                    if (err) {
                        console.log(err)
                    } else {

                        if (followedchannels.toLowerCase() === "all") await db.set(`monitor_${userid}`, 'all')
                        if (followedchannels.toLowerCase() !== "all") {
                            let intervals = message.content.slice(10 + args[0].length)
                            let intervals_array = intervals.split(',')
                            console.log(intervals_array)
                            await db.push(`monitor_${userid}`, `${intervals_array}`)
                        }
                        message.channel.send({ content: `User added to database` })

                    }
                })
            }

            async function updatedb(array, reactarr) {
                const text = `UPDATE public.monitorusers SET "messages" = $1, "reactions" = $2 WHERE "userid"= '${user}'`
                const values = [`${JSON.stringify(array)}`, `${JSON.stringify(reactarr)}`]
                await dbclient.query(text, values, (err, res) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(`Messages for ${userid} uploaded to DB`)
                        message.channel.send({ content: `Messages for ${userid} uploaded to DB` })

                    }
                })
            }



            let channel = client.channels.cache.get(`908180707157876801`)
            let mesgs = await channel.messages
                .fetch({ limit: 1, })
                .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

            while (mesgs) {
                await channel.messages
                    .fetch({ limit: 100, before: mesgs.id })
                    .then(messagePage => {
                        messagePage.forEach(msg => { if (msg.createdAt > enddate.getTime() && msg.author.id === userid) messages.push(msg) });

                        // Update our message pointer to be last message in page of messages
                        mesgs = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
                    })

            }
            let array = []
            let reactions_aray = []
            messages.forEach(async function (msg, index) {
                let calculated_count = 0
                let amount = 0;
                let finallenght = messages.length - 1
                if (array.length === finallenght) {
                    updatedb(array, reactions_aray)
                }
                msg.reactions.cache.forEach(async (reaction) => {
                    calculated_count += reaction.count
                    amount++
                })
                array.push({ "messageID": `${msg.id}`, "messageLink": `${msg.url}`, "messageTime": `${msg.createdTimestamp}`, "messageChannelID": `${msg.channel.id}`, "messageGuildID": `${msg.guild.id}`, "messageChannelName": `${msg.channel.name}`, "messageGuildName": `${msg.guild.name}`, "messageContent": `${msg.content}` })
                reactions_aray.push({ "messageID": `${msg.id}`, "emojitypes": `${amount}`, "emojicount": `${calculated_count}` })
            })

        } else if (message.content.startsWith(config.prefix + "removeuser")) {
            const user = args[0]
            if (user && user != "") {
                const a = config.users.indexOf(user)
                if (a != -1) {
                    config.users.splice(a, 1)
                    fs.writeFile('./config.json', JSON.stringify(config, null, 4), "utf-8", ((err) => { if (err) { console.error(err) } }))
                    message.channel.send({ content: "✅ | User Deleted." })
                    const text = `DELETE from public.monitorusers WHERE "userid" = '${args[0]}'`
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
                    message.channel.send({ content: "❌ | Couldn't find a user with that ID in the list." })
                    message.delete().catch((err) => { })
                }
            }
            else {
                message.channel.send({ content: "❌ | Please specify the user ID to delete." })
                message.delete().catch((err) => { })
            }
        } else if (message.content.startsWith(config.prefix + "users")) {
            if (config.users.length > 0) {
                config.users.map(async (u) => {
                    let channelsvalue = await db.get(`monitor_${u}`)
                    if (channelsvalue === null) channelsvalue = 'none'
                    message.channel.send({ content: `User: ${u} | Channels: ${channelsvalue}` })
                })
                message.delete().catch((err) => { })

            }
            else {
                message.channel.send({ content: "❌ | There are no users currently monitored." })
                message.delete().catch((err) => { })
            }
        }
        else if (message.content.startsWith("!showintervals") && message.author.id === config.owner_id) {
            const args = message.content.slice(1).split(/ +/);
            const command = args.shift().toLowerCase();
            let allchannels = await db.get(`intervals`)
            let description = ``
            for (let i in allchannels) {
                description += `${allchannels[i]}\n`
            }
            message.channel.send({ content: `These are the intervals that are setted now\n${description}` })

        }
        else if (message.content.startsWith("!setintervals") && message.author.id === config.owner_id) {
            const args = message.content.slice(1).split(/ +/);
            const command = args.shift().toLowerCase();
            let intervals = message.content.slice(14)
            let intervals_array = intervals.split(',')
            await db.set(`intervals`, intervals_array)
            message.channel.send({ content: `Intervals updated` })
            console.log('Intervals Setted')

        }
        else if (message.content.startsWith("!addchannels") && message.author.id === config.owner_id) {
            const args = message.content.slice(1).split(/ +/);
            let userid = args[1]
            if (!userid) return message.channel.send({ content: 'You have to mention the user ID' })
            let tocheck = await db.get(`monitor_${userid}`)
            if (tocheck === "all") return message.channel.send('You have to switch from all to particular')
            console.log(userid)
            let calc = args[0].length + args[1].length + 3
            let intervals = message.content.slice(calc)
            let intervals_array = intervals.split(',')
            await db.push(`monitor_${userid}`, `${intervals_array}`)
            message.channel.send('Channel added')

        }
        else if (message.content.startsWith("!switchtoall") && message.author.id === config.owner_id) {
            const args = message.content.slice(1).split(/ +/);
            let userid = args[1]
            if (!userid) return message.channel.send({ content: 'You have to mention the user ID & the ID of the particular channels ' })
            console.log(userid)
            let tocheck = await db.get(`monitor_${userid}`)
            if (tocheck === "all") return message.channel.send('You already switched on this user')
            let calc = args[0].length + args[1].length + 3
            await db.set(`monitor_${userid}`, `all`)
            message.channel.send('You switched from particular channels to all')

        }
        else if (message.content.startsWith("!removechannel") && message.author.id === config.owner_id) {
            const args = message.content.slice(1).split(/ +/);
            const command = args.shift().toLowerCase();
            if (!args[0] || !args[1]) return message.channel.send({ content: 'You have to mention the user ID & the ID of the particular channels ' })
            let userid = args[0]
            let allchannels = await db.get(`monitor_${userid}`)
            console.log(allchannels)
            if (allchannels === null) allchannels = [' ']
            let filtred = allchannels.filter(element => element !== `${args[1]}`);
            await db.set(`monitor_${userid}`, filtred)
            message.channel.send({ content: `Channel removed` })
        }
    }
    else {
        if (config.users.includes(message.author.id)) {
            let channels = await db.get(`monitor_${message.author.id}`)
            if (channels === null) return
            if (channels !== "all" && !channels.includes(message.channel.id)) return
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
                                    const text = `UPDATE public.monitorusers SET "reactions" = $1 WHERE "userid"= '${userid}'`
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
                                    const text = `UPDATE public.monitorusers SET "reactions" = $1, WHERE "userid"= '${userid}'`
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

setInterval(async () => {
    let intervalss = await db.get(`intervals`)
    if (intervalss === null) return
    console.log(intervalss)
    let datenow = new Date(Date.now())
    console.log(datenow)
    Intervals.find({ enddate: { $lt: datenow } }, async (err, res) => {
        if (err) return console.log(err)
        if (!res) {
        } else {
            console.log(res)
            res.forEach(async (doc) => {
                update(doc.userID, doc.messageID, doc.channelID)
                let position = doc.position + 1
                var d = new Date();
                var v = new Date(Date.now());
                let minutes = parseInt(intervalss[position])
                if (minutes) {
                    v.setMinutes(d.getMinutes() + minutes);
                    console.log(v)
                    doc.enddate = v
                    doc.position = position
                    doc.save()

                }
                if (isNaN(minutes)) {
                    position = doc.position
                    let finalminutes = parseInt(intervalss[position])
                    console.log(v)
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