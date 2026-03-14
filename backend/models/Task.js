/**
 * @module TaskModel
 * @description Mongoose schema and model for Task documents
 */
const mongoose = require('mongoose');

const TASK_STATUSES = ['pending', 'in-progress', 'completed'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 30;

const taskSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
      },
      default: 'pending',
    },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITIES,
        message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      validate: {
        validator(value) {
          if (!value) return true;
          return value > new Date();
        },
        message: 'Due date must be a future date',
      },
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [MAX_TAG_LENGTH, `Each tag must not exceed ${MAX_TAG_LENGTH} characters`],
        },
      ],
      validate: {
        validator(arr) {
          return arr.length <= MAX_TAGS;
        },
        message: `A task can have at most ${MAX_TAGS} tags`,
      },
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for common query patterns
taskSchema.index({ title: 1 });
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ dueDate: 1 }, { sparse: true });

/**
 * Remove empty tags before saving
 */
taskSchema.pre('save', function (next) {
  this.tags = this.tags.filter((tag) => tag.length > 0);
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
