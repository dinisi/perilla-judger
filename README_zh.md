# PerillaJudger
[![](https://img.shields.io/github/tag/dinisi/perilla-judger.svg?style=flat-square)](https://github.com/dinisi/perilla-judger)
[![](https://img.shields.io/badge/project-Perilla-8e44ad.svg?style=flat-square)](https://github.com/ZhangZisu/perilla)

官方Perilla评测后端实现

## 插件

`perilla-judger`并**不能**评测提交。所有的提交都将由各种评测插件完成。

正因如此，评测后端本身无需关注具体的评测细节。而评测插件也无需关注具体的和`perilla`服务器沟通、文件传输与缓存的细节

### 官方支持插件:

- [traditional](https://github.com/dinisi/perilla-judger-plugin-traditional)
- [Codeforces](https://github.com/dinisi/perilla-judger-plugin-codeforces)
- [BZOJ](https://github.com/dinisi/perilla-judger-plugin-bzoj)
- [AtCoder](https://github.com/dinisi/perilla-judger-plugin-atcoder)
- 更多的插件可以在这个团队中寻找[dinisi](https://github.com/dinisi)

### 使用

在项目目录下创建`plugins`文件夹——插件目录。所有的插件都应该安装在这个目录下。

要安装某插件，在插件目录执行`git clone 插件git地址 插件名`即可。

其实你也发现了，可以不用git安装，直接将插件放在插件目录中即可。

示例，安装traditional插件：`git clone https://github.com/ZhangZisu/perilla-judger-plugin-traditional.git traditional`

在安装后，请按照插件项目的提示完成插件配置。

### 如何编写自己的插件？

查看 [demo](https://github.com/ZhangZisu/perilla-judger-plugin-test)

阅读插件定义源码 [here](https://github.com/ZhangZisu/perilla-judger/blob/master/src/interfaces.ts#L44)
