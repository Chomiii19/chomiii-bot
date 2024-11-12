import * as channel from "./createChannel.js";

export default async (message, args) => {
  const botmsg = await message.channel.send(
    "**Players, react with 👍 to this message! Game will start in 15 seconds🫣**"
  );

  await botmsg.react("👍");

  const filter = (reaction, user) => {
    if (user.bot) return false;
    console.log(`Reaction: ${reaction.emoji.name}, User: ${user.tag}`);
    return reaction.emoji.name === "👍";
  };

  try {
    const collected = await botmsg.awaitReactions({
      filter,
      max: 2,
      time: 15000,
      errors: ["time"],
    });

    const reaction = collected.first();

    if (reaction) {
      const usersId = reaction.users.cache
        .filter((user) => !user.bot)
        .map((user) => user.id);

      const userTags = reaction.users.cache
        .filter((user) => !user.bot)
        .map((user) => user.tag);

      if (usersId.length >= 2) {
        message.channel.send(
          `**Initializing rock-paper-scissors game...\n\n_(${userTags[0]} ⚔️ ${userTags[1]})_**`
        );

        channel.createCategory(
          message,
          usersId[0],
          usersId[1],
          userTags[0],
          userTags[1]
        );
      } else {
        message.channel.send("**Not enough players to start the game.**");
      }
    }
  } catch (error) {
    message.channel.send(
      "**Minimum numer of players not satisfied, game canceled.😥**"
    );
    console.error(error);
  }
};
