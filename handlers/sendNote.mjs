import { EmbedBuilder } from "discord.js";

const TARGET_REACTION = '📝';
const NOTIFY_CHANNEL_ID = '1387730462813720577';

export default async (reaction, user, client) => {
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (user.bot) return;
    if (reaction.emoji.name !== TARGET_REACTION) return;
    if (reaction.count > 1) return;

    const notifyChannel = await client.channels.fetch(NOTIFY_CHANNEL_ID);
    const msg = reaction.message;

    const embed = new EmbedBuilder()
      .setColor(0x5cb85c)
      .setAuthor({ 
        name: `${msg.author.username}（${msg.member?.nickname || msg.author.globalName || 'ニックネームなし'}）`,
        iconURL: msg.author.displayAvatarURL()
      })
      .setDescription(`${msg.content || "(本文なし)"}\n[Jump](${msg.url})`)
      .setFooter({ text: `${msg.channel.name}｜${msg.guild.name}` })
      .setTimestamp(msg.createdAt);

    const attachment = msg.attachments.first();
    if (attachment?.contentType?.startsWith("image/")) {
      embed.setImage(attachment.url);
    }

    await notifyChannel.send({
      content:`## 📌進捗報告\n<#${msg.channel.id}>`,
      embeds:[embed],
    });
  } catch (err) {
    console.error('errorOccured!', err);
  }
};
