const { exec } = require("child-process-promise");
const path = require("path");
const os = require("os");
const fs = require("fs");
const admin = require("firebase-admin");

exports.createWaterMarkedImage = imagePath => {
  const bucket = admin.storage().bucket();
  const fileName = imagePath.match(/([^/]+$)/)[0];
  const metadata = { contentType: "image/jpeg" };
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, fileName);
  const tempLogoPath = path.join(tempDir, "logo.png");
  const destination = `/watermarked/${fileName}`;
  const logoPath = bucket.file("/logo/pic-link-logo.png").name;
  const imgFullPath = bucket.file(imagePath).name;

  return bucket
    .file(logoPath)
    .download({ destination: tempLogoPath })
    .then(() => bucket.file(imgFullPath).download({ destination: tempFilePath }))
    .then(() => {
      return exec(
        `composite -watermark 30% -gravity center ${tempLogoPath} ${tempFilePath} ${tempFilePath}`
      );
    })
    .then(() => {
      return bucket.upload(tempFilePath, {
        destination,
        metadata
      });
    })
    .then(() => {
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
