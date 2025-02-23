const Player = require("../models/fightsystem");

async function getPlayer(userId) {
    let player = await Player.findOne({ userId });

    if (!player) {
        player = new Player({ userId });
        await player.save();
    }

    return player;
}

module.exports = { getPlayer };