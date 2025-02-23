const client = require("../index")
const mongoose = require("mongoose")
const { ActivityType } = require("discord.js");
const config = require("../config.json")

client.on("ready", async () => {
    
    mongoose.connect(config.mongodb, {
        useUnifiedTopology : true,
        useNewUrlParser : true,
    }).then(console.log('✅ Successfully connected to the database'));

    console.log("✅ Ready for Requests!")

    const arryOfStatus = [
        `Blues Tester`,
        `Dont use any commands`
      ]
    
    let index = 0;
    setInterval(() => {
        if(index === arryOfStatus.length) index = 0;
        const status = arryOfStatus[index];
        client.user.setPresence({
            activities: [{ name: `${status}`, type: ActivityType.Playing }],
            status: 'online',
          });
        index++;
    }, 30000);
})