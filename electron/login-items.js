'use strict';

const HIDDEN_LOGIN_ARGUMENT = '--oisym-hidden';
function loginQuery(platform = process.platform) {
  return platform === 'win32' ? { args: [HIDDEN_LOGIN_ARGUMENT] } : {};
}
function loginOptions(enabled, platform = process.platform) {
  return platform === 'win32'
    ? { openAtLogin: enabled, ...loginQuery(platform) }
    : { openAtLogin: enabled, openAsHidden: enabled };
}
module.exports = { HIDDEN_LOGIN_ARGUMENT, loginQuery, loginOptions };
