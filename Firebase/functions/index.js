const functions = require("firebase-functions");
const admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
const FirebaseDynamicLinks = require("firebase-dynamic-links");
const Busboy = require("busboy");
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

// const FirebaseStorage = require('multer-firebase-storage')

// const fbI = admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     storageBucket: "gs://fir-demo-1-84ec3.appspot.com"
// });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://fir-demo-1-84ec3-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "gs://fir-demo-1-84ec3.appspot.com",
});

const bucket = admin.storage().bucket();

const app = express();
app.use(express.json({ extended: true, limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
// app.use(bodyParser.text({
//     type: '/'
// }))

// app.use(bodyParser.json())
// main database ref
const db = admin.firestore();

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     console.log(req);
//     console.log(file);
//     cb(null, "./public/img");
//   },
//   filename: function (req, file, cb) {
//     console.log(req);
//     console.log(file);
//     cb(null, Date.now() + "." + file.originalname.split(".")[1]);
//   },
// });

// const uploadImg = multer({ storage: storage });

// routes
app.get("/", (req, res) => {
  return res.status(200).send("HEllo");
});
// Create ->  post()
app.post("/api/create", (req, res) => {
  console.log("res")(async () => {
    try {
      await db.collection("userDetails").doc(`/${Date.now()}/`).create({
        id: Date.now(),
        name: req.body.name,
        mobile: req.body.mobile,
        address: req.body.address,
      });
      return res.status(200).send({ success: true, message: "Data Saved" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ success: false, message: error });
    }
  })();
});
// get -> get()
// Fetch - data from specific id
app.get("/api/get/:id", (req, res) => {
  (async () => {
    try {
      const reqDoc = db.collection("userDetails").doc(req.params.id);
      let userDetail = await reqDoc.get();
      let response = userDetail.data();
      return res
        .status(200)
        .send({ success: true, message: "Data Found", data: response });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ success: false, message: error });
    }
  })();
});
// Fetch - all daTA
app.get("/api/getAll", (req, res) => {
  (async () => {
    try {
      const reqDoc = db.collection("userDetails");
      let response = [];

      await reqDoc.get().then((data) => {
        let docs = data.docs;

        docs.map((doc) => {
          const selectedItem = {
            name: doc.data().name,
            mobile: doc.data().mobile,
            address: doc.data().address,
          };
          response.push(selectedItem);
        });
      });
      return res.status(200).send({
        success: true,
        message: "Data Found",
        data: response,
        length: response.length,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ success: false, message: error });
    }
  })();
});

// Update -> put()
app.put("/api/update/:id", (req, res) => {
  (async () => {
    try {
      const reqDoc = db.collection("userDetails").doc(req.params.id);
      await reqDoc.update({
        name: req.body.name,
        mobile: req.body.mobile,
        address: req.body.address,
      });
      return res.status(200).send({ success: true, message: "Data Updated" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ success: false, message: error });
    }
  })();
});

// delete -> delete()
app.delete("/api/delete/:id", (req, res) => {
  (async () => {
    try {
      const reqDoc = db.collection("userDetails").doc(req.params.id);
      await reqDoc.delete();
      return res.status(200).send({ success: true, message: "Data Removed" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ success: false, message: error });
    }
  })();
});

//Authentication
app.post("/api/signup", (req, res) => {
  (async () => {
    try {
      let reqBody = {
        email: req.body.email,
        password: req.body.password,
      };
      const useres = await admin.auth().createUser({
        email: reqBody.email,
        password: reqBody.password,
        emailVerified: false,
        disabled: false,
      });

      console.log(useres);

      // return res.json(useres)

      return res
        .status(200)
        .send({ success: true, message: "User Signup", data: useres });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ success: false, message: error });
    }
  })();
});

// /:uuid
app.post("/api/signin", (req, res) => {
  (async () => {
    try {
      console.log(req.body.email);
      // if we want sign in via mail
      const useres = await admin.auth().getUserByEmail(req.body.email);
      console.log("users", useres);

      // const users = await admin.auth().getUser(req.params.uuid)
      return res
        .status(200)
        .send({ success: true, message: "User Signin", data: useres });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ success: false, message: error });
    }
  })();
});

