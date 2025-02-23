const mongoose = require("mongoose")

let PlayerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    strength: { type: Number, default: 1 },
    hp: { type: Number, default: 10 },
    stamina: { type: Number, default: 4 },
    abilitySlots: { type: Number, default: 1 },
    statPoints: { type: Number, default: 0 },
    wubbies: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    unlockedAbilities: { type: [String], default: [] },
    equippedAbilities: { type: [String], default: [] },

    weeklyMissions: [{
        id: { type: Number, required: true },
        name: { type: String, required: true },
        goal: { type: Number, required: true },
        progress: { type: Number, default: 0 },
        rewardType: { type: String, enum: ["StatPoints", "Wubbies"], required: true },
        rewardAmount: { type: Number, required: true },
        completed: { type: Boolean, default: false }
    }],
    lastMissionReset: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Player", PlayerSchema)