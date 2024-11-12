import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import ytdl from "ytdl-core";
import youtubedl from "youtube-dl-exec";
import fs from "fs";

let currentPlayer = null;
let currentOutputPath = "";
const queue = [];
const MAX_QUEUE_SIZE = 10;

export const play = async (message, args) => {
  const url = args[0];
  if (!ytdl.validateURL(url)) {
    return message.reply("**_Please provide a valid YouTube URL._**");
  }

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.reply(
      "**_You need to be in a voice channel to use this command!_**"
    );
  }

  if (queue.length >= MAX_QUEUE_SIZE) {
    return message.reply(
      "**_The queue is full! Please wait for a song to finish._**"
    );
  }

  queue.push(url);

  if (!currentPlayer) {
    await playNextSong(message, voiceChannel);
  } else {
    message.reply("**_Added to the queue!_**");
  }
};

const playNextSong = async (message, voiceChannel, connect) => {
  if (queue.length === 0) {
    connect.destroy();
    return;
  }

  const url = queue.shift();
  currentOutputPath = `./temp_audio_${Date.now()}.mp3`;

  try {
    await youtubedl(url, {
      output: currentOutputPath,
      format: "bestaudio",
      noCheckCertificate: true,
      noWarnings: true,
      addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    });

    currentPlayer = createAudioPlayer();
    const resource = createAudioResource(currentOutputPath);

    currentPlayer.play(resource);
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connection.subscribe(currentPlayer);

    currentPlayer.on(AudioPlayerStatus.Idle, () => {
      cleanup();
      playNextSong(message, voiceChannel, connection);
    });

    message.reply("**_Now playing... 🎵🎵_**");
  } catch (error) {
    console.error("**Error playing YouTube audio:**", error);
    message.reply("**_There was an error playing the YouTube audio._**");
    cleanup();
  }
};

export const stop = (message) => {
  if (currentPlayer) {
    currentPlayer.stop();
    cleanup();
    message.reply("**_Stopped playing YouTube audio.🛑_**");
  } else {
    message.reply("**_No audio is currently playing._**");
  }
};

let isPlaying;
export const isPlayingStatus = (status = isPlaying) => (isPlaying = status);
const cleanup = () => {
  if (currentOutputPath) {
    fs.unlinkSync(currentOutputPath);
    currentOutputPath = "";
    isPlayingStatus(false);
  }
  currentPlayer = null;
};
