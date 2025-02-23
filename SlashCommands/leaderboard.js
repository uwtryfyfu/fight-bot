const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Player = require('../models/fightsystem');

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

        const leaderboardEmbed = new EmbedBuilder()
            .setColor('#edc045')
            .setTitle(`<:RankedLeaderboard:1340691775894851604> Leaderboard - Top 10 Players (${leaderboardType === 'wubbies' ? 'Wubbies' : 'Wins'})`)
            .setFooter({ text: 'Compete with /fight to get on the leaderboard!' });

        const guild = interaction.guild;
        const memberCache = await guild.members.fetch(); 

        for (const [index, player] of topPlayers.entries()) {
            let playerText = '';

            if (leaderboardType === 'wubbies') {
                playerText = `<:Gems:1292553623431282764> **${player.wubbies}** Wubbies`;
            } else {
                playerText = `<:RankedLeaderboard:1340691775894851604> **${player.wins}** Wins`;
            }

            if (index === 0) {
                playerText = `<:Gold:1340731486281797692> ${playerText}`;
            } else if (index === 1) {
                playerText = `<:Silver:1340731527067074682> ${playerText}`; 
            } else if (index === 2) {
                playerText = `<:Bronze:1340731592251019355> ${playerText}`;
            }

            const member = memberCache.get(player.userId);
            const displayName = member ? member.displayName : `Unknown (${player.userId})`; 

            leaderboardEmbed.addFields({
                name: `**${index + 1}.** ${displayName}`,
                value: playerText,
                inline: false,
            });
        }

        return interaction.reply({ embeds: [leaderboardEmbed] });
    },
};
