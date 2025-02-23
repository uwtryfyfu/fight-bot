const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Player = require('../models/fightsystem'); // Directly use Player model for querying

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the top players by either Wubbies or Wins/Losses')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Choose the leaderboard type')
                .setRequired(true)
                .addChoices(
                    { name: 'Wubbies', value: 'wubbies' },
                    { name: 'Wins', value: 'wins' }
                )
        ),
    async execute(interaction) {
        const leaderboardType = interaction.options.getString('type');
        let topPlayers;

        if (leaderboardType === 'wubbies') {
            topPlayers = await Player.find().sort({ wubbies: -1 }).limit(10);
        } else {
            topPlayers = await Player.find().sort({ wins: -1, losses: 1 }).limit(10);
        }

        if (topPlayers.length === 0) {
            return interaction.reply('No players have any entries yet!');
        }

        // Create the embed with a title and description
        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#edc045')
            .setTitle(`<:RankedLeaderboard:1340691775894851604> Leaderboard - Top 10 Players (${leaderboardType === 'wubbies' ? 'Wubbies' : 'Wins'})`)
            .setFooter({ text: 'Compete with /fight to get on the leaderboard!' });

        // Fetch all users in one batch for efficiency
        const guild = interaction.guild;
        const memberCache = await guild.members.fetch(); // Fetch all members of the server

        // Add each player as a field in the embed
        for (const [index, player] of topPlayers.entries()) {
            let playerText = '';

            // Add the player's stats based on the leaderboard type
            if (leaderboardType === 'wubbies') {
                playerText = `<:Gems:1292553623431282764> **${player.wubbies}** Wubbies`;
            } else {
                playerText = `<:RankedLeaderboard:1340691775894851604> **${player.wins}** Wins`;
            }

            // Add emojis for the top 3 players
            if (index === 0) {
                playerText = `<:Gold:1340731486281797692> ${playerText}`; // Gold for 1st place
            } else if (index === 1) {
                playerText = `<:Silver:1340731527067074682> ${playerText}`; // Silver for 2nd place
            } else if (index === 2) {
                playerText = `<:Bronze:1340731592251019355> ${playerText}`; // Bronze for 3rd place
            }

            // Fetch user from guild cache
            const member = memberCache.get(player.userId);
            const displayName = member ? member.displayName : `Unknown (${player.userId})`; // Fallback, falls nicht gefunden

            // Add the player's rank, display name, and information as a field in the embed
            leaderboardEmbed.addFields({
                name: `**${index + 1}.** ${displayName}`,
                value: playerText,
                inline: false,
            });
        }

        // Send the embed to the interaction reply
        return interaction.reply({ embeds: [leaderboardEmbed] });
    },
};
