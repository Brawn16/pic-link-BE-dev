const admin = require("firebase-admin");

const serviceAccount = require("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "pic-link-dev.appspot.com"
});
const functions = require("firebase-functions");
const db = admin.firestore();
const { findMatches } = require("./utils/kairos");
const { createNewImageDocs } = require("./utils/db");
const { createWaterMarkedImage } = require("./utils/image-magick");
const kairosGallery = "main";

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

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
    // matchImages;
    // createNewImageDoc;
    // createWatermarkedVersion;
    // updateUserImages;
  });

exports.addWaterMarkedImage = functions.firestore
  .document("images/{imageId}")
  .onCreate((snap, ctx) => {
    return createWaterMarkedImage(snap.data().original).then(waterMarkedImg => {
      console.log("success: ", waterMarkedImg);
      return null;
    });
  });
