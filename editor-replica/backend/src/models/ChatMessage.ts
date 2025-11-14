import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IChatMessage extends MongooseDocument {
  docId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    docId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of chat history
ChatMessageSchema.index({ docId: 1, createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
