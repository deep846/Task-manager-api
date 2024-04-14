const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();
const port = process.env.PORT;

// Middleware

// app.use((req,res,next)=>{
//     if(req.method==='GET'){
//       res.send({error:'Not able to perform in this path'})
//     }else{
//       next()
//     }
// })

// maintanence middleware
// app.use((req,res,next)=>{
//       res.status(503).send('Site is under maintanence')
// })

// output will be supported autometically in json no need to parse
app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

// const multer = require("multer");

// const upload = multer({
//   dest: "images",
//   limits: {
//     fileSize: 1000000
//   },
//   fileFilter(req,file,cb){

//     if (!file.originalname.match(/\.(doc|docx|pdf)$/)) {
//       cb(new Error("File must be a pdf or word"));
//     }
//     cb(undefined,true)

//     // cb(new Error('File must be a pdf'))
//     // cb(undefined,true)
//     // cb(undefined,false)
//   }
// });

// app.post(
//   "/upload",
//   upload.single("upload"),
//   (req, res) => {
//     res.send();
//   },
//   (error, req, res, next) => {
//     res.status(400).send({ error: error.message });
//   }
// );


app.listen(port, () => {
  console.log(`server is on http://localhost:${port}`);
});