// Messaging
app.post("/api/sendNotification", (req, res) => {
  // var notifi ={
  //     'title':"testing-1",
  //     'text': "testing",
  // };
  // var fcm_token = []

  // var notification_body={
  //     'notification':notifi,
  //     'registration_ids':fcm_token,
  // }
  var payload = {
    notification: {
      title: "This is a Notification",
      body: "This is the body of the notification message.",
    },
    topic: "topic",
  };
  const msg = admin.messaging();
  msg.send(payload).then((result) => {
    console.log("result", result);
    res
      .status(200)
      .send({ success: true, message: "notification_sent", data: {} });
  });

  // fetch('https://fcm.googleapis.com/fcm/send',{
  //     'method':'POST',
  //     'headers':{
  //         'Authorization':'key='+'BPVvwYkbMATp7f0K4-K7V7O_j-EW6fgHclQwtyXC-OsV8CFgOgTMe-ktqjNbuDP92LWjSpJjuMptgjiUTHQR8u0',
  //         'Content-Type':'application-json '
  //     },
  //     'body':JSON.stringify(notification_body)
  // }).then(()=>{
  //     res.status(200).send({success: true, message: 'Notification-change', data: {}})
  // }).catch((err)=>{
  //     res.status(500).send({ success: false, message: err })
  // })
});

// Storage
// const upload = multer({storage:FirebaseStorage({
//     bucketName:'gs://fir-demo-1-84ec3',
//     credentials:{
//         clientEmail: 'firebase-adminsdk-1bjv5@fir-demo-1-84ec3.iam.gserviceaccount.com',
//         privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCet2AbdHykizW1\nr5McjTcXjjwNPUHCZBZTeS9qTMQjwk/1eWxYUs+zb3n7vlKQgrsPk1cK58ekDTkH\nLcGiAAkyoQVO+WNTqrivOCpHdAtsFyxG1LW909X6T5QGuhSafu3SaC3iDJDok80l\nk0MNRUDqACa1QnlA6KiZKENvgQWqAJBl4RNnSIq/529klG1Z3+8OnEloM8mpKAb7\nsRPel5tzrFtT4hTtckbPsigMji+4VZxsbX+EQwWf/o3BX6sAXZ2mPVJQkGK//ws+\njC0x3ylPom6z+NcgoIWjaB58iivXurdAGtCDPUKxK4RTdjnMHcCZBnhgEMTDtHqD\nrVyga9ubAgMBAAECggEARpIatZpx4WfUldhffQ59NIgVw309RAXkt3Dm2EkR3SSF\nEQzQU+VeXNZwUrMpWwAF1MMarMqqRhNrC/oYYsPJUy2tgpP4yjbar241vlemzITx\nNv1VYfZS6l1/4A3VI2zUqf2QiTY1KHSvfsmfwsLMPj+a9nV8HJRWguMYOPgRYKjz\nycgkruPLPmmysiDXYKWfkKB09psssf0yEhBrkE80L6eosKep2raifKbaVBSj3xy5\ndf8b9y2Q2v+P6MkbmaEo9n3tiO9AtQMpN6N603d2KWgBQUD9IComkOqdtXYls+Wp\n2JX4VVdMyFky2sKmImTpVn+yRwz8BtA52ReeUQYsIQKBgQDZPY1KoWMmc5ejEjjj\nJV27/Y738FGoY02yS0HJcgMNxn2EhV1aEFFjbiOtFOrVgqJJhegEkMkD3C5kFcRZ\nx1pD+TnEhui6CD5rSSMl4DXVPT0EH19hmJln9azBwdeE6Xt+sM+lpl85f3cjAm60\ncdFHz2Wa65sYpjz7HA1qB1CV1wKBgQC7CLyEXNI4q0nrfjec4wstEqsWBLndZ+w3\nh2dVqapoFgJQExMrFRFzbdgS7NLl7m4OdScKPBlVpArSe7N0ntgave0iRGT7k8T/\ncktQI8hg4/3MVLGmb+R6dVIXv1ZzQYA3RmDXVuEKE2VbD9SGHd129ylhPll2YwIN\nOJf51Ndn3QKBgQCBwOnrcYmvJcukcvXXdjIOXtxN6xRa5zU5EQoyMA7y42OFC8M+\nUBDMurREZQH+lRApqflzAKePzqtGzFmC5jdb8jg20f2fX90oZ36+2LROsU0IcVSf\nDm5SUcLl18nKcUp52VGtNzoZNbELECDfVjwSECY36hGxH1m9AnxgoA3Z8QKBgQC1\nn4k5W83EvAk/RsUIc64RqfQ7oIFBEL7hOXrOQ8E37E94pN1TU9UrazqNPi6am8uB\n/J/Zn3zWnkLoHLmqgOnIJjEVuqb5aoi9qqaZ/vWBqUR3XLNatYOAq1b5upNfvvac\nNpqp4jMMDsO5BwlQ58V81gz34o0Lmp+OaSujrt0yfQKBgQDGwOpari5BpjnWuYip\nyNDnrHmlSDdJFDjcFmflrOXDgNYeTGPeaJZPO2NKue60F1IwsRTK3vIdiGCmulbo\nWtHcxlBgXM0lSQO45i8JbbbwINHgDjORUd7lI38kKEhymvFLB9ondHGaLIgepM20\nVqL0/JsM8AwxUofhAW28+OI6Mg==\n-----END PRIVATE KEY-----\n',
//         projectId: 'fir-demo-1-84ec3'
//     }
// })})

