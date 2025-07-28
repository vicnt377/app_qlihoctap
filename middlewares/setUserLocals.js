// middleware/setUserLocals.js
function setUserLocals(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
  } else {
    res.locals.user = null;
  }
  next();
}

module.exports = { setUserLocals };
