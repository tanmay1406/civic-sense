const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class StatusUpdate extends Model {
  // Instance method to get status change duration
  getDurationSinceChange() {
    const now = new Date();
    const changed = new Date(this.created_at);
    const durationMs = now - changed;

    return {
      total_hours: durationMs / (1000 * 60 * 60),
      days: Math.floor(durationMs / (1000 * 60 * 60 * 24)),
      hours: Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    };
  }

  // Instance method to check if this was an escalation
  isEscalation() {
    return this.status === 'escalated' ||
           (this.previous_status === 'pending' && this.status === 'in_progress');
  }

  // Instance method to check if this was a resolution
  isResolution() {
    return this.status === 'resolved';
  }

  // Instance method to check if this was a reopening
  isReopening() {
    return this.status === 'reopened' ||
           (['resolved', 'closed'].includes(this.previous_status) &&
            ['open', 'in_progress'].includes(this.status));
  }

  // Get status change type
  getChangeType() {
    const statusHierarchy = {
      'draft': 0,
      'submitted': 1,
      'open': 2,
      'acknowledged': 3,
      'in_progress': 4,
      'pending': 5,
      'resolved': 6,
      'closed': 7,
      'rejected': -1,
      'duplicate': -2,
      'reopened': 2,
      'escalated': 8
    };

    const prevLevel = statusHierarchy[this.previous_status] || 0;
    const currentLevel = statusHierarchy[this.status] || 0;

    if (this.isResolution()) return 'resolution';
    if (this.isReopening()) return 'reopening';
    if (this.isEscalation()) return 'escalation';
    if (currentLevel > prevLevel) return 'progress';
    if (currentLevel < prevLevel) return 'regression';
    return 'lateral';
  }
}

