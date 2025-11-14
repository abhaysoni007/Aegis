import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  docId: string;
  name: string;
  path: string[];
  content?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

const DocumentSchema: Schema = new Schema(
  {
    docId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    path: {
      type: [String],
      default: [],
    },
    content: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDocument>('Document', DocumentSchema);
