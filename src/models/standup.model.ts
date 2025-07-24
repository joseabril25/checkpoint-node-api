import { Schema, model, Document } from 'mongoose';

export enum StandupStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

// Basic markdown validation function
function validateMarkdown(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Basic markdown syntax validation
  // Check for unmatched brackets, parentheses, and basic syntax
  const brackets = content.match(/\[/g)?.length || 0;
  const closeBrackets = content.match(/\]/g)?.length || 0;
  const parens = content.match(/\(/g)?.length || 0;
  const closeParens = content.match(/\)/g)?.length || 0;
  
  // Check for basic markdown syntax violations
  if (brackets !== closeBrackets || parens !== closeParens) {
    return false;
  }

  // Check for invalid link syntax
  if (content.includes('](') && !content.match(/\[.*?\]\(.*?\)/)) {
    return false;
  }

  // Check for invalid image syntax
  if (content.includes('![') && !content.match(/!\[.*?\]\(.*?\)/)) {
    return false;
  }

  return true;
}

export interface IStandup extends Document {
  userId: Schema.Types.ObjectId | string;
  date: Date;
  yesterday: string;
  today: string;
  blockers?: string;
  status: StandupStatus;
  createdAt: Date;
  updatedAt: Date;
}

const standupSchema = new Schema<IStandup>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function (date: Date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);

          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);

          return date >= sevenDaysAgo && date < tomorrow;
        },
        message: 'Date must be within the last 7 days and not in the future',
      },
    },
    yesterday: {
      type: String,
      required: [true, 'Yesterday field is required'],
      maxlength: [2000, 'Yesterday field cannot exceed 2000 characters'],
      validate: {
        validator: validateMarkdown,
        message: 'Yesterday field contains invalid markdown syntax',
      },
    },
    today: {
      type: String,
      required: [true, 'Today field is required'],
      maxlength: [2000, 'Today field cannot exceed 2000 characters'],
      validate: {
        validator: validateMarkdown,
        message: 'Today field contains invalid markdown syntax',
      },
    },
    blockers: {
      type: String,
      maxlength: [2000, 'Blockers field cannot exceed 2000 characters'],
      default: 'None',
      validate: {
        validator: validateMarkdown,
        message: 'Blockers field contains invalid markdown syntax',
      },
    },
    status: {
      type: String,
      enum: Object.values(StandupStatus),
      default: StandupStatus.DRAFT,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Compound unique index - one standup per user per day
standupSchema.index({ userId: 1, date: 1 }, { unique: true });
standupSchema.index({ date: 1, createdAt: 1 });
standupSchema.index({ status: 1 });

// Middleware to normalize date to start of day
standupSchema.pre('save', function (next) {
  if (this.date) {
    const date = new Date(this.date);
    date.setUTCHours(0, 0, 0, 0);
    this.date = date;
  }
  next();
});

export const Standup = model<IStandup>('Standup', standupSchema);