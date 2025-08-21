exports.me = (req, res) => {
  const { uid, email, name } = req.user;
  res.json({ uid, email, name: name || null });
};
