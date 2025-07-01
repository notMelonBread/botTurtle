import { SlashCommandBuilder } from 'npm:discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Pong!');

export async function execute(interaction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const ping = sent.createdTimestamp - interaction.createdTimestamp;
  
  await interaction.editReply(`Pong! 🏓\nBotの応答速度: ${ping}ms\nWebSocket: ${interaction.client.ws.ping}ms`);
}
