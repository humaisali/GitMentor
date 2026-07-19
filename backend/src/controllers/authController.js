import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gitmentor-dev-secret-key';

// @desc    Redirect user to GitHub OAuth
// @route   GET /api/auth/github
// @access  Public
// (Handled by passport middleware in routes)

// @desc    GitHub OAuth callback handler
// @route   GET /api/auth/github/callback
// @access  Public
export const githubCallback = (req, res) => {
  // User is now authenticated and available on req.user
  const token = jwt.sign(
    { id: req.user._id, username: req.user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Redirect to frontend with the JWT token as a query parameter
  res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
};

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      _id: req.user._id,
      username: req.user.username,
      avatarUrl: req.user.avatarUrl,
      githubId: req.user.githubId,
      googleId: req.user.googleId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};
