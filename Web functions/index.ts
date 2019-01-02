import * as functions from 'firebase-functions';

import * as Storage from '@google-cloud/storage';
const gcs = new Storage();

import { tmpdir, endianness } from 'os';
import { join, dirname } from 'path';

import * as sharp from 'sharp';
import * as fs from 'fs-extra';

import * as admin from 'firebase-admin';

export const generateThumbs = functions.storage
  .object()
  .onFinalize(async object => {
    const bucket = gcs.bucket(object.bucket);
    const filePath = object.name;
    const fileName = filePath.split('/').pop();
    const bucketDir = dirname(filePath);

    const workingDir = join(tmpdir(), 'thumbs');
    const tmpFilePath = join(workingDir, fileName);
    console.log("working dir: " + tmpFilePath)

    if (fileName.includes('thumb@') || !object.contentType.includes('image')) {
      console.log('exiting function');
      return false;
    }

    // 1. Ensure thumbnail dir exists
    await fs.ensureDir(workingDir);

    // 2. Download Source File
    await bucket.file(filePath).download({
      destination: tmpFilePath
    });

    // 3. Resize the images and define an array of upload promises
    const sizes = [256];

    const uploadPromises = sizes.map(async size => {
      const thumbName = `thumb@${size}_${fileName}`;
      const thumbPath = join(workingDir, thumbName);

      // Resize source image
      await sharp(tmpFilePath)
        .resize(size, size)
        .toFile(thumbPath);

      // Upload to GCS
      return bucket.upload(thumbPath, {
        destination: join(bucketDir, "thumbs/" + thumbName)
      });
    });

    // 4. Run the upload operations
    await Promise.all(uploadPromises);

    // 5. Cleanup remove the tmp/thumbs from the filesystem
    return fs.remove(workingDir);
  });

export const oneTimeGen = functions.https.onRequest((req, res) => {
  console.log("Trigger");


  admin.initializeApp({
    credential: admin.credential.cert({
      //REDACTED//

  });

  var storage1 = admin.storage().bucket();
  //var storageRef = storage1.ref();
  //console.log(storage1);
  var db = admin.firestore();
  var imageRef = db.collection('images');
  var final = "test";
  var allImages = imageRef.get()
    .then(snapshot => {//handle databases
      snapshot.forEach(async doc => {
        final = doc.id;
        const bucket =storage1
        const filePath = doc.id;
        const fileName = filePath.split('/').pop();
        const bucketDir = dirname(filePath);

        const workingDir = join(tmpdir(), 'thumbs');
        const tmpFilePath = join(workingDir, fileName);
        //console.log("working dir: " + tmpFilePath)

        if (fileName.includes('thumb@') || !doc.data().metadata.contentType.includes('image')) {
          console.log('exiting function');
          return false;
        }

        try{

        // 1. Ensure thumbnail dir exists
        await fs.ensureDir(workingDir);

        // 2. Download Source File
        await bucket.file(filePath).download({
          destination: tmpFilePath
        });

        // 3. Resize the images and define an array of upload promises
        const sizes = [256];

        const uploadPromises = sizes.map(async size => {
          const thumbName = `thumb@${size}_${fileName}`;
          const thumbPath = join(workingDir, thumbName);

          // Resize source image
          await sharp(tmpFilePath)
            .resize(size, size)
            .toFile(thumbPath);

          // Upload to GCS
          return bucket.upload(thumbPath, {
            destination: join(bucketDir, "thumbs/" + thumbName)
          });
        });

        // 4. Run the upload operations
        await Promise.all(uploadPromises);
        console.log("success")
        // 5. Cleanup remove the tmp/thumbs from the filesystem
        return fs.remove(workingDir);

      }catch(e){
        console.log("Failed")
        console.log(e)
      }
      })

    })
});