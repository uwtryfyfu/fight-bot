const { SlashCommandBuilder } = require("@discordjs/builders");
const { getPlayer } = require("../utils/playerUtils");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("upgrade")
        .setDescription("Upgrade your stats or ability slots with stat points"),
    async execute(interaction) {
        const userId = interaction.user.id;
        let player = await getPlayer(userId);

        if (!player) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor("Red")
                    .setDescription("❌ You don't have a profile yet! Fight first to earn stat points.")],
                ephemeral: true
            });
        }

        if (player.statPoints <= 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor("Yellow")
                    .setDescription("⚠️ You don't have any stat points to upgrade!")],
                ephemeral: true
            });
        }

        const maxStats = { hp: 100, stamina: 100, strength: 100, abilitySlots: 4 };

        const createEmbed = () => new EmbedBuilder()
            .setColor("#005fff")
            .setTitle("<:Upgrade:1340684716348801155> Upgrade Menu <:Upgrade:1340684716348801155>")
            .setDescription(`You have **${player.statPoints}** stat points. Click a button to upgrade!`)
            .addFields(
                { name: "❤️ HP", value: `Current: **${player.hp}** / ${maxStats.hp}`, inline: false },
                { name: "⚡ Stamina", value: `Current: **${player.stamina}** / ${maxStats.stamina}`, inline: false },
                { name: "💪 Strength", value: `Current: **${player.strength}** / ${maxStats.strength}`, inline: false },
                { name: "<:Abilities:1340755734706786367> Ability Slots", value: `Current: **${player.abilitySlots}** / ${maxStats.abilitySlots}`, inline: false }
            )
            .setFooter({ text: "You have 3 minutes to upgrade your stats!" });

        const createButtons = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`upgrade_hp_${userId}`).setLabel("HP").setStyle(ButtonStyle.Primary).setDisabled(player.hp >= maxStats.hp),
            new ButtonBuilder().setCustomId(`upgrade_stamina_${userId}`).setLabel("Stamina").setStyle(ButtonStyle.Primary).setDisabled(player.stamina >= maxStats.stamina),
            new ButtonBuilder().setCustomId(`upgrade_strength_${userId}`).setLabel("Strength").setStyle(ButtonStyle.Primary).setDisabled(player.strength >= maxStats.strength),
            new ButtonBuilder().setCustomId(`upgrade_abilitySlots_${userId}`).setLabel("Ability Slot").setStyle(ButtonStyle.Primary).setDisabled(player.abilitySlots >= maxStats.abilitySlots)
        );

        const message = await interaction.reply({ embeds: [createEmbed()], components: [createButtons()] });

        const filter = i => i.customId.includes(`_${userId}`);
        const collector = message.createMessageComponentCollector({ filter, time: 180000 });

        collector.on("collect", async i => {
            if (i.user.id !== userId) {
                return i.reply({ 
                    embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ You can't use this button!")], 
                    ephemeral: true 
                });
            }

            if (player.statPoints <= 0) {
                await interaction.editReply({ components: [createButtons()] }); // Disable buttons
                return i.reply({ embeds: [new EmbedBuilder().setColor("Yellow").setDescription("⚠️ You have no stat points left!")], ephemeral: true });
            }

            const type = i.customId.split("_")[1];

            if (player[type] >= maxStats[type]) {
                return i.reply({ embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Your **${type}** is already maxed out!`)], ephemeral: true });
            }

            const upgradeValues = { hp: 2, stamina: 1, strength: 1, abilitySlots: 1 };
            player[type] += upgradeValues[type];
            player.statPoints -= 1;
            await player.save();

            await interaction.editReply({ embeds: [createEmbed()], components: [createButtons()] });

            await i.reply({ embeds: [new EmbedBuilder().setColor("Green").setDescription(`✅ Successfully upgraded **${type}**! You have **${player.statPoints}** stat points left.`)], ephemeral: true });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [new ActionRowBuilder().addComponents(createButtons().components.map(button => button.setDisabled(true)))] });
        });
    }
};
