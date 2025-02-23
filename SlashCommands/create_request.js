const { SelectMenuOptionBuilder } = require("@discordjs/builders")
const { TextInputStyle, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ModalBuilder, PermissionsBitField, PermissionFlagsBits, TextInputBuilder } = require("discord.js")
const client = require("..")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("create_request")
    .setDescription("Create a request, which u can edit later on!"),

    async execute(interaction) {

        const modal = new ModalBuilder()
            .setTitle("Create Request")
            .setCustomId("request")

        const gems_and_users = new TextInputBuilder()
            .setRequired(true)
            .setCustomId("gems_and_users_id")
            .setLabel("Gem Amount/  All Stumble Guys In-game Names")
            .setStyle(TextInputStyle.Paragraph)

        const name_change = new TextInputBuilder()
            .setRequired(true)
            .setCustomId("name_change_id")
            .setLabel("Name Change: True or False")
            .setStyle(TextInputStyle.Short)

        const reason_of_transfer = new TextInputBuilder()
            .setRequired(true)
            .setCustomId("reqoft")
            .setLabel("Reason for transfer?/Dont write a paragraph")
            .setStyle(TextInputStyle.Short)

        const gemsuser_row = new ActionRowBuilder().addComponents(gems_and_users)
        const namechange_row = new ActionRowBuilder().addComponents(name_change)
        const rot = new ActionRowBuilder().addComponents(reason_of_transfer)

        modal.addComponents(gemsuser_row, namechange_row, rot)

        await interaction.showModal(modal)
        
    }
}