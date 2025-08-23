exports.badRequest = (message, details) => {
  const e = new Error(message || "Bad request");
  e.status = 400;
  e.code = "BAD_REQUEST";
  e.details = details;
  return e;
};
