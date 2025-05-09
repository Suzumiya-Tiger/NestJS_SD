# 原理讲解

简单来说，临时密钥本身并不是凭空产生的，它需要一个有合法身份的“东西”去向腾讯云申请。这个“东西”就是永久密钥（主账号或子账号密钥）。

可以这样理解：

1. 永久密钥（例如子账号密钥）的角色：

- 它代表了您的一个可信实体（比如您的后端服务器应用）。

- 这个实体拥有向腾讯云STS（Security Token Service，安全令牌服务）申请临时密钥的权限。

- 在您当前的 cos.js 脚本中，配置的 secretId 和 secretKey 就是这个永久密钥。它的作用是向腾讯云证明：“我是合法的，请根据我指定的策略（policy）生成一个临时的、权限更受限的密钥给我。”

1. 临时密钥的角色：

- 一旦您的服务器（通过永久密钥）成功从STS获取到临时密钥（包含 tmpSecretId, tmpSecretKey, sessionToken），这个临时密钥就可以安全地分发给前端客户端（例如浏览器、App）。

- 前端客户端使用这个临时密钥直接与COS服务进行交互（例如上传文件）。

- 临时密钥具有时效性（比如您设置的 durationSeconds），并且其权限通常被严格限制在特定操作和资源上（由 policy 定义）。

为什么不能直接在前端使用永久密钥？

如果直接在前端代码中暴露永久密钥（哪怕是子账号密钥），一旦泄露，攻击者就能获取到该密钥所拥有的所有权限，可能造成严重的安全风险。

总结一下流程：

1. 您的后端服务器（在您的情况下是运行 cos.js 的Node.js环境）持有永久密钥。

1. 后端服务器使用永久密钥向腾讯云STS服务请求临时密钥，并指定该临时密钥的权限和有效期。

1. STS服务验证永久密钥的合法性后，颁发临时密钥给您的后端服务器。

1. 后端服务器再将这个临时密钥安全地传递给前端客户端。

1. 前端客户端使用临时密钥在有效期和权限范围内直接操作COS。

因此，虽然最终目标是让客户端使用临时密钥，但生成这个临时密钥的过程，在服务端是离不开一个拥有相应权限的永久密钥的。您在 cos.js 中配置的永久密钥，正是扮演了这个“申请者”的角色。这个脚本本身应该部署在您的服务器端，而不是直接暴露给最终用户。



```typescript
// 引入腾讯云COS Node.js SDK 和 STS SDK
const COS = require('cos-nodejs-sdk-v5');
const STS = require('qcloud-cos-sts');

// 配置STS SDK以获取临时密钥
const config = {
    // 用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。
    // 子账号密钥获取可参见 https://cloud.tencent.com/document/product/598/37140
    secretId: 'AKID50f3A0auznKZXDckbASikVzDArISRAdp',     // 替换为您的永久SecretId
    // 用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。
    // 子账号密钥获取可参见 https://cloud.tencent.com/document/product/598/37140
    secretKey: 'wby4tUptgDSQ7YhZAUXJp42j9H9j24qL',    // 替换为您的永久SecretKey
    // 临时密钥的权限策略
    policy: {
        'version': '2.0',
        'statement': [
            {
                // 密钥的权限列表。必须在这里指定本次临时密钥所需要的权限。
                // 权限列表请参见 https://cloud.tencent.com/document/product/436/31923
                // 'name/cos:*' 表示允许所有COS操作
                'action': [
                    // 简单上传、表单上传、小程序上传
                    'name/cos:PutObject',
                    'name/cos:PostObject',
                    // 分块上传
                    'name/cos:InitiateMultipartUpload',
                    'name/cos:ListMultipartUploads',
                    'name/cos:ListParts',
                    'name/cos:UploadPart',
                    'name/cos:CompleteMultipartUpload',
                    // 其他操作根据需要添加
                ],
                'effect': 'allow',
                // 这里改成允许的路径前缀，可以根据自己网站的用户登录态判断允许上传的具体路径
                // 资源表达式规则：qcs::cos:<region>:uid/<appid>:<bucketname-appid>/<prefix>*
                // 示例：'qcs::cos:ap-guangzhou:uid/1320014207:heinrich-1320014207/*' 允许访问Bucket下所有资源
                'resource': [
                    'qcs::cos:ap-guangzhou:uid/1320014207:heinrich-1320014207/*'
                ]
            }
        ]
    },
    // 临时密钥有效时长，单位是秒，默认1800秒，主账号最长2小时（即7200秒），子账号最长36小时（即129600秒）
    durationSeconds: 1800,
    // host 和 proxy 可选
    // host: 'sts.internal.tencentcloudapi.com', // 如果使用腾讯云CVM，可以设置内部域名
};

// 异步函数：调用STS SDK获取临时密钥
async function getTempKeys() {
    return new Promise((resolve, reject) => {
        // 调用STS SDK的getCredential方法获取临时凭证
        STS.getCredential(config, (err, data) => {
            if (err) {
                // 如果获取失败，则拒绝Promise并传递错误信息
                reject(err);
            } else {
                // 如果获取成功，则解析Promise并传递临时凭证数据
                resolve(data);
            }
        });
    });
}

// 异步函数：使用临时密钥上传文件到COS
async function put() {
    try {
        // 调用getTempKeys获取临时密钥和凭证
        const tempKeys = await getTempKeys();
        console.log('获取临时密钥成功:', tempKeys);

        // 使用获取到的临时密钥初始化COS SDK实例
        const cos = new COS({
            SecretId: tempKeys.credentials.tmpSecretId,     // 临时密钥的SecretId
            SecretKey: tempKeys.credentials.tmpSecretKey,   // 临时密钥的SecretKey
            XCosSecurityToken: tempKeys.credentials.sessionToken, // 临时密钥的sessionToken
            ExpiredTime: tempKeys.expiredTime,              // 临时密钥的过期时间戳
            
        });

        // 执行文件上传操作
        const result = await cos.putObject({
            Bucket: 'heinrich-1320014207',   // 目标存储桶名称
            Region: 'ap-guangzhou',         // 存储桶所在地域
            Key: 'pig.jpg',               // 上传后在存储桶中的对象键（文件名）
            Body: require('fs').createReadStream('./111.jpg'),  // 要上传的文件流
        });
        console.log('文件上传成功:', result);
    } catch (e) {
        // 捕获并打印执行过程中的任何错误
        console.log('操作错误:', e);
    }
}

// 执行文件上传函数
put();

```



