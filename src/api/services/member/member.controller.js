const httpStatus = require("http-status");
const service = require("./member.service");
const { handler: errorHandler } = require("../../middlewares/error");

/**
 * Load member and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const member = await service.get(id);
    req.locals = { member };
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * Get member
 * @public
 */
exports.get = (req, res) => res.json(req.locals.member.transform());

/**
 * Get logged in member info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.member.transform());

/**
 * Create new member
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const response = await service.create(req.body);
    return res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Replace existing member
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { member } = req.locals;
    const response = await service.replace(member, req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update existing member
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const { member } = req.locals;
    const response = await service.updateOne(member, req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get member list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const response = await service.list(req.query);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete member
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    const { member } = req.locals;
    await service.deleteOne(member);
    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};
