// Zoom API Configuration
require('dotenv').config();

module.exports = {
  accountId: process.env.ZOOM_ACCOUNT_ID,
  clientId: process.env.ZOOM_CLIENT_ID,
  clientSecret: process.env.ZOOM_CLIENT_SECRET,
  apiBaseUrl: 'https://api.zoom.us/v2',
  oauthUrl: 'https://zoom.us/oauth/token'
};
