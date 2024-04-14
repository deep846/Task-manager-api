const express = require("express");
const router = new express.Router();
const Task = require("../models/task");
const auth = require("../middleware/auth");

router.post("/tasks", auth, async (req, res) => {
  const task = new Task(req.body);
  try {
    const id = req.user._id.toString();
    task.uid = id;
    await task.save();
    res.status(201);
    res.send(task);
  } catch (err) {
    res.status(401);
    res.send("Login First Then Create Task");
  }
});

//  GET /tasks?completed=false
//      /tasks?sortBy=createdAt:desc
//      /tasks?limit=2&skip=0

router.get("/tasks", auth, async (req, res) => {
  let query = {
    uid: req.user._id.toString(),
  };
  let sort = {}

  if(req.query.sortBy){
      const parts = req.query.sortBy.split(':')
      sort[parts[0]] = parts[1]==='desc'?-1:1
  }

  if (req.query.completed) {
    query = {
      uid: req.user._id.toString(),
      completed: req.query.completed === "true",
    };
  }

  try {
    const task = await Task.find(query)
      .sort(sort)
      .limit(parseInt(req.query.limit))
      .skip(parseInt(req.query.skip));
    res.status(200);
    if (task.length === 0) {
      return res.status(404).send("No Task to read Create a new One");
    }

    res.send(task);
  } catch (err) {
    res.status(500);
    res.send(err);
  }
});

router.get("/tasks/:tid", auth, async (req, res) => {
  const id = req.params.tid;
  const uii = req.user._id.toString();

  try {
    const task = await Task.findOne({ _id: id, uid: uii });
    if (!task) {
      return res.status(404).send({ error: "Not found Task" });
    }
    res.status(200);
    res.send(task);
  } catch (err) {
    res.status(500);
    res.send(err);
  }
});

router.patch("/tasks/:tid", auth, async (req, res) => {
  const id = req.params.tid;
  const updates = Object.keys(req.body);
  const validUpdates = ["description", "completed"];
  const isValid = updates.every((update) => validUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send({ error: "Invalid task field to update" });
  }

  try {
    const task = await Task.findById(id);
    if (task.uid === req.user._id.toString()) {
      updates.forEach((update) => {
        task[update] = req.body[update];
      });
    } else {
      throw new Error({ error: "You are not autherised to The task" });
    }

    await task.save();

    if (!task) {
      return res.status(404).send({ error: "Not found Task" });
    }
    res.status(200).send(task);

    //       ||      the below line is      ||
    //       \/     same as upper 3 line    \/

    // const task = await Task.findByIdAndUpdate(id, req.body,{new: true,runValidators: true,});
  } catch (err) {
    res.status(400).send({ error: "Bad request" });
  }
});

router.delete("/tasks/:tid", auth, async (req, res) => {
  const id = req.params.tid;

  try {
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).send({ error: "Tasks Not exist" });
    }

    if (task.uid === req.user._id.toString()) {
      await Task.findByIdAndDelete(id);
    } else {
      return res.status(404).send({ error: "Tasks Not exist" });
    }
    res.status(200).send(task);
  } catch (err) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.delete("/deleteall", auth, async (req, res) => {
  try {
    const task = await Task.find({ uid: req.user._id.toString() });

    if (task.length === 0) {
      return res.status(404).send({ error: "Tasks Not exist" });
    }
    if (task[0].uid === req.user._id.toString()) {
      await Task.deleteMany({ uid: req.user._id.toString() });
    } else {
      return res.status(404).send({ error: "Tasks Not exist" });
    }
    res.status(200).send("Deleted All tasks");
  } catch (err) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

module.exports = router;
