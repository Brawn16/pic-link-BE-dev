const db = require("firebase-admin").firestore();

const createImageDoc = imageObj => {
  const { matchedUserIds } = imageObj;
  return db.collection("images").add({
    original: imageObj.imageURL,
    matchedUserIds
  });
};

exports.updateUserImages = (imagePath, userId, field) => {
  const userRef = db.collection("users").doc(userId);
  return userRef.get().then(doc => {
    const currImgs = doc.data().matchedImages[field];
    return userRef.set({ matchedImages: { [field]: [...currImgs, imagePath] } });
  });
};

exports.createNewImageDocs = images => {
  return Promise.all(images.map(img => createImageDoc(img)));
};

exports.updateDoc = (collection, docId, params) => {
  const ref = db.collection(collection).doc(docId);
  return Promise.all([docId, ref.set(params, { merge: true })]);
};

exports.assignUsersWMImages = imageId => {
  return db
    .collection("images")
    .doc(imageId)
    .get()
    .then(doc => {
      const { matchedUserIds } = doc.data();
      const imagePath = doc.data().watermarked;

      return Promise.all(
        matchedUserIds.map(uid => this.updateUserImages(imagePath, uid, "watermarked"))
      );
    });
};
