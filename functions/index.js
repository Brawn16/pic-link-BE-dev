const admin = require("firebase-admin");

const { serviceAccountKey } = require("./config");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  storageBucket: "pic-link-dev.appspot.com"
});

const functions = require("firebase-functions");
const db = admin.firestore();
const { findMatches, enroll, removeGallery } = require("./utils/kairos");
const {
  createNewImageDocs,
  updateDoc,
  updateUserImages,
  assignUsersWMImages,
  getPathsForAllImgs,
  findWaterMarkedByOriginal
} = require("./utils/db");
const { createWaterMarkedImage } = require("./utils/image-magick");

const kairosGallery = "main";

exports.handlePhotographerUploads = functions.firestore
  .document("photographers/{photographerId}")
  .onUpdate(change => {
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

exports.enrollUserProfilePic = functions.firestore
  .document("users/{userId}")
  .onWrite((event, ctx) => {
    if (event.before) if (!event.after.exists) return null;
    const { userId } = ctx.params;
    const currImg = event.after.data().profilePic;
    const prevImg = event.before.exists ? event.before.data().profilePic : "";

    if (currImg !== prevImg) {
      const params = {
        image: currImg,
        subject_id: userId,
        gallery_name: userId
      };
      return enroll(params)
        .then(data => getPathsForAllImgs("original"))
        .then(images => findMatches(images, userId))
        .then(matches =>
          Promise.all(matches.map(match => findWaterMarkedByOriginal(match.imageURL)))
        )
        .then(waterMarkedImgs => updateUserImages(waterMarkedImgs, userId, "watermarked"))
        .then(() => removeGallery(userId))
        .then(() => {
          params.gallery_name = kairosGallery;
          return enroll(params);
        });
    }

    return null;
  });
