const functions = require("firebase-functions");
const admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
const FirebaseDynamicLinks = require("firebase-dynamic-links");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const path = require("path");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://fir-demo-1-84ec3-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "gs://fir-demo-1-84ec3.appspot.com",
});

// const bucket = admin.storage().bucket();

const app = express();
app.use(express.json({ extended: true, limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const db = admin.firestore();

// routes
app.get("/", (req, res) => {
  return res.status(200).send("HEllo");
});

// Create ->  post()
app.post("/api/create", (req, res) => {
  (async () => {
    try {
      const empData = {
        id: Date.now(),
        name: req.body.name,
        mobile: req.body.mobile,
        address: req.body.address
      }
      const data = await db
        .collection("userDetails")
        .doc(`/${Date.now()}/`)
        .create({
          id: empData.id,
          name: empData.name,
          mobile: empData.mobile,
          address: empData.address,
        });
      return res
        .status(200)
        .send({ success: true, message: "Data Saved", data:empData });
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
            id: doc.data().id,
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
      .send({ shortLink: shortLink, previewLink: previewLink });
  } catch (err) {
    console.error(err);
    return res
      .send({
        success: false,
        message: err,
      })
      ;
  }
});
exports.app = functions.https.onRequest(app);