# 最终实现版本

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>腾讯云COS前端上传示例</title>
  <script src="https://unpkg.com/axios@1.6.5/dist/axios.min.js"></script>
  <!-- 使用官方推荐的CDN链接 -->
  <script src="https://unpkg.com/cos-js-sdk-v5/dist/cos-js-sdk-v5.min.js"></script>
  <style>
    body {
      font-family: sans-serif;
      margin: 20px;
    }

    #fileInput {
      margin-bottom: 15px;
    }

    #uploadStatus {
      margin-top: 10px;
    }

    #previewImage {
      max-width: 300px;
      max-height: 300px;
      margin-top: 15px;
      border: 1px solid #ccc;
    }
  </style>
</head>

<body>
  <h2>腾讯云COS 文件上传</h2>
  <input id="fileInput" type="file" />
  <div id="uploadStatus"></div>
  <img id="previewImage" src="#" alt="上传预览" style="display:none;" />

  <script>
    // 确保全局变量已定义
    if (typeof COS === 'undefined') {
      document.getElementById('uploadStatus').textContent = 'COS SDK加载失败，请刷新页面';
      console.error('COS SDK未加载');
    } else {
      const fileInput = document.getElementById('fileInput');
      const uploadStatus = document.getElementById('uploadStatus');
      const previewImage = document.getElementById('previewImage');

      // 从服务器获取临时密钥
      async function getCosCredentials() {
        try {
          const response = await axios.post('/api/get-cos-credentials');
          if (response.data && response.data.credentials) {
            console.log('获取到的临时密钥信息:', response.data);
            return response.data;
          } else {
            throw new Error('获取临时密钥失败: 响应数据格式不正确');
          }
        } catch (error) {
          console.error('获取临时密钥出错:', error);
          uploadStatus.textContent = '获取临时密钥失败: ' + (error.response?.data?.message || error.message);
          throw error;
        }
      }

      fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) {
          uploadStatus.textContent = '请选择文件';
          return;
        }

        uploadStatus.textContent = '准备上传...';
        previewImage.style.display = 'none';

        try {
          // 获取临时密钥
          const cosAuthData = await getCosCredentials();

          const bucketName = cosAuthData.bucket;
          const regionName = cosAuthData.region;

          if (!bucketName || !regionName) {
            uploadStatus.textContent = '错误：后端未提供Bucket或Region信息。';
            return;
          }

          // 初始化COS实例
          const cos = new COS({
            // 必选参数
            getAuthorization: function (options, callback) {
              callback({
                TmpSecretId: cosAuthData.credentials.tmpSecretId,
                TmpSecretKey: cosAuthData.credentials.tmpSecretKey,
                SecurityToken: cosAuthData.credentials.sessionToken,
                // 建议返回服务器时间作为签名的开始时间，避免用户浏览器本地时间偏差过大导致签名错误
                StartTime: cosAuthData.startTime, // 时间戳，单位秒，如：1580000000
                ExpiredTime: cosAuthData.expiredTime, // 时间戳，单位秒，如：1580000900
              });
            }
          });

          uploadStatus.textContent = '正在上传: ' + file.name;

          // 执行上传操作
          cos.putObject({
            Bucket: bucketName,
            Region: regionName,
            Key: file.name,
            Body: file,
            onProgress: function (progressData) {
              const percent = parseInt(progressData.percent * 100, 10);
              uploadStatus.textContent = `上传中: ${file.name} (${percent}%)`;
              console.log('上传进度:', JSON.stringify(progressData));
            }
          }, function (err, data) {
            if (err) {
              console.error('上传失败:', err);
              uploadStatus.textContent = '上传失败: ' + (err.message || JSON.stringify(err));
            } else {
              console.log('上传成功:', data);
              uploadStatus.textContent = '上传成功!';

              const imageUrl = `https://${bucketName}.cos.${regionName}.myqcloud.com/${encodeURIComponent(file.name)}`;
              previewImage.src = imageUrl;
              previewImage.style.display = 'block';
              alert('上传成功！图片URL: ' + imageUrl);
            }
          });
        } catch (error) {
          uploadStatus.textContent = '上传过程中发生错误。';
          console.error('上传处理错误:', error);
        }
      };
    }
  </script>
