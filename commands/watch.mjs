import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { WatchSettings } from '../models/WatchSettings.js';

export const data = new SlashCommandBuilder()
  .setName('watch')
  .setDescription('特定のユーザーの投稿活動を監視します')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('監視対象のユーザー')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('days')
      .setDescription('最大無活動日数（デフォルト: 7日）')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(365))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user');
  const maxInactiveDays = interaction.options.getInteger('days') || 7;
  
  // 自分自身を監視対象にすることはできない
  if (targetUser.id === interaction.user.id) {
    return await interaction.reply({
      content: '❌ 自分自身を監視対象にすることはできません。',
      ephemeral: true
    });
  }

  try {
    // 既存の監視設定を確認
    const existingWatch = await WatchSettings.findOne({
      where: {
        guildId: interaction.guild.id,
        userId: targetUser.id,
        isActive: true
      }
    });

    if (existingWatch) {
      return await interaction.reply({
        content: `❌ ${targetUser.tag} は既に監視対象になっています。`,
        ephemeral: true
      });
    }

    // 新しい監視設定を作成
    await WatchSettings.create({
      guildId: interaction.guild.id,
      userId: targetUser.id,
      watcherId: interaction.user.id,
      maxInactiveDays: maxInactiveDays,
      isActive: true,
      warningSent: false
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('👀 監視開始')
      .setDescription(`${targetUser.tag} の投稿活動を監視します`)
      .addFields(
        { name: '監視対象', value: targetUser.toString(), inline: true },
        { name: '最大無活動日数', value: `${maxInactiveDays}日`, inline: true },
        { name: '設定者', value: interaction.user.toString(), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error('監視設定エラー:', error);
    await interaction.reply({
      content: '❌ 監視設定中にエラーが発生しました。',
      ephemeral: true
    });
  }
} 