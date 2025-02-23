const { SlashCommandBuilder } = require("@discordjs/builders");
const { getPlayer } = require("../utils/playerUtils");
const { EmbedBuilder } = require("discord.js");
const Player = require("../models/fightsystem");

const abilities = {
    punch: { strength: 3, text: "throws a powerful punch <:Punch:1338939251286605975>!" },
    shield: { hp: 5, text: "raises their shield <:shield:1338939270601379850> for protection!" },
    volleyball: { stamina: 2, text: "spikes a volleyball <:Volleyball:1338939334568575128> at high speed!" },
    tetris: { strength: 8, text: "throws a Tetris piece <:tetris:1342537800670515353> into the stack!"}
};

const cooldowns = new Map();
const fightHistory = new Map();

async function updateMission(userId, missionId, amount) {
    let player = await Player.findOne({ userId });

    if (!player) {
        console.log("Player not found");
        return;
    }

    const mission = player.weeklyMissions.find(m => m.id === missionId);

    if (mission && !mission.completed) {
        console.log(`Mission found: ${missionId} - Progress: ${mission.progress} - Goal: ${mission.goal}`);

        mission.progress += amount;
        console.log(`New progress: ${mission.progress}`);

        if (mission.progress >= mission.goal) {
            mission.completed = true;
            console.log(`Mission completed: ${missionId}`);

            if (mission.rewardType === "StatPoints") {
                player.statPoints = Math.max(0, player.statPoints + mission.rewardAmount);
                console.log(`Awarded StatPoints: ${mission.rewardAmount}`);
            } else if (mission.rewardType === "Wubbies") {
                player.wubbies = Math.max(0, player.wubbies + mission.rewardAmount);
                console.log(`Awarded Wubbies: ${mission.rewardAmount}`);
            }
        }

        await player.save();
        console.log("Player data saved with updated mission progress");
    } else {
        console.log("Mission not found or already completed");
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("quickfight")
        .setDescription("Fight against another player quickly")
        .addUserOption(option => option.setName("opponent").setDescription("Choose your opponent").setRequired(true)),
    async execute(interaction) {
        const attackerId = interaction.user.id;
        const defender = interaction.options.getUser("opponent");

        if (!defender || defender.id === attackerId || defender.bot) {
            await interaction.reply({ content: "You must choose a valid opponent!", ephemeral: true });
            return;
        }

        if (cooldowns.has(attackerId)) {
            const now = Date.now();
            const expirationTime = cooldowns.get(attackerId) + 60 * 1000;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                await interaction.reply({ content: `Wait **${timeLeft.toFixed(0)}** more seconds before fighting again!`, ephemeral: true });
                return;
            }
        }

        if (fightHistory.get(attackerId) === defender.id) {
            await interaction.reply({ content: `You must fight someone else before attacking <@${defender.id}> again!`, ephemeral: true });
            return;
        }

        fightHistory.set(attackerId, defender.id);
        cooldowns.set(attackerId, Date.now());

        let attacker = await getPlayer(attackerId);
        let defenderData = await getPlayer(defender.id);

        function applyAbilities(player) {
            let newStats = { ...player._doc };
            let abilityTexts = [];
            player.equippedAbilities.forEach(ability => {
                if (abilities[ability]) {
                    for (let stat in abilities[ability]) {
                        if (stat !== "text") {
                            newStats[stat] += abilities[ability][stat];
                        }
                    }
                    abilityTexts.push(abilities[ability].text);
                }
            });
            return { stats: newStats, abilityTexts };
        }

        let { stats: attackerStats, abilityTexts: attackerAbilities } = applyAbilities(attacker);
        let { stats: defenderStats, abilityTexts: defenderAbilities } = applyAbilities(defenderData);

        await interaction.deferReply();

        await interaction.editReply(`<a:fight:1281654020397858846> **${interaction.user.username} challenges ${defender.username} to a fight!**`);
        await new Promise(resolve => setTimeout(resolve, 2000));

        await interaction.editReply(`<a:pandafire:1338869789375987723> **${interaction.user.username} and ${defender.username} enter the battlefield...**`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        await interaction.editReply(`🔥 **The crowd is cheering as the fight is about to begin!**`);
        await new Promise(resolve => setTimeout(resolve, 2500));

        if (attackerAbilities.length > 0) {
            await interaction.editReply(`<:Punch:1338939251286605975> **${interaction.user.username} prepares an attack... ${attackerAbilities.join(" ")}**`);
        } else {
            await interaction.editReply(`<:Punch:1338939251286605975> **${interaction.user.username} prepares to strike!**`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (defenderAbilities.length > 0) {
            await interaction.editReply(`<:shield:1338939270601379850> **${defender.username} gets ready... ${defenderAbilities.join(" ")}**`);
        } else {
            await interaction.editReply(`<:shield:1338939270601379850> **${defender.username} braces for impact!**`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));

        const attackerStatPower = attackerStats.strength + attackerStats.hp + attackerStats.stamina;
        const defenderStatPower = defenderStats.strength + defenderStats.hp + defenderStats.stamina;
  
        const maxLuck = 10;
        const attackerLuck = Math.floor(Math.random() * maxLuck) + (Date.now() % 10);
        const defenderLuck = Math.floor(Math.random() * maxLuck) + ((Date.now() + 1) % 10);

        const attackerPower = Math.floor(attackerStatPower * 0.7 + attackerLuck * 0.3);
        const defenderPower = Math.floor(defenderStatPower * 0.7 + defenderLuck * 0.3);

        const statDifference = Math.abs(attackerStatPower - defenderStatPower);

        let wubbyReward = statDifference > 20 ? 1 : 5;
        let statPointReward = statDifference > 20 ? 0 : 1; 

        let winner, loser;

        if (attackerPower > defenderPower) {
            winner = attacker;
            loser = defenderData;

            await updateMission(winner.userId, 1, Math.max(0, wubbyReward));
            await updateMission(winner.userId, 2, Math.max(0, wubbyReward));
        } else if (attackerPower < defenderPower) {
            winner = defenderData;
            loser = attacker;

            await updateMission(winner.userId, 1, Math.max(0, wubbyReward));
            await updateMission(winner.userId, 2, Math.max(0, wubbyReward));
        } else {
            await interaction.editReply(`<a:smorek1Panic:1291930208038813827> **Both fighters are exhausted... It's a tie!**`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            const tieEmbed = new EmbedBuilder()
                .setColor("#005fff")
                .setTitle("NOWAY! IT'S A TIE")
                .setDescription("It's a tie! No one gets Wubbies. <:SAD:1281517835100885096>");
            return interaction.editReply({ embeds: [tieEmbed], content: "# ITS OVER" });
        }

        winner.wubbies = (winner.wubbies || 0) + wubbyReward;
        if (statPointReward > 0) {
            winner.statPoints = (winner.statPoints || 0) + statPointReward;
        }

        await winner.save();
        await loser.save();

        await interaction.editReply(`<:Punch:1338939251286605975> **A final blow is about to be struck...!**`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        await interaction.editReply(`💀 **${loser.userId === attackerId ? interaction.user.username : defender.username} stumbles...!**`);
        await new Promise(resolve => setTimeout(resolve, 2000));

        await interaction.editReply(`<:W_yellow:1322931650149089412> **${winner.userId === attackerId ? interaction.user.username : defender.username} delivers the final hit!**`);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const fightResultEmbed = new EmbedBuilder()
            .setColor("#005fff")
            .setTitle("<a:pandafire:1338869789375987723> Battle Result <a:pandafire:1338869789375987723>")
            .setDescription(`${winner.userId === attackerId ? interaction.user.username : defender.username} wins the battle! 🏆`)
            .addFields(
                { name: "<:W_yellow:1322931650149089412> Winner", value: `<@${winner.userId}>`},
                { name: "💀 Loser", value: `<@${loser.userId}>` },
                { name: "<:Gems:1292553623431282764> Wubbies Earned", value: `+${wubbyReward}` },
                { name: "🎯 Stat Points Earned", value: `+${statPointReward}` }
            )
            .setFooter({ text: "Thanks for fighting!" });

        await interaction.editReply({ embeds: [fightResultEmbed], content: "# ITS OVER" });
    },
};