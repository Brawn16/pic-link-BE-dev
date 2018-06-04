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
  updateDocArray,
  updateUserImages,
  assignUsersWMImages,
  getPathsForAllImgs,
  findWaterMarkedByOriginal,
  createUserDoc,
  getDownloadURL
} = require("./utils/db");
const { createWaterMarkedImage } = require("./utils/image-magick");

const kairosGallery = "main";

exports.insertUserInDB = functions.auth.user().onCreate(ev => {
  return createUserDoc(ev.uid, ev.email).then(() => "user inserted");
});

exports.handleStorageUploads = functions.storage.object().onFinalize(ev => {
  const filePath = ev.name;
  const arr = filePath.split("/");
  const [collection, uid, path] = arr.slice(arr.length - 3);
  console.log("collection: ", collection);
  console.log("uid: ", uid);
  console.log("filePath: ", filePath);

  return admin
    .storage()
    .bucket()
    .file(filePath)
    .getSignedUrl({
      action: "read",
      expires: "01-01-2019"
    })
    .then(([url]) => {
      if (collection === "users") return updateDoc(collection, uid, url);
      else if (collection === "photographers")
        return updateDocArray(collection, uid, "uploadedImages", { localPath: filePath, url });
      return null;
    });
});

exports.handlePhotographerUploads = functions.firestore
  .document("photographers/{photographerId}")
  .onUpdate(change => {
    const prevImgs = change.before.data().uploadedImages;
    const currImgs = change.after.data().uploadedImages;

    if (currImgs.length > prevImgs.length) {
      const newImgs = currImgs.slice(prevImgs.length);
      const urls = newImgs.map(img => img.url);
      return findMatches(urls, kairosGallery).then(imgsWithMatches => {
        imgsWithMatches.forEach((imgObj, i) => (imgObj.localPath = newImgs[i].localPath));
        return createNewImageDocs(imgsWithMatches);
      });
    } else return null;
  });

exports.addWaterMarkedImage = functions.firestore
  .document("images/{imageId}")
  .onCreate((snap, ctx) => {
    if (snap.data().watermarked) return null;
    const { original } = snap.data();
    const { imageId } = ctx.params;
    return createWaterMarkedImage(original, imageId)
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
    if (!event.after.exists) return null;
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
        .then(imgList => {
          const matches = imgList.filter(img => img.matchedUserIds.length);
          return Promise.all(matches.map(match => findWaterMarkedByOriginal(match.imageURL)));
        })
        .then(waterMarkedImgs => updateUserImages(waterMarkedImgs, userId, "watermarked"))
        .then(() => removeGallery(userId))
        .then(() => {
          params.gallery_name = kairosGallery;
          return enroll(params);
        });
    }

    return null;
  });
