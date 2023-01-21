const express = require("express");
const saltedMd5 = require("salted-md5");
const path = require("path");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const serviceAccount = require("../Firebase/functions/serviceAccountKey.json");
const admin = require("firebase-admin");
const app = express();
app.use(express.urlencoded());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://fir-demo-1-84ec3-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "gs://fir-demo-1-84ec3.appspot.com",
});
app.locals.bucket = admin.storage().bucket();

app.post("/upload", upload.single("file"), async (req, res) => {
  const name = saltedMd5(req.file.originalname, "SUPER-S@LT!");
  const fileName = path.extname(req.file.originalname);
  await app.locals.bucket
    .file(fileName)
    .createWriteStream()
    .end(req.file.buffer);
  res.send("done");
});

app.listen(3000, () => {
  console.log("App is running on 3000");
});
