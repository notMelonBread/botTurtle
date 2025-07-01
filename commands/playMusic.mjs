import { SlashCommandBuilder } from 'discord.js';
import { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus 
} from 'node:@discordjs/voice';
import ytdl from 'ytdl-core';

export const connections = new Map();

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('YouTubeの音声を再生するよ')
  .addStringOption(option =>
    option
      .setName('url')
      .setDescription('YouTubeのURLを入力してね')
      .setRequired(true)
  );

export async function execute(interaction) {
  const url = interaction.options.getString('url');
  if (!ytdl.validateURL(url)) {
    await interaction.reply('無効なURLです。正しいYouTubeのURLを入れてね！');
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (!member.voice.channel) {
    await interaction.reply('先にVCに参加してね！');
    return;
  }

  const channel = member.voice.channel;

  // join & stream
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  connections.set(interaction.guild.id, connection);

  const stream = ytdl(url, {
    filter: 'audioonly',
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
  });

  const resource = createAudioResource(stream);
  const player = createAudioPlayer();

  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
    connections.delete(interaction.guild.id);
  });

  player.on('error', error => {
    console.error('Error:', error);
    connection.destroy();
    connections.delete(interaction.guild.id);
  });

  await interaction.reply(`▶ 再生開始: ${url}\n<#${channel.id}> `);
}
