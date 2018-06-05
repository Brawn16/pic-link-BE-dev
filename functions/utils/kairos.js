const {
  kairosConfig: { appId, appKey }
} = require("../config");

const Kairos = require("kairos-api");
const client = new Kairos(appId, appKey);
const { removeDuplicates } = require("./helpers");

const matchFacesToPic = (image, gallery_name) => {
  return client
    .recognize({ image, gallery_name })
    .then(matchDocs => {
      console.log("matchDocs: ", matchDocs);
      const matchedUserIds = matchDocs.body.Errors
        ? []
        : matchDocs.body.images.reduce((acc, img) => {
            if (img.candidates) img.candidates.forEach(c => acc.push(c.subject_id));
            return acc;
          }, []);
      return {
        imageURL: image,
        matchedUserIds: removeDuplicates(matchedUserIds)
      };
    })
    .catch(console.log);
};

exports.findMatches = (imageArr, gallery_name) => {
  return Promise.all(imageArr.map(url => matchFacesToPic(url, gallery_name)));
};

exports.enroll = params => client.enroll(params);

exports.removeGallery = gallery_name =>
  client.galleryRemove({
    gallery_name
  });
