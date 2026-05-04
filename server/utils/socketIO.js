/**
 * Singleton helper to share the Socket.IO instance across controllers
 * without circular-requiring server.js.
 *
 * Usage:
 *   In server.js  → require('./utils/socketIO').setIO(io);
 *   Everywhere else → const { getIO } = require('../utils/socketIO');
 */

let _io = null;

const setIO = (io) => { _io = io; };
const getIO = () => _io;

module.exports = { setIO, getIO };
