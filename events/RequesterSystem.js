const client = require("../index")
const mongoose = require("mongoose")
const { ActivityType, InteractionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const config = require("../config.json")
const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;

//mongo db
const rinfo = require("../models/requester_id");
const internal = require("stream");


client.on("interactionCreate", async interaction => {
    if(interaction.type === InteractionType.ModalSubmit) {
        if(interaction.customId === "request") {
            const gems_and_users = interaction.fields.getTextInputValue('gems_and_users_id')
            const name_change_id = interaction.fields.getTextInputValue('name_change_id')
            const reason_for_transfer = interaction.fields.getTextInputValue('reqoft')

            const pending_embed = new EmbedBuilder()
            .setTitle("The process of Apfel wasting gems 🍎")
            .setColor("Orange")

            let btns1 = new ButtonBuilder()
                    .setLabel("Accept")
                    .setCustomId("pos")
                    .setStyle(ButtonStyle.Success)

            let btns2 = new ButtonBuilder()
                .setLabel("Reject")
                .setCustomId("rej")
                .setStyle(ButtonStyle.Danger)

            let btns = new ActionRowBuilder().addComponents(btns1, btns2)
            

            if(name_change_id == "True") {
                pending_embed.addFields(
                    {
                        name: "Transfer List:", value: "```" + gems_and_users + "```", inline: false
                    },
                    {
                        name: "Name Change:", value: "True <:yes:1290003979840913529>", inline: false
                    },
                    {
                        name: "Reason of transfer", value: "```" + reason_for_transfer + "```", inline: false
                    },
                    {
                        name: "Transfer made by", value: "<@" + interaction.user.id + ">", inline: false
                    }
                )
                pending_embed.setFooter({text: 'Status: Pending', iconURL: 'https://cdn.discordapp.com/attachments/1290002828688887888/1337511797414039623/1290008725939290153.gif?ex=67a7b66e&is=67a664ee&hm=72c36e84c508f198706e63c98c22efbd5909e71a4cbe3e62d582fa56c033e260&'})
            }else if (name_change_id == "False") {
                pending_embed.addFields(
                    {
                        name: "Transfer List:", value: "```" + gems_and_users + "```", inline: false
                    },
                    {
                        name: "Name Change:", value: "False <:no:1290004234829430925>", inline: false
                    },
                    {
                        name: "Reason of transfer", value: "```" + reason_for_transfer + "```", inline: false
                    },
                    {
                        name: "Transfer made by", value: "<@" + interaction.user.id + ">", inline: false
                    }
                )
                pending_embed.setFooter({text: 'Status: Pending', iconURL: 'https://cdn.discordapp.com/attachments/1290002828688887888/1337511797414039623/1290008725939290153.gif?ex=67a7b66e&is=67a664ee&hm=72c36e84c508f198706e63c98c22efbd5909e71a4cbe3e62d582fa56c033e260&'})
            }else return interaction.reply(
                {
                    content: "Invalid Form Body",
                    ephemeral: true
                }
            )

            const message_id = await interaction.channel.send({ embeds: [pending_embed], components: [btns]})
            
            
            interaction.reply({
                ephemeral: true,
                content: "Transfer requested!"
            })
        

            rinfo.findOne({ msg_id : message_id.id }, async(err, data) => {
                if(err) return err;
                if(data) return;
                if(!data) {
                    data = new rinfo(
                        {
                            msg_id : message_id.id,
                            guildid : interaction.guild.id,
                            channelid : interaction.channel.id,
                            true_or_false : name_change_id,
                            name_and_gems : gems_and_users,
                            reason_for_transferstring : reason_for_transfer, 
                            transfer_user : interaction.user.id
                        }
                    )

                    data.save().then(console.log("save"))
                }

            })
        }
    }
})

client.on("interactionCreate", async interaction => {
    if(interaction.isButton) {
        if(interaction.customId === "pos") {
            if(interaction.guild.members.cache.get(interaction.user.id).roles.cache.has("1337498787396063314")) {
                 const message = interaction.message

                 rinfo.findOne({ msg_id : message.id }, async(err, data) => {
                    if(err) return err;
                    if(data) {
                        let info = await rinfo.findOne({ msg_id : message.id })
                        let gau = info.name_and_gems
                        let tof = info.true_or_false
                        let rot = info.reason_for_transferstring
                        let user = info.transfer_user

                        if(tof === "True") {
                            let embed = new EmbedBuilder()
                            .setTitle("The process of Apfel wasting gems 🍎")
                            .setColor("Green")
                            .addFields(
                                {
                                    name: "Transfer List:", value: "```" + gau + "```", inline: false
                                },
                                {
                                    name: "Name Change:", value: "True <:yes:1290003979840913529>", inline: false
                                },
                                {
                                    name: "Reason of transfer", value: "```" + rot + "```", inline: false
                                },
                                {
                                    name: "Transfer made by", value: "<@" + user + ">", inline: false
                                },
                                {
                                    name: "Transfer was accepted by", value: "<@" + interaction.user.id + ">", inline: false
                                },
                                {
                                    name: "Delivered", value: timestamp, inline: false
                                }
                            )
                            .setFooter({text: 'Status: Accepted', iconURL: 'https://media.discordapp.net/attachments/1290002828688887888/1337512694257025124/1290003979840913529.png?ex=67a7b744&is=67a665c4&hm=ca2fa8cafcf45a89e446728cdc1cf48cc6c60e49062e7ab5ebfd518741535d41&=&format=webp&quality=lossless'})

                            let btns1 = new ButtonBuilder()
                            .setLabel("Accept")
                            .setCustomId("yx")
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true)

                            let btns2 = new ButtonBuilder()
                            .setLabel("Reject")
                            .setCustomId("xy")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
        
                            let btns = new ActionRowBuilder().addComponents(btns1, btns2)

                            message.edit(
                                {
                                    components: [btns],
                                    embeds: [embed]
                                }
                            )

                            interaction.reply(
                                {
                                    ephemeral: true,
                                    content: "Transfer updated!"
                                }
                            )
                        }else if(tof === "False") {
                            let embed = new EmbedBuilder()
                            .setTitle("The process of Apfel wasting gems 🍎")
                            .setColor("Green")
                            .addFields(
                                {
                                    name: "Transfer List:", value: "```" + gau + "```", inline: false
                                },
                                {
                                    name: "Name Change:", value: "False <:no:1290004234829430925>", inline: false
                                },
                                {
                                    name: "Reason of transfer", value: "```" + rot + "```", inline: false
                                },
                                {
                                    name: "Transfer made by", value: "<@" + user + ">", inline: false
                                },
                                {
                                    name: "Transfer was accepted by", value: "<@" + interaction.user.id + ">", inline: false
                                },
                                {
                                    name: "Delivered", value: timestamp, inline: true
                                }
                            )
                            .setFooter({text: 'Status: Accepted', iconURL: 'https://media.discordapp.net/attachments/1290002828688887888/1337512694257025124/1290003979840913529.png?ex=67a7b744&is=67a665c4&hm=ca2fa8cafcf45a89e446728cdc1cf48cc6c60e49062e7ab5ebfd518741535d41&=&format=webp&quality=lossless'})


                            let btns1 = new ButtonBuilder()
                            .setLabel("Accept")
                            .setCustomId("yx")
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true)

                            let btns2 = new ButtonBuilder()
                            .setLabel("Reject")
                            .setCustomId("xy")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
        
                            let btns = new ActionRowBuilder().addComponents(btns1, btns2)

                            message.edit(
                                {
                                    components: [btns],
                                    embeds: [embed]
                                }
                            )

                            interaction.reply(
                                {
                                    ephemeral: true,
                                    content: "Transfer updated!"
                                }
                            )
                        }

                    }
                    if(!data) {
                       interaction.reply(
                        {
                            ephemeral: true,
                            content: "HUH? I cant find the message in my database <:SAD:1281517835100885096>"
                        }
                       )
                    }
    
                })

            }else {
                let btns1 = new ButtonBuilder()
                .setLabel("Yes")
                .setCustomId("yes")
                .setStyle(ButtonStyle.Success)

                let btns2 = new ButtonBuilder()
                .setLabel("No")
                .setCustomId("no")
                .setStyle(ButtonStyle.Danger)

                let btns = new ActionRowBuilder().addComponents(btns1, btns2)

                interaction.reply(
                    {
                        ephemeral: true,
                        content: "Are u trying to cheat? <:wha:1297932216441110538>",
                        components: [btns]
                    }
                )
            }
        } else if (interaction.customId === "rej") {
            if(interaction.guild.members.cache.get(interaction.user.id).roles.cache.has("1337498787396063314")) {
                        const message = interaction.message

                        const modal = new ModalBuilder()
                            .setTitle("Reason for rejection")
                            .setCustomId("reason")
                
                        const reason_of_Rej = new TextInputBuilder()
                            .setRequired(true)
                            .setCustomId("reason_rej")
                            .setLabel("Reason, dont write a paragraph")
                            .setStyle(TextInputStyle.Short)
                
                        const reasonrej = new ActionRowBuilder().addComponents(reason_of_Rej)
                
                        modal.addComponents(reasonrej)

                        interaction.showModal(modal)
                        

            }else {
                let btns1 = new ButtonBuilder()
                .setLabel("Yes")
                .setCustomId("yes")
                .setStyle(ButtonStyle.Success)

                let btns2 = new ButtonBuilder()
                .setLabel("No")
                .setCustomId("no")
                .setStyle(ButtonStyle.Danger)

                let btns = new ActionRowBuilder().addComponents(btns1, btns2)

                interaction.reply(
                    {
                        ephemeral: true,
                        content: "Are u trying to cheat? <:wha:1297932216441110538>",
                        components: [btns]
                    }
                )
            }
        }
    }
})

