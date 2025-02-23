const { SlashCommandBuilder } = require("@discordjs/builders");
const { getPlayer } = require("../utils/playerUtils");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const abilityCosts = {
    punch: 50,
    shield: 65,
    volleyball: 45,
    tetris: 100
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("buy")
        .setDescription("Which ability would you like to purchase?"),
    async execute(interaction) {
        const userId = interaction.user.id;
        let player = await getPlayer(userId);

        if (!player) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor("Red")
                    .setDescription("❌ You don't have a profile yet! Fight first to unlock abilities.")],
                ephemeral: true
            });
        }

        const shopEmbed = new EmbedBuilder()
            .setColor("#005fff")
            .setTitle("<:shop:1340684716348801155> Ability Shop <:shop:1340684716348801155>")
            .setDescription("Click on the buttons below to purchase an ability!")
            .addFields(
                { name: "<:Punch:1338939251286605975> Punch", value: "<:Gems:1292553623431282764> **50 Wubbies** | Increases Strength", inline: true },
                { name: "<:shield:1338939270601379850> Shield", value: "<:Gems:1292553623431282764> **65 Wubbies** | Increases HP", inline: true },
                { name: "<:Volleyball:1338939334568575128> Volleyball", value: "<:Gems:1292553623431282764> **45 Wubbies** | Increases Stamina", inline: true },
                { name: "<:tetris:1342537800670515353> Tetris", value: "<:Gems:1292553623431282764> **100 Wubbies** | Increases Strength", inline: true}
            )
            .setFooter({ text: "You have 3 minutes to make a purchase!" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`buy_punch_${userId}`)
                .setEmoji("<:Punch:1338939251286605975>")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`buy_shield_${userId}`)
                .setEmoji("<:shield:1338939270601379850>")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`buy_volleyball_${userId}`)
                .setEmoji("<:Volleyball:1338939334568575128>")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`buy_tetris_${userId}`)
                .setEmoji("<:tetris:1342537800670515353>")
                .setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.reply({ embeds: [shopEmbed], components: [row] });

        const filter = i => i.user.id === userId && i.customId.includes(`_${userId}`);
        const collector = message.createMessageComponentCollector({ filter, time: 180000 });

        collector.on("collect", async i => {
            if (i.user.id !== userId) {
                return i.reply({ 
                    embeds: [new EmbedBuilder().setColor("Red").setDescription("❌ You can't use this button!")], 
                    ephemeral: true 
                });
            }

            const ability = i.customId.split("_")[1];

            if (player.unlockedAbilities.includes(ability)) {
                return i.reply({ 
                    embeds: [new EmbedBuilder().setColor("Yellow").setDescription("⚠️ You have already purchased this ability!")], 
                    ephemeral: true 
                });
            }

            if (player.wubbies < abilityCosts[ability]) {
                return i.reply({ 
                    embeds: [new EmbedBuilder().setColor("Yellow").setDescription("⚠️ Not enough Wubbies!")], 
                    ephemeral: true 
                });
            }

            player.wubbies -= abilityCosts[ability];
            player.unlockedAbilities.push(ability);
            await player.save();

            await i.reply({ 
                embeds: [new EmbedBuilder().setColor("Green").setDescription(`✅ You have successfully purchased ${ability}!`)], 
                ephemeral: true 
            });
        });

        collector.on("end", async () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                row.components.map(button => button.setDisabled(true))
            );
            await interaction.editReply({ components: [disabledRow] });
        });
    }
};
