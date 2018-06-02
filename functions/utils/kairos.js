const { appId, appKey } = require("../config");

const Kairos = require("kairos-api");
const client = new Kairos(appId, appKey);

const matchFacesToPic = (image, gallery_name) => {
  return client
    .recognize({ image, gallery_name })
    .then(matchDocs => {
      const matchedUserIds = matchDocs.body.images.reduce((acc, img) => {
        if (img.candidates) img.candidates.forEach(c => acc.push(c.subject_id));
        return acc;
      }, []);
      return {
        imageURL: image,
        matchedUserIds
      };
    })
    .catch(console.log);
};

exports.findMatches = (imageArr, gallery_name) => {
  return Promise.all(imageArr.map(url => matchFacesToPic(url, gallery_name)));
};
