import { UserActivity } from '../models/UserActivity.js';

export default async function messageCreate(message) {
  // ボットのメッセージは無視
  if (message.author.bot) return;
  
  // DMは無視
  if (!message.guild) return;

  try {
    // ユーザーの投稿活動を記録
    await UserActivity.create({
      userId: message.author.id,
      guildId: message.guild.id,
      channelId: message.channel.id,
      messageId: message.id,
      content: message.content,
      timestamp: new Date()
    });

    console.log(`📝 投稿記録: ${message.author.tag} (${message.guild.name})`);
  } catch (error) {
    console.error('投稿記録エラー:', error);
  }
} 