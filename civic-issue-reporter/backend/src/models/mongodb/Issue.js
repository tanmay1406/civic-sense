const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: [
      'submitted',
      'under_review',
      'assigned',
      'in_progress',
      'resolved',
      'closed',
      'rejected',
      'duplicate'
    ],
    default: 'submitted'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required']
    }
  },
  address: {
    formatted: String,
    street: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  media: [{
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String,
    filename: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    fileType: {
      type: String,
      required: false
    }
  }],
  voiceNote: {
    url: String,
    publicId: String,
    duration: Number,
    transcription: String
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'anonymous'],
    default: 'public'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  votes: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: {
        type: String,
        enum: ['up', 'down']
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    isOfficial: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  escalationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  escalationHistory: [{
    level: Number,
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  expectedResolutionDate: Date,
  actualResolutionDate: Date,
  resolutionDetails: {
    description: String,
    media: [{
      type: String,
      url: String,
      publicId: String,
      uploadedAt: Date
    }],
    cost: Number,
    workOrderNumber: String,
    contractorDetails: {
      name: String,
      contact: String,
      licenseNumber: String
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date,
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  tags: [String],
  urgencyScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  impactRadius: {
    type: Number,
    default: 100
  },
  affectedCitizens: {
    type: Number,
    default: 1
  },
  weatherConditions: {
    temperature: Number,
    humidity: Number,
    description: String,
    recordedAt: Date
  },
  relatedIssues: [{
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue'
    },
    relation: {
      type: String,
      enum: ['duplicate', 'related', 'parent', 'child']
    }
  }],
  workflowSteps: [{
    name: String,
    description: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending'
    },
    startedAt: Date,
    completedAt: Date,
    estimatedDuration: Number,
    actualDuration: Number
  }],
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyDetails: {
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical', 'catastrophic']
    },
    responseTime: Number,
    firstResponder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emergencyServices: [String]
  },
  publicEngagement: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    bookmarks: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      savedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  notifications: [{
    type: {
      type: String,
      enum: ['status_change', 'comment', 'assignment', 'escalation', 'resolution'],
      required: true
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    channels: [{
      type: String,
      enum: ['email', 'sms', 'push', 'in_app']
    }]
  }],
  metadata: {
    deviceInfo: {
      userAgent: String,
      platform: String,
      appVersion: String
    },
    submissionMethod: {
      type: String,
      enum: ['web', 'mobile', 'api', 'phone', 'email'],
      default: 'web'
    },
    ipAddress: String,
    sessionId: String
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
issueSchema.index({ location: '2dsphere' });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ assignedDepartment: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ status: 1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ updatedAt: -1 });
issueSchema.index({ 'address.city': 1, 'address.state': 1 });
issueSchema.index({ tags: 1 });
issueSchema.index({ isEmergency: 1 });
issueSchema.index({ escalationLevel: 1 });
issueSchema.index({ urgencyScore: -1 });

// Compound indexes
issueSchema.index({ status: 1, priority: 1, createdAt: -1 });
issueSchema.index({ assignedDepartment: 1, status: 1 });
issueSchema.index({ reportedBy: 1, status: 1, createdAt: -1 });

// Text index for search
issueSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'address.formatted': 'text'
});

// Virtual for vote score
issueSchema.virtual('voteScore').get(function() {
  return this.votes.upvotes - this.votes.downvotes;
});

// Virtual for total comments count
issueSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Virtual for followers count
issueSchema.virtual('followersCount').get(function() {
  return this.followers.length;
});

// Virtual for age in days
issueSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status history
issueSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this._currentUser || this.assignedTo,
      timestamp: new Date(),
      comment: this._statusChangeComment || 'Status updated'
    });
  }
  next();
});

// Pre-save middleware to calculate urgency score
issueSchema.pre('save', function(next) {
  if (this.isModified('priority') || this.isModified('category') || this.isNew) {
    let score = 0;

    // Priority weight
    switch (this.priority) {
      case 'critical': score += 40; break;
      case 'high': score += 30; break;
      case 'medium': score += 20; break;
      case 'low': score += 10; break;
    }

    // Emergency weight
    if (this.isEmergency) score += 30;

    // Age weight (newer issues get higher score)
    const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
    if (ageInHours <= 1) score += 20;
    else if (ageInHours <= 6) score += 15;
    else if (ageInHours <= 24) score += 10;
    else if (ageInHours <= 72) score += 5;

    // Public engagement weight
    const engagementScore = (this.votes.upvotes * 2) + this.followers.length + this.comments.length;
    score += Math.min(engagementScore * 0.1, 10);

    this.urgencyScore = Math.min(score, 100);
  }
  next();
});

// Instance method to add vote
issueSchema.methods.addVote = function(userId, voteType) {
  // Remove existing vote by this user
  this.votes.voters = this.votes.voters.filter(v => !v.user.equals(userId));

  // Add new vote
  this.votes.voters.push({
    user: userId,
    vote: voteType,
    votedAt: new Date()
  });

  // Recalculate vote counts
  this.votes.upvotes = this.votes.voters.filter(v => v.vote === 'up').length;
  this.votes.downvotes = this.votes.voters.filter(v => v.vote === 'down').length;

  return this.save();
};

// Instance method to remove vote
issueSchema.methods.removeVote = function(userId) {
  this.votes.voters = this.votes.voters.filter(v => !v.user.equals(userId));

  // Recalculate vote counts
  this.votes.upvotes = this.votes.voters.filter(v => v.vote === 'up').length;
  this.votes.downvotes = this.votes.voters.filter(v => v.vote === 'down').length;

  return this.save();
};

// Instance method to add follower
issueSchema.methods.addFollower = function(userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove follower
issueSchema.methods.removeFollower = function(userId) {
  this.followers = this.followers.filter(f => !f.equals(userId));
  return this.save();
};

// Instance method to add comment
issueSchema.methods.addComment = function(userId, text, isOfficial = false) {
  this.comments.push({
    user: userId,
    text: text,
    isOfficial: isOfficial,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return this.save();
};

// Static method to get nearby issues
issueSchema.statics.findNearby = function(coordinates, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Static method to get statistics
issueSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalIssues: { $sum: 1 },
        submittedIssues: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
        inProgressIssues: { $sum: { $cond: [{ $in: ['$status', ['assigned', 'in_progress']] }, 1, 0] } },
        resolvedIssues: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closedIssues: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        emergencyIssues: { $sum: { $cond: ['$isEmergency', 1, 0] } },
        highPriorityIssues: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        avgUrgencyScore: { $avg: '$urgencyScore' }
      }
    }
  ]);

  return stats[0] || {
    totalIssues: 0,
    submittedIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    closedIssues: 0,
    emergencyIssues: 0,
    highPriorityIssues: 0,
    avgUrgencyScore: 0
  };
};

module.exports = mongoose.model('Issue', issueSchema);
