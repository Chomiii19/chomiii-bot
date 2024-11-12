import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import tts from "./tts.js";
import { play, stop, isPlayingStatus } from "./yt.js";
import rps from "./rps/rps.js";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const prefix = "!";

client.on("messageCreate", async (message) => {
  if (message.content.includes("nigga"))
    message.reply("**_WHAT DID YOU SAY TO ME?! 😡_**");

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "tts") {
    if (!isPlayingStatus()) {
      tts(message, args); // Pass message and args to the tts function
    } else {
      message.reply(
        "**_❌Cannot perform tts command while playing YouTube audio.❌_**"
      );
    }
  }
  if (command === "play") {
    // if (isPlayingStatus()) {
    //   message.reply("**_❌A YouTube audio is still currently playing.❌_**");
    // } else {
    await play(message, args);
    isPlayingStatus(true);
    // }
  }
  if (command === "stop") stop(message); // Use stop function for the stop command
  if (command === "help")
    message.reply(
      "**!** - _command prefix_ \n**! tts <text>** - _text-to-speech_ \n**! play <yt-link>** - _play YouTube url_ \n**! stop** - _stop playing_ \n**! rps** - _rock-paper-scissors game_"
    );

  if (command === "queue") {
    if (queue.length === 0) {
      message.reply("**_The queue is currently empty._**");
    } else {
      const queueMessage = queue
        .map((url, index) => `**${index + 1}.** ${url}`)
        .join("\n");
      message.reply(`**_Current Queue:_**\n${queueMessage}`);
    }
  }

  if (command === "rps") {
    rps(message, args);
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.DC_KEY);