StatusUpdate.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  // Issue Reference
  issue_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'issues',
      key: 'id'
    },
    validate: {
      notEmpty: { msg: 'Issue ID is required' },
      isUUID: { args: 4, msg: 'Invalid issue ID format' }
    }
  },

  // Status Information
  status: {
    type: DataTypes.ENUM(
      'draft',
      'submitted',
      'open',
      'acknowledged',
      'in_progress',
      'pending',
      'resolved',
      'closed',
      'rejected',
      'duplicate',
      'reopened',
      'escalated'
    ),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Status is required' }
    }
  },

  previous_status: {
    type: DataTypes.ENUM(
      'draft',
      'submitted',
      'open',
      'acknowledged',
      'in_progress',
      'pending',
      'resolved',
      'closed',
      'rejected',
      'duplicate',
      'reopened',
      'escalated'
    ),
    allowNull: true,
    comment: 'Previous status before this change'
  },

  sub_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Detailed sub-status for better tracking'
  },

  previous_sub_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Previous sub-status before this change'
  },

  // Change Information
  updated_by_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notEmpty: { msg: 'Updated by user ID is required' },
      isUUID: { args: 4, msg: 'Invalid user ID format' }
    }
  },

  updated_by_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Cached name of person who made the change'
  },

  updated_by_role: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Role of person who made the change'
  },

  // Change Details
  change_reason: {
    type: DataTypes.ENUM(
      'normal_progression',
      'escalation',
      'citizen_request',
      'admin_override',
      'auto_assignment',
      'duplicate_found',
      'insufficient_info',
      'external_dependency',
      'resource_unavailable',
      'completed',
      'cancelled',
      'rejected',
      'system_auto'
    ),
    allowNull: true,
    defaultValue: 'normal_progression'
  },

  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: { args: [0, 2000], msg: 'Notes cannot exceed 2000 characters' }
    }
  },

  internal_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes not visible to citizens'
  },

  // Assignment Changes
  assigned_to_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User assigned during this status change'
  },

  assigned_department_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    },
    comment: 'Department assigned during this status change'
  },

  previous_assigned_to_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Previously assigned user'
  },

  previous_assigned_department_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    },
    comment: 'Previously assigned department'
  },

  // Timing Information
  estimated_completion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Estimated completion time when status was changed'
  },

  sla_deadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'SLA deadline at time of status change'
  },

  time_in_previous_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Minutes spent in previous status'
  },

  // Priority Changes
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true,
    comment: 'Priority at time of status change'
  },

  previous_priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true,
    comment: 'Priority before this change'
  },

  priority_changed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether priority was changed in this update'
  },

  // Escalation Information
  escalation_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: 0, msg: 'Escalation level cannot be negative' }
    }
  },

  escalated_from_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who escalated the issue'
  },

  escalated_to_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User to whom issue was escalated'
  },

  escalation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for escalation'
  },

  // Resolution Information
  resolution_type: {
    type: DataTypes.ENUM('fixed', 'duplicate', 'not_reproducible', 'rejected', 'cancelled', 'deferred'),
    allowNull: true,
    comment: 'Type of resolution if status is resolved'
  },

  resolution_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed resolution notes'
  },

  resolution_media_urls: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: [],
    comment: 'Before/after photos of resolution'
  },

  // Cost and Resource Information
  estimated_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Estimated cost at time of status change'
  },

  actual_cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Actual cost if resolved'
  },

  resources_used: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Resources used for this status change'
  },

  // Notification Information
  notification_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether citizen was notified of this change'
  },

  notification_sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When notification was sent'
  },

  notification_type: {
    type: DataTypes.ENUM('email', 'sms', 'push', 'all'),
    allowNull: true,
    comment: 'Type of notification sent'
  },

  // Citizen Interaction
  citizen_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether citizen should be notified of this change'
  },

  public_update: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this update is visible to citizens'
  },

  citizen_feedback_requested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether citizen feedback was requested'
  },

  // System Information
  change_source: {
    type: DataTypes.ENUM('manual', 'system', 'api', 'mobile_app', 'web_portal', 'integration'),
    defaultValue: 'manual',
    comment: 'Source of the status change'
  },

  ip_address: {
    type: DataTypes.INET,
    allowNull: true,
    comment: 'IP address from which change was made'
  },

  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string if changed via web/mobile'
  },

  device_info: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Device information if changed via mobile app'
  },

  // Attachments and Media
  attachments: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: [],
    comment: 'Files attached with this status update'
  },

  photos: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: [],
    comment: 'Photos attached with this status update'
  },

  // Workflow Information
  workflow_step: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Workflow step identifier'
  },

  approval_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this change requires approval'
  },

  approved_by_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who approved this change'
  },

  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this change was approved'
  },

  // Location Information (if status change happened at location)
  location_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'Location where status change was made'
  },

  location_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'Location where status change was made'
  },

  location_accuracy: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: 'GPS accuracy in meters'
  },

  // Quality and Validation
  quality_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    comment: 'Quality score of this status update'
  },

  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this status change has been verified'
  },

  verification_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes about verification of this change'
  },

  // Integration and External Systems
  external_reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Reference in external system'
  },

  sync_status: {
    type: DataTypes.ENUM('pending', 'synced', 'failed', 'not_required'),
    defaultValue: 'not_required',
    comment: 'Status of sync with external systems'
  },

  sync_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if sync failed'
  },

  // Custom Fields
  custom_fields: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional custom fields for this status update'
  }

}, {
  sequelize,
  modelName: 'StatusUpdate',
  tableName: 'status_updates',
  paranoid: true, // Soft deletes
  timestamps: true,
  indexes: [
    { fields: ['issue_id'] },
    { fields: ['updated_by_id'] },
    { fields: ['status'] },
    { fields: ['previous_status'] },
    { fields: ['created_at'] },
    { fields: ['change_reason'] },
    { fields: ['assigned_department_id'] },
    { fields: ['assigned_to_id'] },
    { fields: ['escalation_level'] },
    { fields: ['resolution_type'] },
    { fields: ['public_update'] },
    { fields: ['notification_sent'] },
    { fields: ['change_source'] },
    { fields: ['sync_status'] },
    {
      fields: ['issue_id', 'created_at'],
      name: 'status_updates_issue_timeline_idx'
    },
    {
      fields: ['status', 'created_at'],
      name: 'status_updates_status_timeline_idx'
    },
    {
      fields: ['updated_by_id', 'created_at'],
      name: 'status_updates_user_activity_idx'
    },
    {
      fields: ['location_latitude', 'location_longitude'],
      name: 'status_updates_location_idx'
    }
  ],
  hooks: {
    beforeValidate: async (statusUpdate) => {
      // Cache user information
      if (statusUpdate.updated_by_id && !statusUpdate.updated_by_name) {
        const User = require('./User');
        const user = await User.findByPk(statusUpdate.updated_by_id);
        if (user) {
          statusUpdate.updated_by_name = user.full_name;
          statusUpdate.updated_by_role = user.role;
        }
      }
    },

    beforeSave: async (statusUpdate) => {
      // Calculate time in previous status
      if (statusUpdate.issue_id && !statusUpdate.time_in_previous_status) {
        const previousUpdate = await StatusUpdate.findOne({
          where: { issue_id: statusUpdate.issue_id },
          order: [['created_at', 'DESC']],
          limit: 1
        });

        if (previousUpdate) {
          const timeDiff = new Date() - new Date(previousUpdate.created_at);
          statusUpdate.time_in_previous_status = Math.floor(timeDiff / (1000 * 60)); // in minutes
        }
      }

      // Set priority changed flag
      if (statusUpdate.priority && statusUpdate.previous_priority) {
        statusUpdate.priority_changed = statusUpdate.priority !== statusUpdate.previous_priority;
      }

      // Auto-set resolution type for resolved status
      if (statusUpdate.status === 'resolved' && !statusUpdate.resolution_type) {
        statusUpdate.resolution_type = 'fixed';
      }
    },

    afterCreate: async (statusUpdate) => {
      // Send notifications if required
      if (statusUpdate.citizen_notified && statusUpdate.public_update) {
        // Here you would trigger notification service
        // NotificationService.sendStatusUpdateNotification(statusUpdate);
      }

      // Update issue statistics
      const Issue = require('./Issue');
      const issue = await Issue.findByPk(statusUpdate.issue_id);
      if (issue) {
        issue.last_status_update = statusUpdate.created_at;
        await issue.save({ hooks: false });
      }

      // Sync with external systems if needed
      if (statusUpdate.sync_status === 'pending') {
        // Here you would trigger external sync
        // ExternalSyncService.syncStatusUpdate(statusUpdate);
      }
    }
  },

  scopes: {
    // Public updates visible to citizens
    public: {
      where: { public_update: true }
    },

    // Recent updates
    recent: (days = 7) => ({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      order: [['created_at', 'DESC']]
    }),

    // By status
    byStatus: (status) => ({
      where: { status }
    }),

    // By change reason
    byReason: (reason) => ({
      where: { change_reason: reason }
    }),

    // Escalations
    escalations: {
      where: {
        [sequelize.Sequelize.Op.or]: [
          { status: 'escalated' },
          { escalation_level: { [sequelize.Sequelize.Op.gt]: 0 } }
        ]
      }
    },

    // Resolutions
    resolutions: {
      where: { status: 'resolved' }
    },

    // By user
    byUser: (userId) => ({
      where: { updated_by_id: userId }
    }),

    // By issue
    byIssue: (issueId) => ({
      where: { issue_id: issueId },
      order: [['created_at', 'ASC']]
    }),

    // With notifications
    withNotifications: {
      where: { notification_sent: true }
    },

    // Pending sync
    pendingSync: {
      where: { sync_status: 'pending' }
    },

    // Failed sync
    failedSync: {
      where: { sync_status: 'failed' }
    },

    // With attachments
    withAttachments: {
      where: {
        [sequelize.Sequelize.Op.or]: [
          { attachments: { [sequelize.Sequelize.Op.ne]: [] } },
          { photos: { [sequelize.Sequelize.Op.ne]: [] } }
        ]
      }
    },

    // Manual changes
    manual: {
      where: { change_source: 'manual' }
    },

    // System changes
    system: {
      where: { change_source: 'system' }
    },

    // With relations
    withRelations: {
      include: [
        {
          model: require('./User'),
          as: 'updatedBy',
          attributes: ['id', 'first_name', 'last_name', 'role']
        },
        {
          model: require('./Issue'),
          as: 'issue',
          attributes: ['id', 'issue_number', 'title', 'status']
        },
        {
          model: require('./User'),
          as: 'assignedTo',
          attributes: ['id', 'first_name', 'last_name'],
          required: false
        },
        {
          model: require('./Department'),
          as: 'assignedDepartment',
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ]
    },

    // Timeline view
    timeline: {
      attributes: [
        'id',
        'status',
        'previous_status',
        'notes',
        'updated_by_name',
        'created_at',
        'change_reason',
        'public_update'
      ],
      order: [['created_at', 'ASC']]
    }
  }
});

module.exports = StatusUpdate;