client.on("interactionCreate", async interaction => {
    if(interaction.customId === "reason") {
        const message = interaction.message
        
        const rej = interaction.fields.getTextInputValue('reason_rej')

        rinfo.findOne({ msg_id : message.id }, async(err, data) => {
            if(err) return err;
            if(data) {
                let info = await rinfo.findOne({ msg_id : message.id })
                let gau = info.name_and_gems
                let tof = info.true_or_false
                let rot = info.reason_for_transferstring
                let user = info.transfer_user

                if(tof === "True") {
                    let embed = new EmbedBuilder()
                    .setTitle("The process of Apfel wasting gems 🍎")
                    .setColor("Red")
                    .addFields(
                        {
                            name: "Transfer List:", value: "```" + gau + "```", inline: false
                        },
                        {
                            name: "Name Change:", value: "True <:yes:1290003979840913529>", inline: false
                        },
                        {
                            name: "Reason of transfer", value: "```" + rot + "```", inline: false
                        },
                        {
                            name: "Transfer made by", value: "<@" + user + ">", inline: false
                        },
                        {
                            name: "Reason for rejection", value: "```" + rej + "```", inline: false
                        },
                        {
                            name: "Transfer was declined by", value: "<@" + interaction.user.id + ">", inline: false
                        },
                        {
                            name: "Denied", value: timestamp, inline: true
                        }
                    )
                    .setFooter({text: 'Status: Declined', iconURL: 'https://media.discordapp.net/attachments/1290002828688887888/1337512601294340208/1290004234829430925.png?ex=67a7b72d&is=67a665ad&hm=f88ad6b7f8050ffa5b6b0b44211c249b38a9e5020ae5d0c460ac540180d71a02&=&format=webp&quality=lossless'})


                    let btns1 = new ButtonBuilder()
                    .setLabel("Accept")
                    .setCustomId("yx")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)

                    let btns2 = new ButtonBuilder()
                    .setLabel("Reject")
                    .setCustomId("xy")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)

                    let btns = new ActionRowBuilder().addComponents(btns1, btns2)

                    message.edit(
                        {
                            components: [btns],
                            embeds: [embed]
                        }
                    )

                    interaction.reply(
                        {
                            ephemeral: true,
                            content: "Transfer updated!"
                        }
                    )
                }else if(tof === "False") {
                    let embed = new EmbedBuilder()
                    .setTitle("The process of Apfel wasting gems 🍎")
                    .setColor("Red")
                    .addFields(
                        {
                            name: "Transfer List:", value: "```" + gau + "```", inline: false
                        },
                        {
                            name: "Name Change:", value: "False <:no:1290004234829430925>", inline: false
                        },
                        {
                            name: "Reason of transfer", value: "```" + rot + "```", inline: false
                        },
                        {
                            name: "Transfer made by", value: "<@" + user + ">", inline: false
                        },
                        {
                            name: "Reason for rejection", value: "```" + rej + "```", inline: false
                        },
                        {
                            name: "Transfer was declined by", value: "<@" + interaction.user.id + ">", inline: false
                        },
                        {
                            name: "Delivered", value: timestamp, inline: true
                        }
                    )
                    .setFooter({text: 'Status: Declined', iconURL: 'https://media.discordapp.net/attachments/1290002828688887888/1337512601294340208/1290004234829430925.png?ex=67a7b72d&is=67a665ad&hm=f88ad6b7f8050ffa5b6b0b44211c249b38a9e5020ae5d0c460ac540180d71a02&=&format=webp&quality=lossless'})


                    let btns1 = new ButtonBuilder()
                    .setLabel("Accept")
                    .setCustomId("yx")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)

                    let btns2 = new ButtonBuilder()
                    .setLabel("Reject")
                    .setCustomId("xy")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)

                    let btns = new ActionRowBuilder().addComponents(btns1, btns2)

                    message.edit(
                        {
                            components: [btns],
                            embeds: [embed]
                        }
                    )

                    interaction.reply(
                        {
                            ephemeral: true,
                            content: "Transfer updated!"
                        }
                    )
                }            
            }
            if(!data) {
                interaction.reply(
                    {
                        ephemeral: true,
                        content: "HUH? I cant find the message in my database <:SAD:1281517835100885096>"
                    }
                )
            }

        })
    }
})

client.on("interactionCreate", async interaction => {
    if(interaction.customId === "no") {
        interaction.reply(
            {
                content: "Good boy <a:pat:1337509425266819183>",
                ephemeral: true
            }
        )
    }else if(interaction.customId === "yes") {
        interaction.reply(
            {
                content: "Bad boy <:mad:1337513761447215207>",
                ephemeral: true
            }
        )

    }
})