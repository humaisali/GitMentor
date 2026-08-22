import mongoose from 'mongoose';

const oauthStateSchema = new mongoose.Schema(
  {
    stateHash: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    returnTo: { type: String, default: '/settings' },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

const OAuthState = mongoose.model('OAuthState', oauthStateSchema);
export default OAuthState;