</body>

</html>
```





```js
// 引入腾讯云COS Node.js SDK 和 STS SDK
const COS = require('cos-nodejs-sdk-v5');
const STS = require('qcloud-cos-sts');

// 配置STS SDK以获取临时密钥
const config = {
    // 用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。
    // 子账号密钥获取可参见 https://cloud.tencent.com/document/product/598/37140
    secretId: 'AKID50f3A0auznKZXDckbASikVzDArISRAdp',     // 替换为您的永久SecretId
    // 用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。
    // 子账号密钥获取可参见 https://cloud.tencent.com/document/product/598/37140
    secretKey: 'wby4tUptgDSQ7YhZAUXJp42j9H9j24qL',    // 替换为您的永久SecretKey
    // 临时密钥的权限策略
    policy: {
        'version': '2.0',
        'statement': [
            {
                // 密钥的权限列表。必须在这里指定本次临时密钥所需要的权限。
                // 权限列表请参见 https://cloud.tencent.com/document/product/436/31923
                // 'name/cos:*' 表示允许所有COS操作
                'action': [
                    // 简单上传、表单上传、小程序上传
                    'name/cos:PutObject',
                    'name/cos:PostObject',
                    // 分块上传
                    'name/cos:InitiateMultipartUpload',
                    'name/cos:ListMultipartUploads',
                    'name/cos:ListParts',
                    'name/cos:UploadPart',
                    'name/cos:CompleteMultipartUpload',
                    // 其他操作根据需要添加
                ],
                'effect': 'allow',
                // 这里改成允许的路径前缀，可以根据自己网站的用户登录态判断允许上传的具体路径
                // 资源表达式规则：qcs::cos:<region>:uid/<appid>:<bucketname-appid>/<prefix>*
                // 示例：'qcs::cos:ap-guangzhou:uid/1320014207:heinrich-1320014207/*' 允许访问Bucket下所有资源
                'resource': [
                    'qcs::cos:ap-guangzhou:uid/1320014207:heinrich-1320014207/*'
                ]
            }
        ]
    },
    // 临时密钥有效时长，单位是秒，默认1800秒，主账号最长2小时（即7200秒），子账号最长36小时（即129600秒）
    durationSeconds: 1800,
    // host 和 proxy 可选
    // host: 'sts.internal.tencentcloudapi.com', // 如果使用腾讯云CVM，可以设置内部域名
};

// 异步函数：调用STS SDK获取临时密钥
async function getTempKeys() {
    return new Promise((resolve, reject) => {
        // 调用STS SDK的getCredential方法获取临时凭证
        STS.getCredential(config, (err, data) => {
            if (err) {
                // 如果获取失败，则拒绝Promise并传递错误信息
                reject(err);
            } else {
                // 如果获取成功，则解析Promise并传递临时凭证数据
                resolve(data);
            }
        });
    });
}

// 异步函数：使用临时密钥上传文件到COS
async function put() {
    try {
        // 调用getTempKeys获取临时密钥和凭证
        const tempKeys = await getTempKeys();
        console.log('获取临时密钥成功:', tempKeys);

        // 使用获取到的临时密钥初始化COS SDK实例
        const cos = new COS({
            SecretId: tempKeys.credentials.tmpSecretId,     // 临时密钥的SecretId
            SecretKey: tempKeys.credentials.tmpSecretKey,   // 临时密钥的SecretKey
            XCosSecurityToken: tempKeys.credentials.sessionToken, // 临时密钥的sessionToken
            ExpiredTime: tempKeys.expiredTime,              // 临时密钥的过期时间戳
            
        });

        // 执行文件上传操作
        const result = await cos.putObject({
            Bucket: 'heinrich-1320014207',   // 目标存储桶名称
            Region: 'ap-guangzhou',         // 存储桶所在地域
            Key: 'pig.jpg',               // 上传后在存储桶中的对象键（文件名）
            Body: require('fs').createReadStream('./111.jpg'),  // 要上传的文件流
        });
        console.log('文件上传成功:', result);
    } catch (e) {
        // 捕获并打印执行过程中的任何错误
        console.log('操作错误:', e);
    }
}

// 执行文件上传函数
put();

```

