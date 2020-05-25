const { omit } = require("lodash");

const { Member } = require("./member.model");

/**
 * Get member
 * @public
 */
exports.get = async (id) => Member.get(id);

/**
 * Get logged in member info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.member.transform());

/**
 * Create new member
 * @public
 */
exports.create = async (userData) => {
  try {
    const member = Member.build(userData);
    const savedUser = await member.save();
    return Member.transform(savedUser);
  } catch (error) {
    throw Member.checkDuplicateEmail(error);
  }
};

/**
 * Replace existing member
 * @public
 */
exports.replace = async (member, newUserData) => {
  try {
    const newUser = new Member(newUserData);
    const ommitRole = member.role !== "admin" ? "role" : "";
    const newUserObject = omit(newUser.toObject(), "id", ommitRole);

    await member.update(newUserObject, { override: true, upsert: true });
    const savedUser = await Member.findById(member.id);

    return savedUser.transform();
  } catch (error) {
    throw Member.checkDuplicateEmail(error);
  }
};

/**
 * Update existing member
 * @public
 */
exports.update = async (member, updatedData) => {
  try {
    const ommitRole = member.role !== "admin" ? "role" : "";
    const userTobeUpdated = omit(updatedData, ommitRole);
    const updatedUser = Object.assign(member, userTobeUpdated);
    const savedUser = await updatedUser.save();
    return savedUser.transform();
  } catch (error) {
    throw Member.checkDuplicateEmail(error);
  }
};

/**
 * Get member list
 * @public
 */
exports.list = async (params) => {
  try {
    const users = await Member.list(params);
    const transformedUsers = users.map((member) => member.transform());
    return transformedUsers;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete member
 * @public
 */
exports.remove = async (member) => member.remove();
