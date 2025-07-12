import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { WatchSettings } from '../models/WatchSettings.js';
import { UserActivity } from '../models/UserActivity.js';
import { Op } from 'sequelize';

export const data = new SlashCommandBuilder()
  .setName('watchlist')
  .setDescription('現在の監視状況を表示します')
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction) {
  try {
    // アクティブな監視設定を取得
    const activeWatches = await WatchSettings.findAll({
      where: {
        guildId: interaction.guild.id,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });

    if (activeWatches.length === 0) {
      return await interaction.reply({
        content: '📋 現在監視中のユーザーはいません。',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📋 監視状況一覧')
      .setDescription(`現在 ${activeWatches.length} 人のユーザーを監視中`)
      .setTimestamp();

    for (const watch of activeWatches) {
      try {
        const user = await interaction.client.users.fetch(watch.userId);
        const watcher = await interaction.client.users.fetch(watch.watcherId);
        
        // 最後の投稿日時を取得
        const lastActivity = await UserActivity.findOne({
          where: {
            userId: watch.userId,
            guildId: watch.guildId
          },
          order: [['timestamp', 'DESC']]
        });

        const lastPostDate = lastActivity ? lastActivity.timestamp : watch.createdAt;
        const daysSinceLastPost = Math.floor((new Date() - new Date(lastPostDate)) / (1000 * 60 * 60 * 24));
        const remainingDays = watch.maxInactiveDays - daysSinceLastPost;

        let status = '🟢 安全';
        if (remainingDays <= 0) {
          status = '🔴 期限切れ';
        } else if (remainingDays <= 2) {
          status = '🟡 警告';
        }

        embed.addFields({
          name: `${status} ${user.tag}`,
          value: `**最終投稿**: ${lastPostDate.toLocaleDateString('ja-JP')} (${daysSinceLastPost}日前)\n**残り日数**: ${Math.max(0, remainingDays)}日\n**設定者**: ${watcher.tag}\n**設定日**: ${watch.createdAt.toLocaleDateString('ja-JP')}`,
          inline: false
        });
      } catch (error) {
        console.error(`ユーザー情報取得エラー (${watch.userId}):`, error);
        embed.addFields({
          name: '❓ 不明なユーザー',
          value: `**ユーザーID**: ${watch.userId}\n**残り日数**: ${watch.maxInactiveDays}日`,
          inline: false
        });
      }
    }

    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error('監視状況取得エラー:', error);
    await interaction.reply({
      content: '❌ 監視状況の取得中にエラーが発生しました。',
      ephemeral: true
    });
  }
} 