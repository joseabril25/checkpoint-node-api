import { Schema, model, Document, Types } from 'mongoose';

export enum StandupStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

export interface IStandup extends Document {
  userId: Types.ObjectId;
  date: Date;
  yesterday: string;
  today: string;
  blockers: string;
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
      maxlength: [1000, 'Yesterday field cannot exceed 1000 characters'],
    },
    today: {
      type: String,
      required: [true, 'Today field is required'],
      maxlength: [1000, 'Today field cannot exceed 1000 characters'],
    },
    blockers: {
      type: String,
      required: [true, 'Blockers field is required'],
      maxlength: [1000, 'Blockers field cannot exceed 1000 characters'],
      default: 'None',
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
    date.setHours(0, 0, 0, 0);
    this.date = date;
  }
  next();
});

export const Standup = model<IStandup>('Standup', standupSchema);