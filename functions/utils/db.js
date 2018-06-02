const db = require("firebase-admin").firestore();

const createImageDoc = imageObj => {
  const { matchedUserIds } = imageObj;
  return db.collection("images").add({
    original: imageObj.imageURL,
    matchedUserIds
  });
};

exports.createNewImageDocs = images => {
  return Promise.all(images.map(img => createImageDoc(img)));
};
