const functions = require("firebase-functions");
const admin = require("firebase-admin").initializeApp();
const db = admin.firestore();
const { findMatches } = require("./utils/kairos");
const { createNewImageDocs } = require("./utils/db");
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
      return findMatches(newImgs, kairosGallery)
        .then(imgsWithMatches => {
          return createNewImageDocs(imgsWithMatches);
        })
        .then(imgDocRefs => {
          console.log(imgDocRefs);
          return null;
        });
    } else return null;
    // matchImages;
    // createNewImageDoc;
    // createWatermarkedVersion;
    // updateUserImages;
  });
