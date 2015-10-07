'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/dictofullstack-dev'
  },

  seedDB: true,
  flickrOptions : {
      api_key: "af1f3c215dad7e426b2e6809d7c0d5cd",
      secret: "b88c9ed38866da75",
      user_id: "135281724@N06",
      access_token: "72157656408405498-78cb0caa7486bdde",
      access_token_secret: "96ec95a7c294fa9f"
    }
};
