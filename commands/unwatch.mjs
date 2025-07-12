import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { WatchSettings } from '../models/WatchSettings.js';

export const data = new SlashCommandBuilder()
  .setName('unwatch')
  .setDescription('特定のユーザーの監視を停止します')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('監視停止対象のユーザー')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user');

  try {
    // 既存の監視設定を確認
    const existingWatch = await WatchSettings.findOne({
      where: {
        guildId: interaction.guild.id,
        userId: targetUser.id,
        isActive: true
      }
    });

    if (!existingWatch) {
      return await interaction.reply({
        content: `❌ ${targetUser.tag} は監視対象になっていません。`,
        ephemeral: true
      });
    }

    // 監視設定を無効化
    await existingWatch.update({
      isActive: false
    });

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('👁️ 監視停止')
      .setDescription(`${targetUser.tag} の監視を停止しました`)
      .addFields(
        { name: '対象ユーザー', value: targetUser.toString(), inline: true },
        { name: '停止者', value: interaction.user.toString(), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error('監視停止エラー:', error);
    await interaction.reply({
      content: '❌ 監視停止中にエラーが発生しました。',
      ephemeral: true
    });
  }
} 