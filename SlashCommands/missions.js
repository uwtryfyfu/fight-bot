const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const Player = require("../models/fightsystem");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("missions")
        .setDescription("Check your weekly missions!"),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        let player = await Player.findOne({ userId });

        if (!player || player.weeklyMissions.length === 0) {
            return interaction.reply("No missions assigned. Please wait for the next reset.");
        }

        const embed = new EmbedBuilder()
            .setColor("#005fff")
            .setTitle("<:Missions:1341114849060454462> Your Weekly Missions")
            .setDescription("Complete missions to earn rewards!");

        player.weeklyMissions.forEach(m => {
            const progressBar = getProgressBar(m.progress, m.goal);
            embed.addFields({ name: `${m.name}`, value: `${progressBar} (${m.progress}/${m.goal})`, inline: false });
        });

        interaction.reply({ embeds: [embed] });
    }
};

function getProgressBar(progress, goal) {
    const totalBars = 10;
    const filledBars = Math.round((progress / goal) * totalBars);
    return "🟩".repeat(filledBars) + "⬜".repeat(totalBars - filledBars);
}