const mongoose = require("mongoose")

let Schema = new mongoose.Schema({
    guildid : String,
    channelid : String, 
    msg_id : String,
    true_or_false : String,
    name_and_gems : String,
    reason_for_transferstring : String,
    transfer_user : String
})

module.exports = mongoose.model("rinfos", Schema)