// const upload = multer({});
// app.post('/api/upload', upload.single('file'), (req, res) => {
//     res.status(200).send({ success: true, message: 'file store successFully', data: {} })
// })

// const upload = multer({storage:multer.diskStorage()})

// app.locals.bucket = admin.storage().bucket()

// app.post('/api/upload',upload.single('file'),async(req,res)=>{
//     console.log("1")
//     const name = saltedMd5(req.file, 'SUPER-S@LT!')
//     const fileName = name + path.extname(req.file)
//     await app.locals.bucket.file(fileName).createWriteStream().end(req.file.buffer)
//     res.send('done');
//     })

const filesUpload = function (req, res, next) {

  const busboy = Busboy({
    headers: req.headers,
  });

  const fields = {};
  const files = [];
  const fileWrites = [];  
  busboy.on("field", (key, value) => {   
    fields[key] = value;
  });

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    const filepath = path.join(__dirname, filename);
    console.log(
      `Handling file upload field ${fieldname}: ${filename} (${filepath})`
    );
    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);

    fileWrites.push(
      new Promise((resolve, reject) => {
        file.on("end", () => writeStream.end());
        writeStream.on("finish", () => {
          fs.readFile(filepath, (err, buffer) => {
            const size = Buffer.byteLength(buffer);
            console.log(`${filename} is ${size} bytes`);
            if (err) {
              return reject(err);
            }

            files.push({
              fieldname,
              originalname: filename,
              encoding,
              mimetype,
              buffer,
              size,
            });

            try {
              fs.unlinkSync(filepath);
            } catch (error) {
              return reject(error);
            }

            resolve();
          });
        });
        writeStream.on("error", reject);
      })
    );
  });

  busboy.on("finish", () => {
    Promise.all(fileWrites)
      .then(() => {
        req.body = fields;
        req.files = files;
        next();
      })
      .catch(next);
  });

  busboy.end(req.rawBody);
};

app.post("/api/upload", filesUpload, (req, res) => {
  //   console.log(req.body);
  console.log(req.file);
  if (!req.file) {
    res.status(400).send("Error: No files found");
  } else {
    const blob = bucket.file(req.file.originalname);

    const blobWriter = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobWriter.on("error", (err) => {
      console.log(err);
    });

    blobWriter.on("finish", () => {
      res.status(200).send("File uploaded.");
    });

    blobWriter.end(req.file.buffer);
  }
});

app.post("/api/dynamiclink", async (req, res) => {
  try {
    // APP
    const firebaseDynamicLinks = new FirebaseDynamicLinks.FirebaseDynamicLinks(
      "AIzaSyAUQEJzphEvVWbYHUPW3COxT4ru9sflRlQ"
    );
    const { shortLink, previewLink } = await firebaseDynamicLinks.createLink({
      longDynamicLink: `https://dlfirebase.page.link/?link=${req.body.longlink}`,
    });
    return res
      .send({ shortLink: shortLink, previewLink: previewLink })
      .statusCode(200);
  } catch (err) {
    console.error(err);
    return res
      .send({
        success: false,
        message: err,
      })
      .statusCode(400);
  }
});
exports.app = functions.https.onRequest(app);
