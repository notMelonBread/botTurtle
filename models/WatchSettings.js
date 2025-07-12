import { DataTypes } from 'sequelize';
import { sequelize } from './UserActivity.js';

const WatchSettings = sequelize.define('WatchSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  guildId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'DiscordサーバーID'
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '監視対象のユーザーID'
  },
  watcherId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '監視を設定したユーザーID'
  },
  maxInactiveDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7,
    comment: '最大無活動日数'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '監視が有効かどうか'
  },
  warningSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '警告メッセージが送信済みかどうか'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '監視開始日時'
  }
}, {
  tableName: 'watch_settings',
  timestamps: true,
  indexes: [
    {
      fields: ['guildId', 'userId']
    },
    {
      fields: ['isActive']
    }
  ]
});

export { WatchSettings }; 