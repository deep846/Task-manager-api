const express = require("express");
const router = new express.Router();
const User = require("../models/user");
const auth = require("../middleware/auth");
const Task = require("../models/task");
const multer = require("multer");
const sharp = require("sharp");
const emailjs = require("@emailjs/nodejs");

router.post("/users", async (req, res) => {
  const users = new User(req.body);
  try {
    await users.save();
    const token = await users.generateAuthToken();
    res.status(201);
    res.send({ users, token });
  } catch (err) {
    res.status(400);
    res.send(err);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user: user, token });
  } catch (e) {
    res.status(400).send("unable to login");
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();

    res.status(200).send("loggedout");
  } catch (e) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/users/logoutall", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = [];
    await user.save();
    res.status(200).send("logged out from all device");
  } catch (e) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const id = req.user._id.toString();
  const allowedUpdate = ["name", "age", "email", "password"];

  const isValidOperation = updates.every((update) =>
    allowedUpdate.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Not a valid field to update" });
  }

  try {
    const user = req.user;
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    //                ||      the below line is      ||
    //                \/     same as upper 3 line    \/

    // const user = await User.findByIdAndUpdate(id, req.body, {new: true,runValidators: true,});

    if (!user) {
      res.status(404);
      return res.send({ error: "Not found User" });
    }
    res.send(user);
  } catch (err) {
    res.status(400);
    res.send(err);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  const id = req.user._id.toString();

  try {
    const user = await User.findByIdAndDelete(id);
    await Task.deleteMany({ uid: id }); // after deleteing the user you should delete the all tasks releted to the user
    if (!user) {
      return res.status(404).send({ error: "User Not exist" });
    }
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Uploading file and validation and deletion and fetching the file

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|PNG|jpg|JPG|jpeg|JPEG)$/)) {
      cb(new Error("File must have a extention of .jpeg or .jpg or .png"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("upload"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send({ message: `Profile picture updated of ${req.user.name}` });
  },
  (error, req, res, next) => {
    res.status(400).send({ errors: error.message });
  }
);

router.delete(
  "/users/me/avatar",
  auth,
  async (req, res) => {
    if (req.user.avatar.toString() === "") {
      return res.send({
        message: `No Profile Picture exist of ${req.user.name}`,
      });
    }
    req.user.avatar = "";
    await req.user.save();
    res.send({ message: `Profile picture Removed of ${req.user.name}` });
  },
  (error, req, res, next) => {
    res.status(400).send({ errors: error.message });
  }
);

router.get("/users/me/avatar",auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.avatar=='') {
      return res.status(404).send({message:"NO Profile picture found"})
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send();
  }
});




router.post("/email", auth, async (req, res) => {


  try{

    const user = req.user;
  const name = user.name;
  const email = user.email;
  const age = user.age;
  const params = {
    from_name: 'Deep Choudhury',
    email:email,
    message:"This is a test message from Deep",
    name:name,
    age:age
  }

 await emailjs.send("service_el33blm", "template_84uwdiq", params, {
   publicKey: process.env.emailpublic,
   privateKey: process.env.emailprivate,
 });

  res.status(200).send({message:"Email send"})

  }catch(error){
    res.status(400).send({message:error})
  }
  


});

module.exports = router;
