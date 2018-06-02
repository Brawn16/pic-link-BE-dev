const spawn = require("child-process-promise").spawn;
const db = require("firebase-admin").firestore();
const path = require("path");
const os = require("os");

exports.createWaterMarkedImage = imageURL => {
  const splitURL = imageURL.split("/");
  const tempFilePath = path.join(os.tmpdir(), "watermarked");
  const storageRef = firebase
    .storage()
    .ref()
    .child(`watermarked/${splitURL[0]}`);
  return spawn("convert", [imageURL, "-thumbnail", "200x200>", tempFilePath]).then(() => {
    return storageRef.put(tempFilePath);
  });
};
