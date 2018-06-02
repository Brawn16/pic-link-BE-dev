const spawn = require("child-process-promise").spawn;
const path = require("path");
const os = require("os");
const fs = require("fs");
const admin = require("firebase-admin");

exports.createWaterMarkedImage = imageURL => {
  const bucket = admin.storage().bucket();
  const fileName = imageURL.match(/([^/]+$)/)[0];
  const metadata = { contentType: "image/jpeg" };
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const destination = `/watermarked/${fileName}`;
  return spawn("convert", [imageURL, "-resize", "100x100", tempFilePath])
    .then(() => {
      console.log("Image downloaded locally to", tempFilePath);
      return bucket.upload(tempFilePath, {
        destination,
        metadata
      });
    })
    .then(() => {
      console.log("uploaded to watermarked");
      const unlinkProm = fs.unlinkSync(tempFilePath);
      const getURLProm = bucket.file(destination).getSignedUrl({
        action: "read",
        expires: "01-01-2019"
      });
      return Promise.all([getURLProm, unlinkProm]);
    })
    .then(([urlList]) => {
      return urlList[0];
    });
};
