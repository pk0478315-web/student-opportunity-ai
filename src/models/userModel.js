// ==========================================
// USER MODEL
// ==========================================
// Manages user accounts using the persistent database adapter.

const db = require("../config/db");

const findByEmail = async (email) => {
  return await db.findUserByEmail(email);
};

const findById = async (id) => {
  return await db.findUserById(id);
};

const createUser = async ({ email, password_hash, name }) => {
  return await db.createUser({ email, password_hash, name });
};

module.exports = {
  findByEmail,
  findById,
  createUser
};
