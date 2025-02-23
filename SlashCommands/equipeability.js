const { SlashCommandBuilder } = require("@discordjs/builders");
const { getPlayer } = require("../utils/playerUtils");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");

const abilityData = {
    punch: { strength: 3, emoji: "<:Punch:1338939251286605975>" },
    shield: { hp: 5, emoji: "<:shield:1338939270601379850>" },
    volleyball: { stamina: 2, emoji: "<:Volleyball:1338939334568575128>" },
    tetris: { strength: 8, emoji: "<:tetris:1342537800670515353>"}
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("equip")
        .setDescription("Equip your abilities with a button click!"),
    async execute(interaction) {
        const userId = interaction.user.id;
        let player = await getPlayer(userId);

        if (!player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("❌ You don't have a profile yet! Fight first to unlock abilities.")
                ],
                ephemeral: true
            });
        }

        if (!Array.isArray(player.equippedAbilities)) {
            player.equippedAbilities = [];
        }
        
        player.unlockedAbilities = player.unlockedAbilities || [];
        player.abilitySlots = player.abilitySlots || 1;

        if (player.unlockedAbilities.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Yellow")
                        .setDescription("⚠️ You haven't unlocked any abilities yet! Buy them first with `/buy`.")
                ],
                ephemeral: true
            });
        }

        console.log(`User: ${userId}, Equipped Abilities:`, player.equippedAbilities, "Slots:", player.abilitySlots);

        const equipEmbed = new EmbedBuilder()
            .setColor("#005fff")
            .setTitle("<:equip:1340684716348801155> Equip Abilities <:equip:1340684716348801155>")
            .setDescription("Click on the buttons below to equip an ability!")
            .addFields(
                player.unlockedAbilities.map(ability => ({
                    name: `${abilityData[ability]?.emoji} ${ability.charAt(0).toUpperCase() + ability.slice(1)}`,
                    value: `${Object.entries(abilityData[ability] || {}).filter(([key]) => key !== 'emoji').map(([key, value]) => `${key.toUpperCase()}: ${value}`).join(", ")}`,
                    inline: false
                }))
            )
            .setFooter({ text: "You have 3 minutes to equip abilities!" });

        const rows = [];
        let currentRow = new ActionRowBuilder();

        player.unlockedAbilities.forEach((ability, index) => {
            if (index % 5 === 0 && index !== 0) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
            currentRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`equip_${ability}_${userId}`)
                    .setEmoji(abilityData[ability]?.emoji || "❓")
                    .setStyle(ButtonStyle.Primary)
            );
        });

        if (currentRow.components.length > 0) {
            rows.push(currentRow);
        }

        if (player.equippedAbilities.length > 0 && player.equippedAbilities.length >= player.abilitySlots) {
            console.log(`User ${userId} can replace abilities. Showing replace menu.`);
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`replace_ability_${userId}`)
                .setPlaceholder("Select an ability to replace")
                .addOptions(player.equippedAbilities.map(ability => ({
                    label: ability.charAt(0).toUpperCase() + ability.slice(1),
                    value: ability
                })));
            rows.push(new ActionRowBuilder().addComponents(selectMenu));
        } else {
            console.log(`User ${userId} does not have enough equipped abilities for replacement.`);
        }

        const message = await interaction.reply({ embeds: [equipEmbed], components: rows });
        const filter = i => i.user.id === userId && i.customId.includes(`_${userId}`);
        const collector = message.createMessageComponentCollector({ filter, time: 180000 });

        collector.on("collect", async i => {
            if (i.user.id !== userId) {
                return i.reply({ 
                    embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ You can't use this button!")], 
                    ephemeral: true 
                });
            }

            if (i.customId.startsWith("replace_ability")) {
                const selectedAbility = i.values[0];
                player.equippedAbilities = player.equippedAbilities.filter(a => a !== selectedAbility);
                return i.reply({
                    embeds: [new EmbedBuilder().setColor("Blue").setDescription(`🔄 You can now equip a new ability in place of **${selectedAbility}**! Click a button to select.`)],
                    ephemeral: true
                });
            }

            const ability = i.customId.split("_")[1];

            if (player.equippedAbilities.includes(ability)) {
                return i.reply({ 
                    embeds: [new EmbedBuilder().setColor("Yellow").setDescription(`⚠️ You have already equipped ${ability}!`)], 
                    ephemeral: true 
                });
            }

            if (player.equippedAbilities.length >= player.abilitySlots) {
                return i.reply({ 
                    embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ You must replace an existing ability before equipping a new one!`)], 
                    ephemeral: true 
                });
            }

            player.equippedAbilities.push(ability);
            await player.save();

            await i.reply({ 
                embeds: [new EmbedBuilder().setColor("Green").setDescription(`✅ You have successfully equipped ${ability}!`)], 
                ephemeral: true 
            });
        });

        collector.on("end", async () => {
            const disabledRows = rows.map(row => 
                new ActionRowBuilder().addComponents(
                    row.components.map(component => component.setDisabled(true))
                )
            );
            await interaction.editReply({ components: disabledRows });
        });
    }
};
