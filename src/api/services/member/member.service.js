const { omit } = require("lodash");
const member = require("./member.model");
// const { handler: errorHandler } = require('../../middlewares/error');

/**
 * Load member and append to req.
 * @public
 */
// exports.load = async (req, res, next, id) => {
// try {
//   console.log(12);
//   const member = await member.get(id);
//   req.locals = { member };
//   return next();
// } catch (error) {
//   return errorHandler(error, req, res);
// }
// };

/**
 * Get member
 * @public
 */
exports.get = async id => member.get(id);

/**
 * Get logged in member info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.member.transform());

/**
 * Create new member
 * @public
 */
exports.create = async memberData => {
  try {
    const member = new member(memberData);
    const savedmember = await member.save();
    return savedmember.transform();
  } catch (error) {
    throw member.checkDuplicateEmail(error);
  }
};

/**
 * Replace existing member
 * @public
 */
exports.replace = async (member, newmemberData) => {
  try {
    const newmember = new member(newmemberData);
    const ommitRole = member.role !== "admin" ? "role" : "";
    const newmemberObject = omit(newmember.toObject(), "_id", ommitRole);

    await member.update(newmemberObject, { override: true, upsert: true });
    const savedmember = await member.findById(member._id);

    return savedmember.transform();
  } catch (error) {
    throw member.checkDuplicateEmail(error);
  }
};

/**
 * Update existing member
 * @public
 */
exports.update = async (member, updatedData) => {
  try {
    const ommitRole = member.role !== "admin" ? "role" : "";
    const memberTobeUpdated = omit(updatedData, ommitRole);
    const updatedmember = Object.assign(member, memberTobeUpdated);
    const savedmember = await updatedmember.save();
    return savedmember.transform();
  } catch (error) {
    throw member.checkDuplicateEmail(error);
  }
};

/**
 * Get member list
 * @public
 */
exports.list = async params => {
  try {
    const members = await member.list(params);
    const transformedmembers = members.map(member => member.transform());
    return transformedmembers;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete member
 * @public
 */
exports.remove = async member => member.remove();
