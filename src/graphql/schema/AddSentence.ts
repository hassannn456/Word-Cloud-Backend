import { UUID } from 'mongodb';
import mongoose, { Schema } from 'mongoose';

const addSentenceSchema = new Schema({
  _id: UUID,
  name: String,
}, {
  timestamps: true
});

const AddSentenceModel = mongoose.model('add_sentence', addSentenceSchema);

export default AddSentenceModel;
