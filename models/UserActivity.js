import { DataTypes, Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const UserActivity = sequelize.define('UserActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'DiscordユーザーID'
  },
  guildId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'DiscordサーバーID'
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '投稿されたチャンネルID'
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'メッセージID'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'メッセージ内容'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '投稿時刻'
  }
}, {
  tableName: 'user_activities',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'guildId']
    },
    {
      fields: ['timestamp']
    }
  ]
});

export { sequelize, UserActivity }; 