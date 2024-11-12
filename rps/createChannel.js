import { ChannelType } from "discord.js";

const createChannel = async (category, guild, pId, pTag) => {
  const newChannel = await guild.channels.create({
    name: `${pTag}'s Room`,
    type: ChannelType.GuildText,
    topic: "Private channel for the game participants",
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: ["ViewChannel"],
      },
      {
        id: pId,
        allow: ["ViewChannel", "SendMessages"],
      },
    ],
  });

  newChannel.send("**Welcome to the game room!**");

  const botmsg = await newChannel.send(
    "**React with your chosen answer (👊-ROCK,✋-PAPER, ✌️-SCISSORS)**"
  );

  await Promise.all([
    botmsg.react("👊"),
    botmsg.react("✋"),
    botmsg.react("✌️"),
  ]);

  const filter = (reaction, user) => {
    if (user.bot) return false;
    console.log(`Reaction: ${reaction.emoji.name}, User: ${user.tag}`);

    return ["✌️", "👊", "✋"].includes(reaction.emoji.name);
  };

  const collected = await botmsg.awaitReactions({
    filter,
    max: 1, // Only collect one reaction
    time: 15000,
    errors: ["time"],
  });

  const reaction = collected.first();

  if (reaction) {
    return { newChannel, playerChoice: reaction.emoji.name, player: pTag };
  } else {
    newChannel.send("No valid reaction was collected in time.");
    return { newChannel, playerChoice: null };
  }
};

const determineWinner = (choice1, choice2, p1, p2) => {
  if (choice1 === choice2) return "**_RESULT: It's a tie!😱_**";
  if (
    (choice1 === "👊" && choice2 === "✌️") ||
    (choice1 === "✋" && choice2 === "👊") ||
    (choice1 === "✌️" && choice2 === "✋")
  ) {
    return `**_RESULT: ${p1} wins!🥳_**`;
  } else {
    return `**_RESULT: ${p2} wins!🥳**_`;
  }
};

const createCategory = async (message, p1Id, p2Id, p1Tag, p2Tag) => {
  const guild = message.guild;

  try {
    const category = await guild.channels.create({
      name: "Rock, Paper, Scissors",
      type: ChannelType.GuildCategory,
    });

    const [channel1, channel2] = await Promise.all([
      createChannel(category, guild, p1Id, p1Tag),
      createChannel(category, guild, p2Id, p2Tag),
    ]);

    message.channel.send(
      `👉A private game room has been created under the category **"${category.name}"**: **${channel1.newChannel}** and **${channel2.newChannel}**`
    );

    if (channel1.playerChoice && channel2.playerChoice) {
      const result = determineWinner(
        channel1.playerChoice,
        channel2.playerChoice,
        channel1.player,
        channel2.player
      );
      message.channel.send(result);
    } else {
      message.channel.send(
        "**Game could not be completed. One or both players did not make a choice in time.**"
      );
    }

    await deleteCategory(message, category);
  } catch (error) {
    console.error("Error creating the category or channel:", error);
    message.channel.send(
      "**There was an error creating the category or channel.**"
    );
  }
};

const deleteCategory = async (message, category) => {
  try {
    if (!category) {
      return message.channel.send("No category found to delete.");
    }

    const channelsInCategory = category.children.cache;

    channelsInCategory.forEach((channel) => {
      channel
        .delete()
        .then(() => console.log(`Deleted channel: ${channel.name}`))
        .catch((err) =>
          console.error(`Error deleting channel ${channel.name}:`, err)
        );
    });

    await category.delete();
  } catch (error) {
    console.error("Error deleting the category:", error);
    message.channel.send("**There was an error deleting the category.😥**");
  }
};

export { createCategory, deleteCategory };
