import { Schema, model, Document } from 'mongoose';

export enum StandupStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

// Basic markdown validation function
function validateMarkdown(content: string): boolean {
  if (typeof content !== 'string') {
    return false;
  }
  
  // Allow empty strings
  if (!content) {
    return true;
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

// Indexes for efficient querying
standupSchema.index({ userId: 1, createdAt: 1 });
standupSchema.index({ createdAt: 1 });
standupSchema.index({ status: 1 });

export const Standup = model<IStandup>('Standup', standupSchema);