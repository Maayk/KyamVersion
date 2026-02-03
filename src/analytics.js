const { app } = require('electron');

let userId = 'anonymous';
let sessionId = generateSessionId();

function generateSessionId() {
  return 'session_' + Date.now();
}

function trackEvent() {
}

function _trackEvent() {
}

function initialize() {
}

function updateUserProperties() {
}

module.exports = {
  trackEvent,
  _trackEvent,
  initialize,
  updateUserProperties,
  userId,
  sessionId
};
