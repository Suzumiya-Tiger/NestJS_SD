// 引入STS SDK
const STS = require('qcloud-cos-sts');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// 配置Express中间件
app.use(express.json());
app.use(cors());
app.use(express.static('./')); 

// 配置STS参数
const config = {
    secretId: '',
    secretKey: '',
    durationSeconds: 1800,
    bucket: '',
    region: '',
    allowPrefix: '*' // 使用通配符存在安全风险，建议根据实际需求设置
};

// 生成策略
const policy = {
    'version': '2.0',
    'statement': [{
        'action': [
            // 简单上传、表单上传
            'name/cos:PutObject',
            'name/cos:PostObject',
            // 分块上传
            'name/cos:InitiateMultipartUpload',
            'name/cos:ListMultipartUploads',
            'name/cos:ListParts',
            'name/cos:UploadPart',
            'name/cos:CompleteMultipartUpload'
        ],
        'effect': 'allow',
        'resource': [
            'qcs::cos:ap-guangzhou:uid/1320014207:heinrich-1320014207/*'
        ]
    }]
};

// API接口：获取临时密钥
app.post('/api/get-cos-credentials', (req, res) => {
    STS.getCredential({
        secretId: config.secretId,
        secretKey: config.secretKey,
        durationSeconds: config.durationSeconds,
        policy: policy,
    }, function(err, credential) {
        if (err) {
            console.error('获取临时密钥失败:', err);
            return res.status(500).json({ message: '获取临时密钥失败: ' + err.message });
        }
        
        // 返回临时密钥和必要信息
        res.json({
            credentials: credential.credentials,
            expiredTime: credential.expiredTime,
            startTime: credential.startTime,
            bucket: config.bucket,
            region: config.region
        });
    });
});

// 启动Express服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    console.log(`请在浏览器中访问 http://localhost:${port}/index.html`);
});
