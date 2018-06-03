const admin = require("firebase-admin");

const { serviceAccountKey } = require("./config");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  storageBucket: "pic-link-dev.appspot.com"
});
const functions = require("firebase-functions");
const db = admin.firestore();
const { findMatches } = require("./utils/kairos");
const { createNewImageDocs, updateDoc, assignUsersWMImages } = require("./utils/db");
const { createWaterMarkedImage } = require("./utils/image-magick");
const kairosGallery = "main";

exports.handlePhotographerUploads = functions.firestore
  .document("photographers/{photographerId}")
  .onUpdate((change, context) => {
    const prevImgs = change.before.data().uploadedImages;
    const currImgs = change.after.data().uploadedImages;

    if (currImgs.length > prevImgs.length) {
      const newImgs = currImgs.slice(prevImgs.length);
      return findMatches(newImgs, kairosGallery).then(imgsWithMatches =>
        createNewImageDocs(imgsWithMatches)
      );
    } else return null;
  });

exports.addWaterMarkedImage = functions.firestore
  .document("images/{imageId}")
  .onCreate((snap, ctx) => {
    return createWaterMarkedImage(snap.data().original)
      .then(waterMarkedImg => {
        console.log("success: ", waterMarkedImg);
        const params = { watermarked: waterMarkedImg };
        const { imageId } = ctx.params;
        return updateDoc("images", imageId, params);
      })
      .then(([docId]) => {
        console.log("updateDoc: ", docId);
        return assignUsersWMImages(docId);
      })
      .then(() => console.log("updated user images!"));
  });
