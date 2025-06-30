import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Pong! ボットの応答をテストします');

export async function execute(interaction) {
  console.log("Ping command executed!");
  await interaction.reply('Pong! 🏓');
} 