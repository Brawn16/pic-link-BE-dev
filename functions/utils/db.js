const db = require("firebase-admin").firestore();

const createImageDoc = imageObj => {
  const { matchedUserIds, localPath } = imageObj;
  return db.collection("images").add({
    original: imageObj.imageURL,
    localPath,
    matchedUserIds
  });
};

exports.createUserDoc = (uid, email) => {
  if (email === "photographer@piclink.com") {
    return db
      .collection("photographers")
      .doc(uid)
      .set({ uploadedImages: [] });
  } else {
    return db
      .collection("users")
      .doc(uid)
      .set({
        profilePic: "",
        matchedImages: {
          watermarked: [],
          purchased: []
        }
      });
  }
};

exports.updateUserImages = (doc, userId, field) => {
  const images = Array.isArray(doc) ? doc : [doc];
  const userRef = db.collection("users").doc(userId);
  return userRef.get().then(snap => {
    if (!snap.data()) return null;
    const currImgs = snap.data().matchedImages[field];
    return userRef.set(
      { matchedImages: { [field]: [...currImgs, ...images] } },
      { merge: true }
    );
  });
};

exports.createNewImageDocs = images => {
  return Promise.all(images.map(img => createImageDoc(img)));
};

exports.updateDoc = (collection, docId, params) => {
  const ref = db.collection(collection).doc(docId);
  return Promise.all([docId, ref.set(params, { merge: true })]);
};

exports.updateDocArray = (collection, docId, prop, item) => {
  const ref = db.collection(collection).doc(docId);
  return ref.get().then(doc => {
    const currArr = doc.data()[prop];
    return ref.set({ [prop]: [...currArr, item] }, { merge: true });
  });
};

exports.assignUsersWMImages = imageId => {
  return db
    .collection("images")
    .doc(imageId)
    .get()
    .then(doc => {
      const { matchedUserIds } = doc.data();
      const image = { imageId, path: doc.data().watermarked };

      return Promise.all(
        matchedUserIds.map(uid => this.updateUserImages(image, uid, "watermarked"))
      );
    });
};

exports.getPathsForAllImgs = imgType => {
  return db
    .collection("images")
    .get()
    .then(query => {
      return query.docs.map(imgDoc => imgDoc.data()[imgType]);
    });
};

exports.findWaterMarkedByOriginal = originalPath => {
  console.log("originalPath: ", originalPath);
  const ref = db.collection("images");
  return ref
    .where("original", "==", originalPath)
    .get()
    .then(query => {
      const imageId = query.docs[0]._ref.id;
      const path = query.docs[0].data().watermarked;
      return { imageId, path };
    });
};
