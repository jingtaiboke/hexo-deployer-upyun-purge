const glob = require('glob');
const path = require('path');
const fs = require('fs');
const md5 = require('md5');
const ora = require('ora'); // 执行动画
const upyun = require('upyun');

class filesUpload {
  constructor(config, ctx) {
    const { serviceName, operatorName, operatorPassword, path,cacheUrl } = config;
    if(!(serviceName && operatorName && operatorPassword)) {
       throw(new Error('serviceName、operatorName、operatorPassword为必填项'));
    }
    this.storageInfo = {
      serviceName,
      operatorName,
      operatorPassword,
      path: path ? path.substring(0, 1) === '/' ? path : `/${path}` : '/',
	  cacheUrl: cacheUrl.endsWith('/') ? cacheUrl.slice(0,-1) : cacheUrl
    };
    this.ctx = ctx;
    this.errorFile = []; // 上传失败的文件
    this.init();
  }
  init() {
    const {serviceName, operatorName, operatorPassword} = this.storageInfo;
    const service = new upyun.Service(serviceName, operatorName, operatorPassword);
    this.client = new upyun.Client(service);
  }
  async startUpload() {
    const {
      config: {
        public_dir
      }
    } = this.ctx;
    const filePath = path.join(public_dir, '/**/*');
    const allFiles = glob.sync(filePath, {
      nodir: true // 只匹配文件，不匹配文件夹。防止文件夹名称中有dot符号被匹配出来
    });
    await this.upload(allFiles);
  }
  readFilePromise(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }
  async upload(fileList) {
	let purgeList=[];
	let uploadTrue=0;
	let uploadFalse=0;
	let uploadNo=0;
    for (let index = 0; index < fileList.length; index++) {
      const localFilePath = fileList[index];
      const remotePath = (this.storageInfo.path.endsWith('/') ? this.storageInfo.path.slice(0,-1) : this.storageInfo.path) + '/' + fileList[index].split('/').slice(1).join('/'); // 文件远程保存路径
	  const remotePathCache = this.storageInfo.cacheUrl+ remotePath; //需要刷新的网址
	  const remotePathCacheExt = remotePathCache.split('.').pop().toLowerCase();//需要刷新的后缀
	  //console.log("远程路径:"+remotePath+':'+this.storageInfo.cacheUrl)
      const spinner = ora().start();
      spinner.text = `开始上传文件：${localFilePath}`;
      try {
        const localFile = await this.readFilePromise(localFilePath); // 本地文件md5值
        const localFileMd5 = md5(localFile);
        const remoteFileMd5 = (await this.client.headFile(remotePath))['Content-Md5']; // 获取云存储上文件的md5值
        if (localFileMd5 === remoteFileMd5) {
          spinner.succeed("忽略: "+localFilePath );
		  uploadNo++;
        } else {
          // 上传
          try {
            const result = await this.client.putFile(remotePath, localFile);
            if (result) {
              spinner.succeed(`成功: ${localFilePath}`);
			  uploadTrue++;
			  purgeList.push(remotePathCache);
            } else {
              throw new Error(`失败: ${localFilePath}`);
			  uploadFalse++;
            }
          } catch (e) {
            spinner.fail(e);
            this.errorFile.push({
              filePath: localFilePath,
              error: e
            });
          }
        }
      } catch(e) {
        this.ctx.log.error(e, '本地文件读取失败');
      }
    }
	const purgeResult = await this.client.purge(purgeList);
	console.log("============================又拍云报告=============================\n");
	console.log("缓存清理:",purgeResult);
	console.log("上传数量:",uploadTrue);
	console.log("失败数量:",uploadFalse);
	console.log("忽略数量:",uploadNo);
	console.log("Hexo在线写文章工具: http://JingTaiBoKe.com 【静态博客 全拼】");
	console.log("\n===================================================================");
	
    this.errorFile.forEach(ele => {
      this.ctx.log.info('文件：', ele.filePath, ' 上传失败，原因：', ele.error);
    });

  }
}
module.exports = async function (args, cb) {
  try {
    // 连接upyun
    const upyunInstance = new filesUpload(args, this); // ftp上传实例
    await upyunInstance.startUpload();
    return cb();
  } catch (error) {
    this.log.error('发生错误：', error);
    return;
  } 
}
