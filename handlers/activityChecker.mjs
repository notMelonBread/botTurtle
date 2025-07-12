import { WatchSettings } from '../models/WatchSettings.js';
import { UserActivity } from '../models/UserActivity.js';
import { EmbedBuilder } from 'discord.js';

// チェック間隔（1時間 = 3600000ms）
const CHECK_INTERVAL = 3600000;

export async function startActivityChecker(client) {
  console.log('🔄 活動チェッカーを開始しました');
  
  // 初回チェック
  await checkInactiveUsers(client);
  
  // 定期チェックを開始
  setInterval(async () => {
    await checkInactiveUsers(client);
  }, CHECK_INTERVAL);
}

async function checkInactiveUsers(client) {
  try {
    console.log('🔍 無活動ユーザーのチェックを開始...');
    
    // アクティブな監視設定を取得
    const activeWatches = await WatchSettings.findAll({
      where: {
        isActive: true
      }
    });

    for (const watch of activeWatches) {
      try {
        const guild = await client.guilds.fetch(watch.guildId);
        const user = await client.users.fetch(watch.userId);
        const watcher = await client.users.fetch(watch.watcherId);
        
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

        // 警告期間（残り2日以下）
        if (remainingDays <= 2 && remainingDays > 0 && !watch.warningSent) {
          await sendWarningMessage(guild, user, watcher, remainingDays);
          await watch.update({ warningSent: true });
        }
        
        // 期限切れ（残り日数が0以下）
        if (remainingDays <= 0) {
          await kickInactiveUser(guild, user, watcher, daysSinceLastPost);
          await watch.update({ isActive: false });
        }
        
      } catch (error) {
        console.error(`ユーザーチェックエラー (${watch.userId}):`, error);
      }
    }
    
    console.log('✅ 無活動ユーザーのチェックが完了しました');
    
  } catch (error) {
    console.error('活動チェッカーエラー:', error);
  }
}

async function sendWarningMessage(guild, user, watcher, remainingDays) {
  try {
    // システムチャンネルまたは最初のテキストチャンネルに警告を送信
    const systemChannel = guild.systemChannel || 
                         guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
    
    if (!systemChannel) {
      console.warn(`警告メッセージを送信できません: ${guild.name}`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('⚠️ 活動警告')
      .setDescription(`${user.toString()} の投稿活動が低下しています`)
      .addFields(
        { name: '残り日数', value: `${remainingDays}日`, inline: true },
        { name: '監視設定者', value: watcher.toString(), inline: true },
        { name: '注意', value: 'このまま活動がない場合、サーバーからキックされます。' }
      )
      .setTimestamp();

    await systemChannel.send({ embeds: [embed] });
    console.log(`⚠️ 警告メッセージを送信: ${user.tag} (${guild.name})`);
    
  } catch (error) {
    console.error('警告メッセージ送信エラー:', error);
  }
}

async function kickInactiveUser(guild, user, watcher, daysSinceLastPost) {
  try {
    const member = await guild.members.fetch(user.id);
    
    // ボットがキック権限を持っているかチェック
    if (!guild.members.me.permissions.has('KickMembers')) {
      console.warn(`キック権限がありません: ${guild.name}`);
      return;
    }
    
    // 対象ユーザーがキック可能かチェック
    if (!member.kickable) {
      console.warn(`ユーザーをキックできません: ${user.tag} (${guild.name})`);
      return;
    }

    // ユーザーをキック
    await member.kick(`活動停止による自動キック (${daysSinceLastPost}日間無活動)`);
    
    // システムチャンネルに通知
    const systemChannel = guild.systemChannel || 
                         guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
    
    if (systemChannel) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🚫 ユーザーキック')
        .setDescription(`${user.toString()} が活動停止によりキックされました`)
        .addFields(
          { name: '無活動期間', value: `${daysSinceLastPost}日`, inline: true },
          { name: '監視設定者', value: watcher.toString(), inline: true },
          { name: '理由', value: '投稿活動の停止による自動キック' }
        )
        .setTimestamp();

      await systemChannel.send({ embeds: [embed] });
    }
    
    console.log(`🚫 ユーザーをキック: ${user.tag} (${guild.name}) - ${daysSinceLastPost}日間無活動`);
    
  } catch (error) {
    console.error('ユーザーキックエラー:', error);
  }
} 