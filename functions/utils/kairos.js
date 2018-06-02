const { appId, appKey } = require("../config");

const Kairos = require("kairos-api");
const client = new Kairos(appId, appKey);

exports.findMatches = (image, gallery_name) => {
  return client
    .recognize({ image, gallery_name })
    .then(matchDocs => {
      console.log("matchDocs: ", matchDocs);
      return null;
    })
    .catch(console.log);
};
