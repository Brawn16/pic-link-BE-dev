const { exec } = require("child-process-promise");
const path = require("path");
const os = require("os");
const fs = require("fs");
const admin = require("firebase-admin");

exports.createWaterMarkedImage = imagePath => {
  console.log("imagePath: ", imagePath);
  const bucket = admin.storage().bucket();
  const fileName = imageURL.match(/([^/]+$)/)[0];
  const metadata = { contentType: "image/jpeg" };
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, fileName);
  const tempLogoPath = path.join(tempDir, "logo.png");
  const destination = `/watermarked/${fileName}`;
  const logoPath = bucket.file("/logo/pic-link-logo1.png").name;

  return bucket
    .file(logoPath)
    .download({ destination: tempLogoPath })
    .then(() => bucket.file(imagePath).download({ destination: tempFilePath }))
    .then(() => {
      return exec(
        `composite -watermark 1% -gravity center ${tempLogoPath} ${tempFilePath} ${tempFilePath}`
      );
    })
    .then(() => {
      console.log("Image downloaded locally to", tempFilePath);
      return bucket.upload(tempFilePath, {
        destination,
        metadata
      });
    })
    .then(() => {
      console.log("uploaded to watermarked");
      const unlinkProms = [tempFilePath, tempLogoPath].map(file => fs.unlinkSync(file));
      const getURLProm = bucket.file(destination).getSignedUrl({
        action: "read",
        expires: "01-01-2019"
      });
      return Promise.all([getURLProm, unlinkProms]);
    })
    .then(([urlList]) => {
      return urlList[0];
    });
};
