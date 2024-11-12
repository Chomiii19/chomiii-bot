import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import googleTTS from "google-tts-api";
import fs from "fs";
import axios from "axios";

export default async (message, args) => {
  try {
    const text = args.join(" ");
    if (!text) {
      return message.reply("Please provide text to convert to speech!");
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply(
        "You need to be in a voice channel to use this command!"
      );
    }

    const ttsUrl = googleTTS.getAudioUrl(text, {
      lang: "tl",
      slow: false,
      host: "https://translate.google.com",
    });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    let idleTimeout;
    const startIdleTimeout = () => {
      idleTimeout = setTimeout(() => {
        if (
          connection.state.status !== VoiceConnectionStatus.Destroyed &&
          connection.state.status !== VoiceConnectionStatus.Disconnected
        ) {
          connection.destroy();
        }
      }, 180000);
    };

    const resetIdleTimeout = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      startIdleTimeout();
    };

    const response = await axios({
      url: ttsUrl,
      method: "GET",
      responseType: "stream",
    });

    const path = "./tts-audio.mp3";
    const writer = fs.createWriteStream(path);

    response.data.pipe(writer);

    writer.on("finish", () => {
      const player = createAudioPlayer();
      const resource = createAudioResource(path);

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        startIdleTimeout();
        fs.unlinkSync(path);
      });

      player.on(AudioPlayerStatus.Playing, () => {
        resetIdleTimeout();
      });

      player.on("error", (err) => {
        console.error("Error playing TTS audio:", err);
        connection.destroy();
      });

      connection.on(VoiceConnectionStatus.Ready, resetIdleTimeout);
    });

    writer.on("error", (err) => {
      console.error("Error writing TTS audio file:", err);
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    message.reply("There was an error generating the TTS audio.");
  }
};
