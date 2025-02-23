const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { getPlayer } = require("../utils/playerUtils");
const Player = require("../models/fightsystem");

// Emojis
const EMOJI_PUNCH = "1338939251286605975"; // Nur die Emoji-ID
const EMOJI_SHIELD = "1338939270601379850"; // Nur die Emoji-ID
const EMOJI_VOLLEYBALL = "1338939334568575128"; // Nur die Emoji-ID
const EMOJI_WINNER = "1322931650149089412"; // Nur die Emoji-ID
const EMOJI_WUBBIES = "1292553623431282764"; // Nur die Emoji-ID

// Schadensformel
const calculateDamage = (strength) => {
    const rawDamage = Math.floor(2 + (strength / 10) + (strength * strength) / 500);
    return Math.min(rawDamage, 30); // Maximal 30 Schaden
};

// Funktion zur Aktualisierung der Missionen
async function updateMission(userId, missionId, amount) {
    let player = await Player.findOne({ userId });

    if (!player) {
        console.log("Player not found");
        return;
    }

    // Suche nach der entsprechenden Mission
    const mission = player.weeklyMissions.find(m => m.id === missionId);

    if (mission && !mission.completed) {
        console.log(`Mission found: ${missionId} - Progress: ${mission.progress} - Goal: ${mission.goal}`);

        mission.progress += amount;
        console.log(`New progress: ${mission.progress}`);

        if (mission.progress >= mission.goal) {
            mission.completed = true;
            console.log(`Mission completed: ${missionId}`);

            // Belohnung basierend auf der Art der Mission
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
        .setName("longfight")
        .setDescription("Start a pokémon-style fight with another player")
        .addUserOption(option => option.setName("opponent").setDescription("Choose your opponent").setRequired(true)),
    
    async execute(interaction) {
        const attackerId = interaction.user.id;
        const defender = interaction.options.getUser("opponent");

        if (!defender || defender.id === attackerId || defender.bot) {
            await interaction.reply({ content: "You must choose a valid opponent!", ephemeral: true });
            return;
        }

        // Bestätigungsnachricht mit Buttons
        const confirmEmbed = new EmbedBuilder()
            .setColor("#005fff")
            .setDescription(`⚔️ **${defender.username}, do you accept the fight challenge from ${interaction.user.username}?**`);

        const confirmButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("accept_fight")
                .setLabel("Accept")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("decline_fight")
                .setLabel("Decline")
                .setStyle(ButtonStyle.Danger)
        );

        const confirmationMessage = await interaction.reply({
            content: `<@${defender.id}>`,
            embeds: [confirmEmbed],
            components: [confirmButtons],
            fetchReply: true
        });

        // Sammle die Antwort des Verteidigers
        const collector = confirmationMessage.createMessageComponentCollector({ time: 60000 }); // 60 Sekunden Zeit zum Antworten

        collector.on("collect", async i => {
            if (i.user.id !== defender.id) {
                await i.reply({ content: "Only the defender can respond to this challenge!", ephemeral: true });
                return;
            }

            if (i.customId === "accept_fight") {
                await i.update({ content: `🎉 **${defender.username} has accepted the fight!**`, embeds: [], components: [] });

                // Kampf starten
                const rawAttacker = await getPlayer(attackerId);
                const rawDefender = await getPlayer(defender.id);

                const attacker = {
                    hp: Number(rawAttacker.hp) || 100,
                    strength: Number(rawAttacker.strength) || 10,
                    stamina: Number(rawAttacker.stamina) || 10,
                    equippedAbilities: rawAttacker.equippedAbilities || [],
                    userId: attackerId,
                    username: interaction.user.username
                };

                const defenderData = {
                    hp: Number(rawDefender.hp) || 100,
                    strength: Number(rawDefender.strength) || 10,
                    stamina: Number(rawDefender.stamina) || 10,
                    equippedAbilities: rawDefender.equippedAbilities || [],
                    userId: defender.id,
                    username: defender.username
                };

                let fightState = {
                    attacker,
                    defender: defenderData,
                    turn: attackerId,
                    cooldowns: {
                        [attacker.userId]: { punch: 0 },
                        [defenderData.userId]: { punch: 0 }
                    },
                    shieldUsed: {
                        [attacker.userId]: false,
                        [defenderData.userId]: false
                    },
                    shields: {
                        [attacker.userId]: false,
                        [defenderData.userId]: false
                    },
                    dodgeChance: {
                        [attacker.userId]: 0,
                        [defenderData.userId]: 0
                    }
                };

                const createButtons = () => {
                    const currentPlayer = fightState.turn === fightState.attacker.userId ? fightState.attacker : fightState.defender;
                    const cooldowns = fightState.cooldowns[currentPlayer.userId];

                    return new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("basic_attack")
                            .setLabel(`Basic Attack (${calculateDamage(currentPlayer.strength)} DMG)`)
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId("punch")
                            .setLabel(cooldowns.punch > 0 ? `Punch (CD: ${cooldowns.punch})` : "Punch (+3 DMG 40%)")
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji(`<:punch:${EMOJI_PUNCH}>`)
                            .setDisabled(cooldowns.punch > 0 || !currentPlayer.equippedAbilities.includes("punch")),
                        new ButtonBuilder()
                            .setCustomId("volleyball")
                            .setLabel("Volleyball (Dodge+)")
                            .setStyle(ButtonStyle.Success)
                            .setEmoji(`<:volleyball:${EMOJI_VOLLEYBALL}>`)
                            .setDisabled(!currentPlayer.equippedAbilities.includes("volleyball")),
                        new ButtonBuilder()
                            .setCustomId("shield")
                            .setLabel(fightState.shieldUsed[currentPlayer.userId] ? "Shield (Used)" : "Shield (Block)")
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji(`<:shield:${EMOJI_SHIELD}>`)
                            .setDisabled(fightState.shieldUsed[currentPlayer.userId] || !currentPlayer.equippedAbilities.includes("shield"))
                    );
                };

                const createEmbed = (description) => {
                    return new EmbedBuilder()
                        .setColor("#005fff")
                        .setDescription(description)
                        .addFields(
                            {
                                name: `${fightState.attacker.username}`,
                                value: `❤️ ${fightState.attacker.hp} | 💪 ${fightState.attacker.strength} | 🏃 ${fightState.attacker.stamina}`,
                                inline: true
                            },
                            {
                                name: `${fightState.defender.username}`,
                                value: `❤️ ${fightState.defender.hp} | 💪 ${fightState.defender.strength} | 🏃 ${fightState.defender.stamina}`,
                                inline: true
                            }
                        );
                };

                const fightMessage = await interaction.followUp({
                    embeds: [createEmbed(`⚔️ **Fight Started!** ${fightState.attacker.username} vs. ${fightState.defender.username}\n\n${fightState.attacker.username}, choose your action:`)],
                    components: [createButtons()],
                    fetchReply: true
                });

                const fightCollector = fightMessage.createMessageComponentCollector({ time: 300000 }); // 5 Minuten Zeit für den Kampf

                fightCollector.on("collect", async i => {
                    if (i.user.id !== fightState.turn) {
                        await i.reply({ content: "It's not your turn!", ephemeral: true });
                        return;
                    }

                    const currentPlayer = fightState.turn === fightState.attacker.userId ? fightState.attacker : fightState.defender;
                    const opponent = fightState.turn === fightState.attacker.userId ? fightState.defender : fightState.attacker;

                    let resultMessage = "";
                    let damage = 0;
                    let staminaCost = 0;

                    switch (i.customId) {
                        case "basic_attack":
                            damage = calculateDamage(currentPlayer.strength);
                            if (fightState.shields[opponent.userId]) {
                                resultMessage = `**${currentPlayer.username} attacked but ${opponent.username}'s shield blocked the damage!**`;
                                fightState.shields[opponent.userId] = false;
                            } else {
                                const dodgeRoll = Math.random();
                                if (dodgeRoll < fightState.dodgeChance[opponent.userId]) {
                                    resultMessage = `**${currentPlayer.username} attacked but ${opponent.username} dodged!**`;
                                    fightState.dodgeChance[opponent.userId] = 0;
                                } else {
                                    opponent.hp -= damage;
                                    resultMessage = `**${currentPlayer.username} used Basic Attack (${damage} DMG)! ${opponent.username} has ❤️ ${opponent.hp} left.**`;
                                }
                            }
                            break;

                        case "punch":
                            if (!currentPlayer.equippedAbilities.includes("punch")) {
                                resultMessage = "**<:Abilities:1340755734706786367> Ability not equipped!**";
                                break;
                            }
                            if (fightState.cooldowns[currentPlayer.userId].punch > 0) {
                                resultMessage = `Punch is on cooldown! (${fightState.cooldowns[currentPlayer.userId].punch} turns left)`;
                                break;
                            }
                            staminaCost = 2;
                            if (currentPlayer.stamina < staminaCost) {
                                resultMessage = "**:face_exhaling: Not enough stamina!**";
                                break;
                            }

                            // Basisschaden berechnen
                            damage = calculateDamage(currentPlayer.strength);

                            // 40% Chance für zusätzlichen Schaden
                            if (Math.random() < 0.4) {
                                damage += 3; // 3 zusätzlicher Schaden
                                resultMessage = `**<:Punch:1338939251286605975> ${currentPlayer.username} landed a critical Punch (${damage} DMG, -${staminaCost} STA)!\n${opponent.username} has ❤️ ${opponent.hp} left.**`;
                            } else {
                                resultMessage = `**<:Punch:1338939251286605975> ${currentPlayer.username} used Punch (${damage} DMG, -${staminaCost} STA)!\n${opponent.username} has ❤️ ${opponent.hp} left.**`;
                            }

                            // Stamina abziehen und Cooldown setzen
                            currentPlayer.stamina -= staminaCost;
                            fightState.cooldowns[currentPlayer.userId].punch = 3;

                            // Schild- und Ausweichlogik
                            if (fightState.shields[opponent.userId]) {
                                resultMessage = `<:Punch:1338939251286605975> ${currentPlayer.username} used Punch but ${opponent.username}'s shield <:shield:1338939270601379850> blocked the damage!`;
                                fightState.shields[opponent.userId] = false;
                            } else {
                                const dodgeRoll = Math.random();
                                if (dodgeRoll < fightState.dodgeChance[opponent.userId]) {
                                    resultMessage = `<:Punch:1338939251286605975> ${currentPlayer.username} tried to Punch but ${opponent.username} dodged!`;
                                    fightState.dodgeChance[opponent.userId] = 0;
                                } else {
                                    opponent.hp -= damage; // Schaden anwenden
                                }
                            }
                            break;

                        case "volleyball":
                            if (!currentPlayer.equippedAbilities.includes("volleyball")) {
                                resultMessage = "**<:Abilities:1340755734706786367> Ability not equipped!**";
                                break;
                            }
                            fightState.dodgeChance[currentPlayer.userId] = 0.3;
                            resultMessage = `**<:Volleyball:1338939334568575128> ${currentPlayer.username} prepared to dodge! (30% dodge chance)**`;
                            break;

                        case "shield":
                            if (!currentPlayer.equippedAbilities.includes("shield")) {
                                resultMessage = "**<:Abilities:1340755734706786367> Ability not equipped!**";
                                break;
                            }
                            if (fightState.shieldUsed[currentPlayer.userId]) {
                                resultMessage = "**:face_exhaling:You already used your shield!**";
                                break;
                            }
                            fightState.shields[currentPlayer.userId] = true;
                            fightState.shieldUsed[currentPlayer.userId] = true;
                            resultMessage = `**<:shield:1338939270601379850> ${currentPlayer.username} activated Shield!\nNext attack will be blocked.**`;
                            break;

                        default:
                            resultMessage = "**Invalid action!**";
                            break;
                    }

                    if (opponent.hp <= 0) {
                        const maxStatPoints = 10;
                        const currentStatPoints = rawAttacker.statPoints || 0;
                        const statPointsToAdd = currentStatPoints >= maxStatPoints ? 0 : 1;

                        console.log(`Current Stat Points: ${currentStatPoints}, Stat Points to Add: ${statPointsToAdd}`);

                        const resultEmbed = createEmbed(
                            `💀 **<@${opponent.userId}> has been defeated!**\n\n<:winner:${EMOJI_WINNER}> <@${currentPlayer.userId}> wins!\n` +
                            `🎯 +${statPointsToAdd} Stat Point\n` +
                            `<:wubbies:${EMOJI_WUBBIES}> +10 Wubbies!`
                        );

                        await i.update({
                            embeds: [resultEmbed],
                            components: []
                        });

                        const winnerUpdate = {
                            $inc: { wins: 1, wubbies: 10 }
                        };

                        if (statPointsToAdd > 0) {
                            winnerUpdate.$inc.statPoints = 1;
                        }

                        const winner = await Player.findOneAndUpdate(
                            { userId: currentPlayer.userId },
                            winnerUpdate,
                            { new: true }
                        );

                        console.log(`Winner after update: ${JSON.stringify(winner)}`);

                        // Fallback-Logik
                        if (statPointsToAdd > 0 && winner.statPoints < maxStatPoints) {
                            winner.statPoints += statPointsToAdd;
                            await winner.save();
                            console.log(`Fallback: Added ${statPointsToAdd} Stat Points to ${winner.username}`);
                        }

                        const loser = await Player.findOneAndUpdate(
                            { userId: opponent.userId },
                            { $inc: { losses: 1 } },
                            { new: true }
                        );

                        await updateMission(currentPlayer.userId, 1, 1);
                        await updateMission(currentPlayer.userId, 3, 1);
                        await updateMission(currentPlayer.userId, 5, 1);
                        await updateMission(currentPlayer.userId, 2, 10);
                        await updateMission(currentPlayer.userId, 4, 10);

                        fightCollector.stop();
                        return;
                    }

                    fightState.turn = opponent.userId;

                    Object.keys(fightState.cooldowns[opponent.userId]).forEach(ability => {
                        if (fightState.cooldowns[opponent.userId][ability] > 0) {
                            fightState.cooldowns[opponent.userId][ability]--;
                        }
                    });

                    await i.update({
                        embeds: [createEmbed(`${resultMessage}\n\nNow it's ${opponent.username}'s turn!`)],
                        components: [createButtons()]
                    });
                });

                fightCollector.on("end", async () => {
                    await interaction.editReply({ components: [] });
                });
            } else if (i.customId === "decline_fight") {
                await i.update({ content: `😢 **${defender.username} has declined the fight!**`, embeds: [], components: [] });
                collector.stop();
            }
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [] });
        });
    }
};