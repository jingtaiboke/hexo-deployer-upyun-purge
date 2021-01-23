# 	hexo-deployer-upyun-purge

hexo deploy to upyun and purge cache

hexo博客部署到又拍云 (upyun),并清理缓存

> 根据 https://www.npmjs.com/package/hexo-deployer-upyundeploy 修改


# 安装

```
npm install hexo-deployer-upyun-purge --save
```

# 用法

编辑Hexo根目录的`_config.yml`文件的`deploy`字段

配置又拍云存储的服务名称、操作员名称、操作员密码

* 与原版冲突:`hexo-deployer-upyundeploy`

```
deploy:
  - type: upyun
    serviceName: 服务名称
    operatorName: 操作员名称
    operatorPassword: 操作员密码
    path: / 上传目录(选填，默认为根目录)
    cacheUrl: https://www.jingtaiboke.com (域名前缀)
```

# [在线写博客](https://jingtaiboke.com )

同时写了一个 [hexo文章管理后台](https://jingtaiboke.com ) ,web版,非插件,开箱即用

[https://JingTaiBoKe.com](https://jingtaiboke.com )  (静态博客 的全拼 很好记)

## 主要特点:

* 非插件,web版(需关联github博客仓库)

* 图床,分类,标签,各种方便 懒得细写


