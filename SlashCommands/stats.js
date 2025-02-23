const { SlashCommandBuilder } = require("@discordjs/builders");
const { getPlayer } = require("../utils/playerUtils");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Displays your current stats")
        .addUserOption(option => option.setName("player").setDescription("Choose a player").setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser("player") || interaction.user;
        const userId = user.id
        let player = await getPlayer(userId);

        if (!player) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor("Red")
                    .setDescription("❌ You don't have a profile yet! Fight first to unlock abilities.")],
                ephemeral: true
            });
        }

        const totalGames = player.wins + (player.losses || 0);
        const winrate = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(2) + "%" : "N/A";

        const abilities = {
            punch: "<:Punch:1338939251286605975> Punch",
            shield: "<:shield:1338939270601379850> Shield",
            volleyball: "<:Volleyball:1338939334568575128> Volleyball",
            tetris: "<:tetris:1342537800670515353> Tetris"
        };

        const unlockedAbilities = player.unlockedAbilities.length > 0
            ? player.unlockedAbilities.map(a => abilities[a] || a).join(", ")
            : "None";

         // Hole das GuildMember-Objekt des Benutzers
         const member = await interaction.guild.members.fetch(userId);
        
         // Hole die höchste Rolle des Benutzers
         const highestRole = member.roles.cache
             .filter(role => role.id !== interaction.guild.id)  // Filtert die @everyone Rolle heraus
             .sort((a, b) => b.position - a.position)  // Sortiert nach Position der Rollen
             .first();
 
         // Setze die Farbe der höchsten Rolle oder eine Standardfarbe, wenn keine Rolle vorhanden ist
         const roleColor = highestRole ? highestRole.color : "#0099ff";  // Standardfarbe blau, wenn keine Rolle gefunden

        const statsEmbed = new EmbedBuilder()
            .setColor(roleColor)
            .setTitle(`<:RankedLeaderboard:1340691775894851604> ${user.username}'s Stats`)
            .setThumbnail(user.displayAvatarURL()) // Profilbild des Nutzers
            .setImage("https://media.discordapp.net/attachments/1290002828688887888/1340691075890937930/Uberschrift_hinzufugen.png?ex=67b3475d&is=67b1f5dd&hm=f62a80d4863a9cd780de76924ebd54cb64fa36072ab1e0e07b3bc54aacc83759&=&format=webp&quality=lossless") // Hier dein eigenes Bild hinzufügen!
            .addFields(
                { name: "<:PepeGem:1339314226862493776> Player", value: `<@${userId}>`, inline: true },
                { name: "<:W_yellow:1322931650149089412> Wins / 💀 Losses", value: `${player.wins} / ${player.losses || 0} (**${winrate}**)`, inline: true },
                { name: "<:Punch:1338939251286605975> Strength / <:shield:1338939270601379850> HP / <:Volleyball:1338939334568575128> Stamina", value: `**${player.strength}** / **${player.hp}** / **${player.stamina}**`, inline: false },
                { name: "<:Gems:1292553623431282764> Resources", value: `**Wubbies:** ${player.wubbies} | **Stat Points:** ${player.statPoints}`, inline: false },
                { name: "<:create:1338856262762238033> Ability Slots", value: `${player.abilitySlots}`, inline: true },
                { name: "🔓 Unlocked Abilities", value: unlockedAbilities, inline: false }
            )
            .setFooter({ text: "Use /upgrade to improve your stats!" });

        return interaction.reply({ embeds: [statsEmbed] });
    },
};
