import { SlashCommandBuilder } from 'npm:discord.js';
import { connections } from './playMusic.mjs';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('再生を止めてVCから退出するよ');

export async function execute(interaction) {
  const connection = connections.get(interaction.guild.id);
  if (!connection) {
    await interaction.reply('いま何も再生していないか、VCに入っていないよ！');
    return;
  }

  connection.destroy();
  connections.delete(interaction.guild.id);

  await interaction.reply('⏹ VCから切断しました！');
}
