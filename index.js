const fs = require("fs");
const { Routes, GatewayIntentBits, Partials } = require("discord.js");
const { REST } = require("@discordjs/rest");
const Discord = require("discord.js");
const cron = require("node-cron");
const Player = require("./models/fightsystem")
const config = require("./config.json");

const token = config.token;

const client = new Discord.Client({
    intents: [GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages],
    partials: [Partials.GuildMember, Partials.User, Partials.Channel]
});

module.exports = client;

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./SlashCommands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./SlashCommands/${file}`);
    client.commands.set(command.data.name, command);
}

const commands = [];
const commandsFiles = fs.readdirSync('./SlashCommands/').filter(file => file.endsWith('.js'));

for (const file of commandsFiles) {
    const command = require(`./SlashCommands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(config.clientid, config.guildid), { body: commands })
    .then(() => console.log(`✅ Successfully registered application commands.`))
    .catch(console.error);

// Register commands globally
//rest.put(Routes.applicationCommands(config.clientid), { body: commands })
//    .then(() => console.log(`✅ Successfully registered application commands.`))
//    .catch(console.error);

client.on('interactionCreate', async interaction => {
    if (!interaction.type === Discord.InteractionType.ApplicationCommand) return;
    if (!interaction.guild) return interaction.reply({
        content: "You can't use `/` commands in private messages"
    });

    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
    }
});

const { getPlayer } = require("./models/fightsystem"); 

const allMissions = [
    { id: 1, name: "Win 3 fights", goal: 3, rewardType: "Wubbies", rewardAmount: 10 },
    { id: 2, name: "Earn 100 Wubbies", goal: 100, rewardType: "StatPoints", rewardAmount: 1 },
    { id: 3, name: "Win 5 fights", goal: 5, rewardType: "Wubbies", rewardAmount: 15 },
    { id: 4, name: "Earn 50 Wubbies", goal: 50, rewardType: "StatPoints", rewardAmount: 1 },
    { id: 5, name: "Win 10 fights", goal: 10, rewardType: "Wubbies", rewardAmount: 20 },
];

async function resetWeeklyMissions() {
    console.log("[🕒] Resetting Weekly Missions...");

    const players = await Player.find({}); 
    
    if (players.length === 0) {
        console.log("No players found to reset missions.");
        return;
    }

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

cron.schedule("0 0 * * 1", async () => {
    await resetWeeklyMissions();
    console.log("[🕒] Weekly missions have been reset!");
});

fs.readdirSync("./events/").forEach((file) => {
    const events = fs.readdirSync("./events/").filter((file) =>
        file.endsWith(".js")
    );

    for (let file of events) {
        let pull = require(`./events/${file}`);

        if (pull.name) {
            client.events.set(pull.name, pull);
        } else {
            continue;
        }
    }
});

client.login(token);
