// src/controllers/me.controller.js
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user ?? null; // set by auth middleware if you have it
    res.status(200).json({ status: "ok", user });
  } catch (err) {
    next(err);
  }
};
