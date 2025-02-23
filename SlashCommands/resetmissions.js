const { SlashCommandBuilder } = require("@discordjs/builders");
const { PermissionFlagsBits } = require("discord.js");
const Player = require("../models/fightsystem");

const allMissions = [
    { id: 1, name: "Win 3 fights", goal: 3, rewardType: "Wubbies", rewardAmount: 10 },
    { id: 2, name: "Earn 100 Wubbies", goal: 100, rewardType: "StatPoints", rewardAmount: 2 },
    { id: 3, name: "Win 5 fights", goal: 5, rewardType: "Wubbies", rewardAmount: 15 },
    { id: 4, name: "Earn 50 Wubbies", goal: 50, rewardType: "StatPoints", rewardAmount: 1 },
    { id: 5, name: "Win 10 fights", goal: 10, rewardType: "Wubbies", rewardAmount: 20 },
];

async function resetWeeklyMissions() {
    console.log("[🕒] Resetting Weekly Missions...");

    const players = await Player.find({});
    for (const player of players) {
        const shuffled = allMissions.sort(() => 0.5 - Math.random()).slice(0, 5);

        player.weeklyMissions = shuffled.map(m => ({
            id: m.id,
            name: m.name,
            goal: m.goal,
            progress: 0,
            rewardType: m.rewardType,
            rewardAmount: m.rewardAmount,
            completed: false
        }));

        player.lastMissionReset = new Date();
        await player.save();
    }
    console.log("[🕒] Weekly missions have been reset!");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resetmissions")
        .setDescription("Reset all players' weekly missions.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        if (interaction.user.id !== "666702943168364570") {
            return interaction.reply({
                ephemeral: true,
                content: "stop cheating <:mad:1337513761447215207>"
            });
        }

        try {
            await interaction.deferReply(); // Verhindert Timeout

            await resetWeeklyMissions();
            await interaction.editReply("✅ Weekly missions have been reset!");
        } catch (err) {
            console.error(err);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply("❌ There was an error resetting the missions.");
            } else {
                await interaction.followUp("❌ There was an error resetting the missions.");
            }
        }
    },
};
