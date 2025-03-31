const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express()
app.use(cors())

// 使用自定义的 diskStorage 配置替换简单的 dest 配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            fs.mkdirSync(path.join(process.cwd(), 'my-uploads'));
        } catch(e) {}
        cb(null, path.join(process.cwd(), 'my-uploads'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});

// 将存储配置传递给 multer
const upload = multer({ storage: storage });

app.post('/aaa',upload.single('aaa'),(req,res,next)=>{
  console.log('req.file',req.file)
  console.log('req.body',req.body)
})
app.post('/bbb',upload.array('bbb',2),(req,res,next)=>{
  console.log('req.file2',req.files)
  console.log('req.body2',req.body)
},function (err,req,res,next){
  if(err instanceof multer.MulterError){
    return res.status(500).json({message:'文件上传失败'})
  }
  next()
})
app.post('/ccc',upload.fields([{name:'ccc',maxCount:2},{name:'ddd',maxCount:3}]),(req,res,next)=>{
  console.log('req.file3',req.files)
  console.log('req.body3',req.body)
})
app.listen(3333,()=>{
  console.log('server is running on port 3333')
})