const {
  kairosConfig: { appId, appKey }
} = require("../config");

const Kairos = require("kairos-api");
const client = new Kairos(appId, appKey);

const deleteAllGalleries = () =>
  client
    .galleryListAll()
    .then(({ body: { gallery_ids } }) => {
      const prms = gallery_ids.map(gallery_name => client.galleryRemove({ gallery_name }));
      return Promise.all(prms);
    })
    .then(() => {
      return client.galleryListAll();
    })
    .then(console.log)
    .catch(console.log);

const removeOneGallery = gallery_name =>
  client
    .galleryRemove({
      gallery_name
    })
    .then(res => console.log(res));

findMatches = (image, gallery_name) => {
  return client
    .recognize({ image, gallery_name })
    .then(matchDocs => {
      console.log("matches: ", matchDocs);
      return null;
    })
    .catch(console.log);
};

//findMatches("http://radustefan.net/proj2/IMG_5155.JPG", "main");

//client.galleryListAll().then(console.log);

//client.galleryView({ gallery_name: "main" }).then(console.log);

// const params = {
//   image: "http://radustefan.net/proj/IMG_5076.JPG",
//   subject_id: "raduUserId",
//   gallery_name: "main"
// };
// client
//   .enroll(params)
//   .then(console.log)
//   .catch(console.log);
