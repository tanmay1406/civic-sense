const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  issueId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'issue_id',
    references: {
      model: 'issues',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 2000]
    }
  },
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'update', 'assignment', 'resolution'),
    allowNull: false,
    defaultValue: 'info'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium'
  },
  actionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'action_url',
    validate: {
      isUrl: {
        msg: 'Action URL must be a valid URL'
      }
    }
  },
  actionText: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'action_text',
    validate: {
      len: [1, 100]
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Additional notification metadata like sender info, issue details, etc.'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at',
    validate: {
      isDate: true,
      isAfter: {
        args: [new Date().toISOString()],
        msg: 'Expiration date must be in the future'
      }
    }
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_archived'
  },
  archivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'archived_at'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at',
    defaultValue: DataTypes.NOW
  },
  deliveryStatus: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
    field: 'delivery_status'
  },
  deliveryError: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'delivery_error'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false,
  indexes: [
    {
      name: 'idx_notifications_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_notifications_issue_id',
      fields: ['issue_id']
    },
    {
      name: 'idx_notifications_is_read',
      fields: ['is_read']
    },
    {
      name: 'idx_notifications_type',
      fields: ['type']
    },
    {
      name: 'idx_notifications_priority',
      fields: ['priority']
    },
    {
      name: 'idx_notifications_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_notifications_expires_at',
      fields: ['expires_at']
    },
    {
      name: 'idx_notifications_user_unread',
      fields: ['user_id', 'is_read']
    },
    {
      name: 'idx_notifications_user_type',
      fields: ['user_id', 'type']
    }
  ],
  hooks: {
    beforeUpdate: async (notification) => {
      // Auto-set readAt timestamp when marking as read
      if (notification.isRead && !notification.readAt) {
        notification.readAt = new Date();
      }
    },
    beforeSave: async (notification) => {
      // Auto-archive expired notifications
      if (notification.expiresAt && new Date() > notification.expiresAt) {
        notification.isArchived = true;
        notification.archivedAt = new Date();
      }
    }
  },
  scopes: {
    unread: {
      where: {
        is_read: false
      }
    },
    read: {
      where: {
        is_read: true
      }
    },
    active: {
      where: {
        is_archived: false,
        [sequelize.Sequelize.Op.or]: [
          { expires_at: null },
          { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
        ]
      }
    },
    archived: {
      where: {
        is_archived: true
      }
    },
    byType: (type) => ({
      where: {
        type: type
      }
    }),
    byPriority: (priority) => ({
      where: {
        priority: priority
      }
    }),
    recent: {
      order: [['created_at', 'DESC']],
      limit: 50
    }
  }
});

// Instance methods
Notification.prototype.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

Notification.prototype.markAsUnread = async function() {
  this.isRead = false;
  this.readAt = null;
  return await this.save();
};

Notification.prototype.archive = async function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  return await this.save();
};

Notification.prototype.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

Notification.prototype.toJSON = function() {
  const values = { ...this.dataValues };

  // Add computed fields
  values.isExpired = this.isExpired();
  values.timeAgo = this.getTimeAgo();

  return values;
};

Notification.prototype.getTimeAgo = function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return created.toLocaleDateString();
};

// Static methods
Notification.createForUser = async function(userId, data) {
  return await this.create({
    userId,
    ...data,
    sentAt: new Date(),
    deliveryStatus: 'sent'
  });
};

Notification.createForIssue = async function(issueId, userId, data) {
  return await this.create({
    userId,
    issueId,
    ...data,
    sentAt: new Date(),
    deliveryStatus: 'sent'
  });
};

Notification.bulkCreateForUsers = async function(userIds, data) {
  const notifications = userIds.map(userId => ({
    userId,
    ...data,
    sentAt: new Date(),
    deliveryStatus: 'sent'
  }));

  return await this.bulkCreate(notifications);
};

Notification.markAllAsReadForUser = async function(userId) {
  return await this.update(
    {
      isRead: true,
      readAt: new Date()
    },
    {
      where: {
        userId: userId,
        isRead: false
      }
    }
  );
};

Notification.getUnreadCountForUser = async function(userId) {
  return await this.count({
    where: {
      userId: userId,
      isRead: false,
      isArchived: false
    }
  });
};

Notification.cleanupExpired = async function() {
  return await this.update(
    {
      isArchived: true,
      archivedAt: new Date()
    },
    {
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date()
        },
        isArchived: false
      }
    }
  );
};

module.exports = Notification;
