[TOC]



## 1. url-loader 和 file-loader ##

url-loader内置了file-loader。

url-loader工作分两种情况：

* 文件大小小于limit参数，url-loader将会把文件转为DataURL。

- 文件大小大于limit，调用file-loader进行处理。
>**小提示**： webpack最终会将各个模块打包成一个文件，**样式中的url路径是相对入口html页面的**，而不是相对于原始css文件所在的路径的，这就会导致图片引入失败。 file-loader可以解析项目中的url引入（不仅限于css），根据我们的配置，将**图片拷贝到相应的路径**，**修改打包后文件引用路径**。

下面例子涉及到了4个参数：`limit`、`name`、`outputPath`、`publicPath`。

```js
{
  loader: 'url-loader',
    options: {
      // 注意这里有一个限制图片大小的
      limit: 5000,
        name: '[hash:8].[ext]',
          // 这个有点相对于output路径的赶脚
          outputPath: function (fileName) {
            return "./img/" + fileName   // 后面要拼上这个 fileName 才行
          }
    }
}
```

* `name`表示输出的文件名规则，如果不添加这个参数，输出的就是默认值：文件哈希。加上[path]表示输出文件的相对路径与当前文件相对路径相同，加上[name].[ext]则表示输出文件的名字和扩展名与当前相同。加上[path]这个参数后，打包后文件中引用文件的路径也会加上这个相对路径。

- `outputPath`表示输出文件路径前缀。图片经过url-loader打包都会打包到指定的输出文件夹下。但是我们可以指定图片在输出文件夹下的路径。比如outputPath=img/，图片被打包时，就会在输出文件夹下新建（如果没有）一个名为img的文件夹，把图片放到里面。

- `publicPath`表示打包文件中引用文件的路径前缀，如果你的图片存放在CDN上，那么你上线时可以加上这个参数，值为CDN地址，这样就可以让项目上线后的资源引用路径指向CDN了。


## 2. webpack-dev-server和webpack-dev-middleware ##

> [参考地址1-博客](https://www.cnblogs.com/wangpenghui522/p/6826182.html)， [参考地址2-官网](https://www.webpackjs.com/guides/development/)

### 2.1 webpack-dev-server ###

**`webpack-dev-server`实际上相当于启用了一个`express`的`Http服务器+调用webpack-dev-middleware`。它的作用主要是用来伺服资源文件。**这个`Http服务器`和`client`使用了`websocket`通讯协议，原始文件作出改动后，`webpack-dev-server`会用webpack实时的编译，再**用webpack-dev-middleware将webpack编译后文件会输出到内存中。**适合纯前端项目，很难编写后端服务，进行整合。

当使用 **webpack dev server 和 Node.js API 时**，不要将 dev server 选项放在 webpack 配置对象(webpack config object)中。而是，在创建选项时，将其作为第二个参数传递。例如：

```js
new WebpackDevServer(compiler, options)
```

想要启用 HMR，还需要修改 webpack 配置对象，使其包含 HMR 入口起点。`webpack-dev-server` package 中具有一个叫做 `addDevServerEntrypoints` 的方法，你可以通过使用这个方法来实现。这是关于如何使用的一个小例子：

**dev-server.js**

```javascript
const webpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

const config = require('./webpack.config.js');
const options = {
  contentBase: './dist',
  hot: true,
  host: 'localhost'
};

webpackDevServer.addDevServerEntrypoints(config, options);
const compiler = webpack(config);
const server = new webpackDevServer(compiler, options);

server.listen(5000, 'localhost', () => {
  console.log('dev server listening on port 5000');
});
```

### 2.2 webpack-dev-middleware ###

[配置参考](https://segmentfault.com/a/1190000011761306)

**webpack-dev-middleware输出的文件存在于内存中。**你定义了 webpack.config，webpack 就能据此梳理出entry和output模块的关系脉络，而 webpack-dev-middleware 就在此基础上**形成一个文件映射系统**，**每当应用程序请求一个文件，它匹配到了就把内存中缓存的对应结果以文件的格式返回给你，**反之则进入到下一个中间件。

因为是内存型文件系统，所以重建速度非常快，很适合于开发阶段用作静态资源服务器；因为 webpack 可以把任何一种资源都当作是模块来处理，因此能向客户端反馈各种格式的资源，所以可以替代HTTP 服务器。事实上，大多数 webpack 用户用过的 webpack-dev-server 就是一个 express＋webpack-dev-middleware 的实现。二者的区别仅在于 webpack-dev-server 是封装好的，除了 webpack.config 和命令行参数之外，很难去做定制型开发。而 webpack-dev-middleware 是中间件，可以编写自己的后端服务然后把它整合进来，相对而言比较灵活自由。

```js
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const app = express();
const config = require('./webpack.config.js');
const compiler = webpack(config);

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath
}));

// Serve the files on port 3000.
app.listen(3000, function () {
  console.log('Example app listening on port 3000!\n');
});
```

### 2.3 webpack-hot-middleware ###

是一个结合webpack-dev-middleware使用的middleware，它可以实现浏览器的无刷新更新（hot reload），这也是webpack文档里常说的HMR（Hot Module Replacement）。HMR和热加载的区别是：热加载是刷新整个页面。启用 HMR也可以通过更新 [webpack-dev-server](https://github.com/webpack/webpack-dev-server) 的配置，和使用 webpack 内置的 HMR 插件。



## 3. NamedModulesPlugin 和 HashedModuleIdsPlugin ##

### 3.1 NamedModulesPlugin ###

> [参考](https://www.jianshu.com/p/8499842defbe)

被引入的 js 文件会转化为 `[index: function(...){}]` 的形式。打包的实现显示的就是 `[HMR]  - index` 的形式。

```bash
[HMR] Updated modules:
[HMR]  - 39
[HMR]  - 40
[HMR] Update applied.
```



NamedModulesPlugin达到下面效果

```bash
[HMR] Updated modules:
[HMR]  - ./example.js
[HMR]  - ./hmr.js
[HMR] Update applied.
```

**使用**

```js
plugin: [
    new webpack.NamedModulesPlugin(),
]
```

### 3.2 HashedModuleIdsPlugin ###

> [参考-官网](https://www.webpackjs.com/plugins/hashed-module-ids-plugin/)

该插件会根据模块的相对路径生成一个四位数的hash作为模块id, 建议用于生产环境。

该插件支持以下参数：

- `hashFunction`: 散列算法，默认为 'md5'。支持 Node.JS [`crypto.createHash`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) 的所有功能。
- `hashDigest`: 在生成 hash 时使用的编码方式，默认为 'base64'。支持 Node.js [`hash.digest`](https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding) 的所有编码。
- `hashDigestLength`: 散列摘要的前缀长度，默认为 4。

**用法**

```js
new webpack.HashedModuleIdsPlugin({
  hashFunction: 'sha256',
  hashDigest: 'hex',
  hashDigestLength: 20
})
```

### 3.3 使用场景 ###

> [参考-官网](https://www.webpackjs.com/plugins/hashed-module-ids-plugin/)

***公共依赖没有变,公共文件的hash 改变?***

每个 [`module.id`](https://www.webpackjs.com/api/module-variables#module-id-commonjs-) 会基于默认的解析顺序(resolve order)进行增量。也就是说，当解析顺序发生变化，ID 也会随之改变。

> 解决：[`NamedModulesPlugin`](https://www.webpackjs.com/plugins/named-modules-plugin)，将使用模块的路径，而不是数字标识符。虽然此插件有助于在开发过程中输出结果的可读性，然而执行时间会长一些。第二个选择是使用 [`HashedModuleIdsPlugin`](https://www.webpackjs.com/plugins/hashed-module-ids-plugin)，推荐用于生产环境构建



## 4. webpack-merge ##

> [参考-github](https://github.com/survivejs/webpack-merge)

**webpack-merge**提供了一个`merge`连接数组并合并创建新对象的函数。如果遇到函数，它将执行它们，通过算法运行结果，然后再次将返回的值包装在函数中。

```js
// 标准合并 merge(...configuration | [...configuration])
//默认API 
module.exports =  merge（object1，object2，object3， ...）;

//您可以直接传递对象数组。
//这适用于所有可用的功能。
module.exports =  merge（[object1，object2，object3]）;
```



## 5. ExtractTextWebpackPlugin 和 MiniCssExtractPlugin ##

> [参考-官网](https://www.webpackjs.com/plugins/extract-text-webpack-plugin/), [项目webpack3 迁移到 webpack4 可参考](https://blog.csdn.net/lqlqlq007/article/details/83865176)
>
> 在使用时不能和  `  style-loader`共存，只用于生产环境。

### 5.1 MiniCssExtractPlugin  ###

> [参考-官网](https://www.npmjs.com/package/mini-css-extract-plugin)

**webpack.config.js**

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.NODE_ENV !== 'production'
 
module.exports = {
  plugins: [
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name].[contenthash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[contenthash].css',
    })
  ],
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      }
    ]
  }
}
```

### 5.2 ExtractTextWebpackPlugin ###

> [参考-官网](https://www.webpackjs.com/plugins/extract-text-webpack-plugin/)

```js
module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      }
    ]
  },
```

## 6. CommonsChunkPlugin ##

`CommonsChunkPlugin` 插件，是一个可选的用于建立一个独立文件(又称作 chunk)的功能，这个文件包括多个入口 `chunk` 的公共模块。

> CommonsChunkPlugin 已经从 webpack v4 legato 中移除。想要了解在最新版本中如何处理 chunk，请查看 [SplitChunksPlugin](https://www.webpackjs.com/plugins/split-chunks-plugin/)。

**使用**

```js
 plugina: [
     new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor'
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest'
      })
 ]
```

> *注意，引入顺序在这里很重要。*`CommonsChunkPlugin` *的* `'vendor'` *实例，必须在* `'manifest'` *实例之前引入。*

## 7. ProvidePlugin ##

> [参考-官网](<https://www.webpackjs.com/plugins/provide-plugin/>)

使用 [`ProvidePlugin`](https://www.webpackjs.com/plugins/provide-plugin) 后，能够在通过 webpack 编译的每个模块中，通过访问一个变量来获取到 package 包，而不必到处 `import` 或 `require`。

**使用**

```js
new webpack.ProvidePlugin({
  identifier: ['module1', 'property1'],
  // ...
})
```

任何时候，当 `identifier` 被当作未赋值的变量时，`module` 就会自动被加载，并且 `identifier` 会被这个 `module` 输出的内容所赋值。（模块的 `property` 用于支持命名导出(named export)）。

## 8. imports-loader ##

> [参考-官网](<https://www.webpackjs.com/loaders/imports-loader/>)

当模块运行在 CommonJS 环境下这将会变成一个问题，也就是说此时的 `this` 指向的是 `module.exports`。在这个例子中，你可以**通过使用 [`imports-loader`](https://www.webpackjs.com/loaders/imports-loader/) 覆写 `this**`

**使用**

```js
// ./webpack.config.js
module.exports = {
    ...
    module: {
        rules: [
            {
                test: require.resolve("some-module"),
                use: "imports-loader?this=>window"
            }
        ]
    }
};

// jQuery
imports-loader?$=jquery
```

## 9. exports-loader ##

[参考-官网](<https://www.webpackjs.com/loaders/exports-loader/>)

Exports variables from inside the file by appending `exports[...] = ...` statements..

可以使用 [`exports-loader`](https://www.webpackjs.com/loaders/exports-loader/)，将一个全局变量作为一个普通的模块来导出。

**使用**

```js
require("exports-loader?file,parse=helpers.parse!./file.js");
// 向文件源码添加如下代码：
//  exports["file"] = file;
//  exports["parse"] = helpers.parse;

require("exports-loader?file!./file.js");
// 向文件源码添加如下代码：
//  module.exports = file;
```

## 10. vue-style-loader ##

用于打包 `vue` 中代替 `style-loader`

## 11. DllPlugin和DllReferencePlugin ##

> [参考-博客-简书](https://www.jianshu.com/p/6fb08d492b59)

`DLLPlugin` 和 `DLLReferencePlugin` 用某种方法实现了拆分 bundles，同时还大大提升了构建的速度。

**DllPlugin**

**将此插件与[`output.library`](https://webpack.js.org/configuration/output/#output-library)用于公开（也称为放入全局范围）dll函数的选项相结合**

**DllReferencePlugin**

This plugin is used in the primary webpack config, it references the dll-only-bundle(s) to require pre-built dependencies.

## 12. UglifyjsWebpackPlugin ##

> [参考1-官网-webpack](https://www.webpackjs.com/plugins/uglifyjs-webpack-plugin/)， [参考2-博客-中文](<https://blog.csdn.net/u013884068/article/details/83511343>)， [参考3-官网-npm](<https://www.npmjs.com/package/uglifyjs-webpack-plugin>)

### 12.1 `parallel` ###

> [os.cpus()](http://nodejs.cn/api/os/os_cpus.html)

Use multi-process parallel running to improve the build speed. Default number of concurrent runs: `os.cpus().length - 1`.

**webpack.config.js**

```js
// webpack 3
new webpack.optimize.UglifyJsPlugin
// webpack 4
[
  new UglifyJsPlugin({
    parallel: true/number,
  })
]
```

### 12.2 `cache` ###

类型：`boolean string`默认值：`false`

启用文件缓存。缓存目录的默认路径：`node_modules/.cache/uglifyjs webpack plugin`。

```js
// webpack 4
[
  new UglifyJsPlugin({
    cache: true,
  })
]
```

## 13 optimize-css-assets-webpack-plugin ##

一个优化压缩CSS的WebPack插件

```js
new OptimizeCSSAssetsPlugin({
  cssProcessorOptions: { 
    safe: true, 
    map: buildConfig.productionSourceMap 
  }
})
```

## 14. add-asset-html-webpack-plugin ##

> [参考1-官网-NPM](https://www.npmjs.com/package/add-asset-html-webpack-plugin)，[参考2-官网-TAONPM](http://npm.taobao.org/package/add-asset-html-webpack-plugin)

### 14.1 使用 ###

配合 [DllPlugin和DllReferencePlugin](#11. DllPlugin和DllReferencePlugin) 使用。

```js
// This will add a script tag to the HTML generated by html-webpack-plugin
new AddAssetHtmlPlugin({
  filepath: path.resolve(__dirname, '../dll/*.dll.js'),
  publicPath: buildConfig.assetsPublicPath + 'static/js',
  outputPath: '../dist/static/js',
  includeSourcemap: false
}),
```

### 14.2 疑问？ ###

该插件官网没有如下字段，但是不加如下字段的话就需要打包出来的 **dll.js 文件带有相应的 .map 文件，下面字段来源 [博客-简书](https://www.jianshu.com/p/6fb08d492b59)

```bash
includeSourcemap: false
```

## 15. compression-webpack-plugin ##

[参考-官网](<https://www.npmjs.com/package/compression-webpack-plugin>)

### 15.1 `cache` ###

Type: `Boolean|String` Default: `false`

Enable file caching. The default path to cache directory: `node_modules/.cache/compression-webpack-plugin`.

### 15.2 `minRatio` ###

Type: `Number` Default: `0.8`

Only assets that compress better than this ratio 

### 15.3 `include`、`exclude`、`test`

## 16. webpack-bundle-analyzer ##

[参考-官网](https://www.npmjs.com/package/webpack-bundle-analyzer)

**使用**

```js
// 动态转入 bundleAnalyzerReport
if (buildConfig.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}
```

## 17. html-webpack-plugin ##

[参考-官网](http://npm.taobao.org/package/add-asset-html-webpack-plugin)

### 17.1 **inject** ###

`true` `'head'` `'body'` ` false` Inject all assets into the given `template` or `templateContent`. When passing `true` or `'body'` all javascript resources will be placed at the bottom of the body element. `'head'` will place the scripts in the head element.default is true.

## 18. eslint-loader ##

[参考-npm]()

### 18.1 formatter (default: eslint stylish formatter) ###

Loader accepts a function that will have one argument: an array of eslint messages (object). The function must return the output as a string. You can use official eslint formatters.

**使用**

```js
{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
        options: {
          // several examples !
 
          // default value
          formatter: require("eslint/lib/formatters/stylish"),
 
          // community formatter
          formatter: require("eslint-friendly-formatter"),
 
          // custom formatter
          formatter: function(results) {
            // `results` format is available here
            // http://eslint.org/docs/developer-guide/nodejs-api.html#executeonfiles()
 
            // you should return a string
            // DO NOT USE console.*() directly !
            return "OUTPUT";
          }
        }
      }
```

### 18.2 emitError(default: false) ###

Loader will always return errors if this option is set to `true`.

```js
options: {
    emitError: true
}
```

### 18.3 `emitWarning` (default: `false`) ###

## 19. vue-loader 之 cacheDirectory(cache-loader) / cacheIdentifier ##

[参考-官网](<https://vue-loader.vuejs.org/zh/options.html#cachedirectory-cacheidentifier>)

- 类型：`string`
- 默认值：`undefined`

当这两个选项同时被设置时，开启基于文件系统的模板编译缓存 (需要在工程里安装  [cache-loader](#21. cache-loader) )。

```js
{
  test: /\.vue$/,
  loader: 'vue-loader',
  exclude: /node_modules/,
  include: resolve('src'),
  options: {
    cacheDirectory: resolve('./cache-loader'),
    cacheIdentifier: 'cache-loader:{version} {process.env.NODE_ENV}' // 标识
  }
},
```

> 在内部，`vue-loader` 和 [cache-loader](#21. cache-loader) 之间的交互使用了 [loader 的内联 import 语法](https://webpack.js.org/concepts/loaders/#inline)，`!`将会被认为是不同 loaders 之间的分隔符，所以请确保你的 `cacheDirectory` 路径中不包含 `!`。
>
> ***vue-loader 里面生成的 cache文件 和  其它地方生成的cache 文件不共享***

## 20. postcss ##

### 20.1 postcss-import ###

[参考-npm](<https://www.npmjs.com/package/postcss-import>)

```scss
/* can consume `node_modules`, `web_modules` or local modules */
@import "cssrecipes-defaults"; /* == @import "../node_modules/cssrecipes-defaults/index.css"; */
@import "normalize.css"; /* == @import "../node_modules/normalize.css/normalize.css"; */
 
@import "foo.css"; /* relative to css/ according to `from` option above */
 
@import "bar.css" (min-width: 25em);
 
body {
  background: black;
}
```

will give you:

```scss
/* 
... content of ../node_modules/cssrecipes-defaults/index.css 
*/

/*
... content of ../node_modules/normalize.css/normalize.css */
 
/*
... content of css/foo.css 
*/
 
@media (min-width: 25em) {
/* ... content of css/bar.css */
}
 
body {
  background: black;
}
```

### 20.2 postcss-url ###

[参考-npm](https://www.npmjs.com/package/postcss-url)

[PostCSS](https://github.com/postcss/postcss) plugin to rebase, inline or copy on url().

## 21. cache-loader ##

> [参考-腾讯云社区](<https://cloud.tencent.com/developer/section/1477510>)
>
> [在vue-loader中使用](#19. vue-loader 之 cacheDirectory(cache-loader) / cacheIdentifier)
>
> **请注意，****保存读取和保存缓存文件会产生开销**，因此**只能使用此加载程序来缓存昂贵的加载程序。**

在一些性能开销较大的 loader 之前添加此 loader，以将结果缓存到磁盘里。

```js
{
  test: /\.js$/,
  use: isProduction ? [
    // 在磁盘（默认）或数据库中缓存后续loader的结果
    {
      loader: 'cache-loader',
      options: {
        cacheDirectory: resolve('cache-loader'),
      }
    },
    'babel-loader'
  ] : 'babel-loader',
  exclude: /node_modules/,
  include: resolve('src')
},
```

## 22. babel ##

> **plugin: babel的插件，在6.x版本之后babel必需要配合插件来进行工作**
>
> **preset: babel插件集合的预设，包含某一部分的插件plugin**

### 22.1 Polyfill ###

[参考-官网](<https://www.babeljs.cn/docs/usage/polyfill/>)

它会仿效一个完整的 ES2015+ 环境，并意图运行于一个应用中而不是一个库/工具。这个 polyfill 会在使用 `babel-node` 时自动加载。

这意味着你可以使用新的内置对象比如 `Promise` 或者 `WeakMap`, 静态方法比如 `Array.from` 或者 `Object.assign`, 实例方法比如 `Array.prototype.includes` 和生成器函数（提供给你使用 [regenerator](https://www.babeljs.cn/docs/plugins/transform-regenerator/) 插件）。为了达到这一点， polyfill 添加到了全局范围，就像原生类型比如 `String` 一样。

在 `webpack.config.js` 中，将 `babel-polyfill` 加到你的 entry 数组中：

```js
module.exports = {
  entry: ["babel-polyfill", "./app/js"]
};
```

### 22.2 babel-core ###

Babel 的核心依赖包

### 22.3 babel-preset-stage-2 和 babel-preset-env ###

[参考-博客](https://www.cnblogs.com/zhaozhipeng/p/8267741.html)

babel-preset-es2015: 可以将es2015即es6的js代码编译为es5

babel-preset-es2016: 可以将es2016即es7的js代码编译为es6

babel-preset-es2017: 可以将es2017即es8的js代码编译为es7

babel-preset-stage-x: 可以将处于某一阶段的js语法编译为正式版本的js代码

stage-X: 指处于某一阶段的js语言提案。

- 提案共分为五个阶段：
- *stage-0: 稻草人-只是一个大胆的想法*
- *stage-1: 提案-初步尝试*
- *stage-2: 初稿-完成初步规范*
- *stage-3: 候选-完成规范和浏览器初步实现*
- *stage-4: 完成-将被添加到下一年发布*

 

**当前 babel 推荐使用 babel-preset-env 替代 babel-preset-es2015 和 babel-preset-es2016 以及 babel-preset-es2017 ,env的支持范围更广，包含es2015 es2016 es2017的所有语法编译，并且它可以根据项目运行平台的支持情况自行选择编译版本。**

使用方法： '.babelrc' 中 'es2015' 改为 'env'，

```js
"presets": ["env", "stage-2"]
```

### 22.4 注意 ###

**插件中每个访问者都有排序问题。**

这意味着如果两次转译都访问相同的”程序”节点，则转译将按照 plugin 或 preset 的规则进行排序然后执行。

- Plugin 会运行在 Preset 之前。
- Plugin 会从第一个开始顺序执行。ordering is first to last.
- Preset 的顺序则刚好相反(从最后一个逆序执行)。

### 22.5 babel 转化后的代码分析 ###

[babel到底将代码转换成什么鸟样？](<http://ju.outofmemory.cn/entry/259973>)

[es 6 在线转换平台](https://es6console.com/)

[babel 在线转化平台](https://babeljs.io/repl)

#### 22.5.1 中括号解释属性 ####

```js
const prop2 = "PROP2";
var obj = {
    ['prop']: 1,
    ['func']: function() {
        console.log('func');
    },
    [prop2]: 3
};
```

**转**

```js
var _obj;
// 已美化
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
 
var prop2 = "PROP2";
var obj = (
    _obj = {},
    _defineProperty(_obj, 'prop', 1),
    _defineProperty(_obj, 'func', function func() {
   		console.log('func');
	}), 
    _defineProperty(_obj, prop2, 3),
    _obj,
);
```

#### 22.5.2 Object.assign 和 Object.is  ####

es6新增的Object.assign极大方便了对象的克隆复制。但babel的es2015 preset并不支持，所以没对其进入转换，这会使得一些移动端机子遇到这种写法会报错。所以一般开发者都会使用object-assign这个npm的库做兼容。

[@babel/plugin-transform-object-assign](<https://babeljs.io/docs/en/babel-plugin-transform-object-assign/>)

[webpack babel 怎么将Object.assign() 转成es5语法](https://segmentfault.com/q/1010000006626971)

#### 22.5.3 类class  ####

```js
class Animal {
 
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }
 
    walk() {
        console.log('walk');
    }
 
    run() {
        console.log('run')
    }
 
    static getType() {
        return this.type;
    }
 
    get getName() {
        return this.name;
    }
 
    set setName(name) {
        this.name = name;
    }
 
 
}
 
class Dog extends Animal {
    constructor(name, type) {
        super(name, type);
    }
 
    get getName() {
        return super.getName();
    }
}
```

**转**

```js
"use strict";
// 子类实现constructor
function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    // 若call是函数/对象则返回
    return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

// 继承类
function _inherits(subClass, superClass) {
   // 父类一定要是function类型
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }
    // 使原型链subClass.prototype.__proto__指向父类superClass.prototype，同时保证constructor是subClass自己
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    // 保证subClass.__proto__指向父类superClass
    if (superClass) 
        Object.setPrototypeOf ? 
        Object.setPrototypeOf(subClass, superClass) :    subClass.__proto__ = superClass;
}

// 检测 当前 class 的调用方式
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

// 创建类
var _createClass = (function() {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            // es6规范要求类方法为non-enumerable
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            // 对于setter和getter方法，writable为false
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }
    return function(Constructor, protoProps, staticProps) {
        // 非静态方法定义在原型链上
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        // 静态方法直接定义在constructor函数上
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
})();

var Animal = (function () {
    function Animal(name, type) {
        // 此处是constructor的实现，用_classCallCheck来判定constructor正确与否
        _classCallCheck(this, Animal);
 
        this.name = name;
        this.type = type;
    }
        // _creatClass用于创建类及其对应的方法
    _createClass(Animal, [{
        key: 'walk',
        value: function walk() {
            console.log('walk');
        }
    }, {
        key: 'run',
        value: function run() {
            console.log('run');
        }
    }, {
        key: 'getName',
        get: function get() {
            return this.name;
        }
    }, {
        key: 'setName',
        set: function set(name) {
            this.name = name;
        }
    }], [{
        key: 'getType',
        value: function getType() {
            return this.type;
        }
    }]);
 
    return Animal;
})();
 
var Dog = (function (_Animal) {
        // 子类继承父类
    _inherits(Dog, _Animal);
 
    function Dog(name, type) {
        _classCallCheck(this, Dog);
                // 子类实现constructor
                // babel会强制子类在constructor中使用super，否则编译会报错
        return _possibleConstructorReturn(this, Object.getPrototypeOf(Dog).call(this, name, type));
    }
 
    _createClass(Dog, [{
        key: 'getName',
        get: function get() {
          // 跟上文使用super调用原型链的super编译解析的方法一致，
          // 也是自己写了一个回溯prototype原型链
            return _get(Object.getPrototypeOf(Dog.prototype), 'getName', this).call(this);
        }
    }]);
 
    return Dog;
})(Animal);
```

#### 22.5.4 模块化  ####

es6的模块加载是属于**多对象多加载**，而**commonjs则属于单对象单加载**。babel需要做一些手脚才能将es6的模块写法写成commonjs的写法。主要是通过定义**`__esModule`**这个属性来判断这个模块是否经过babel的编译。然后通过_interopRequireWildcard对各个模块的引用进行相应的处理。

通过webpack打包babel编译后的代码，每一个模块里面都包含了相同的类继承帮助方法，这是开发时忽略的。在开发的时候用es5的语法可能会比使用es6的class能使js bundle更小。

```JS
// t2.js
export class Person {
}
 
export class Plane {
}

// ///////////////==>

// t2.js的模块
Object.defineProperty(exports, "__esModule", {
    value: true
});
 
// 省略一些类继承的方法
 
var Person = exports.Person = function Person() {
    _classCallCheck(this, Person);
};
 
var Plane = exports.Plane = function Plane() {
    _classCallCheck(this, Plane);
};
```



**导入的转化**

```js
import { Animal as Ani, catwalk } from "./t1";
import * as All from "./t2";

Ani();
catwalk();
```

**转**

```js
"use strict";

var _t = require("./t1");

var _t2 = require("./t2");

var All = _interopRequireWildcard(_t2);

function _interopRequireWildcard(obj) {
    // 发现是babel编译的， 直接返回
    if (obj && obj.__esModule) {
        return obj;
    }
   // 非babel编译， 猜测可能是第三方模块，为了不报错，让default指向它自己
    else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
            }
        }
        newObj.default = obj;
        return newObj;
    }
}


(0, _t.Animal)();
(0, _t.catwalk)();
```



**导出的转化**

```js
export function catwal() {
    console.log('cat walk');
};
```

**转**

```js
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.catwal = catwal;
function catwal() {
    console.log('cat walk');
};
```

#### 22.5.5 let const ####

```js
const a3 = 3;
var a4 = 5;
let a1 = 1; 
{
    let a1 = 2;
    {
        let a1 = 4;
      	{
        	let a1 = 6;
        }
    }
}
a1 = 3;
```

**转**

```js
"use strict";

var a3 = 3;
var a4 = 5;
var a1 = 1;
{
  var _a = 2;
  {
    var _a2 = 4;
    {
      var _a3 = 6;
    }
  }
}
a1 = 3;
```

#### 22.5.6 箭头函数 ####

```js
var obj = {
    prop: 1,
    func: function() {
        var innerFunc = () => {
            this.prop = 1;
        };
 
        var innerFunc1 = function() {
            this.prop = 1;
        };
    },
 
};
```

**转**

```js
"use strict";

var obj = {
  prop: 1,
  func: function func() {
    var _this = this;

    var innerFunc = function innerFunc() {
      _this.prop = 1;
    };

    var innerFunc1 = function innerFunc1() {
      this.prop = 1;
    };
  }
};
```

#### 22.5.7 使用super去调用prototype  ####

```js
var obj = {
    toString() {
     // Super calls
     return "d " + super.toString();
    },
};
```

**转**

```js
var _obj;
// 已美化
var _get = function get(object, property, receiver) {
   // 如果prototype为空，则往Function的prototype上寻找
    if (object === null) object = Function.prototype;
    var desc = Object.getOwnPropertyDescriptor(object, property);
    if (desc === undefined) {
        var parent = Object.getPrototypeOf(object);
        // 如果在本层prototype找不到，再往更深层的prototype上找
        if (parent === null) {
            return undefined;
        } else {
            return get(parent, property, receiver);
        }
    }
    // 如果是属性，则直接返回
    else if ("value" in desc) {
        return desc.value;
    }
    // 如果是方法，则用call来调用，receiver是调用的对象 
    else {
        var getter = desc.get;  // getOwnPropertyDescriptor返回的getter方法
        if (getter === undefined) {
            return undefined;
        }
        return getter.call(receiver);
    }
};
 
var obj = _obj = {
  toString: function toString() {
    // Super calls
    return "d " + _get(Object.getPrototypeOf(_obj), "toString", this).call(this);
  }
};
```

#### 22.5.8 Generator 函数 ####

```js
const gen = function* () {
  const f1 = yield readFile('/etc/fstab');
  const f2 = yield readFile('/etc/shells');
  console.log(f1.toString());
  console.log(f2.toString());
};


// 转换为


"use strict";
var gen =
/*#__PURE__*/
regeneratorRuntime.mark(function gen() {
  var f1, f2;
  return regeneratorRuntime.wrap(function gen$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return readFile('/etc/fstab');

        case 2:
          f1 = _context.sent;
          _context.next = 5;
          return readFile('/etc/shells');

        case 5:
          f2 = _context.sent;
          console.log(f1.toString());
          console.log(f2.toString());

        case 8:
        case "end":
          return _context.stop();
      }
    }
  }, gen);
});
```

#### 22.5.9 Async ####

```js
const fetchValue = async function () {
    var value1 = await fetchData(1);
    var value2 = await fetchData(value1);
    var value3 = await fetchData(value2);
    console.log(value3)
};

fetchValue();
```

**转化**

```js
function _asyncToGenerator(fn) {
  return function() {
   // ...
  };
}

var fetchValue = (function() {
  var _ref = _asyncToGenerator(
    /*#__PURE__*/ regeneratorRuntime.mark(function _callee() {
      var value1, value2, value3;
      return regeneratorRuntime.wrap(
        function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return fetchData(1);

              case 2:
                value1 = _context.sent;
                _context.next = 5;
                return fetchData(value1);

              case 5:
                value2 = _context.sent;
                _context.next = 8;
                return fetchData(value2);

              case 8:
                value3 = _context.sent;

                console.log(value3);

              case 10:
              case "end":
                return _context.stop();
            }
          }
        },
        _callee,
        this
      );
    })
  );

  return function fetchValue() {
    return _ref.apply(this, arguments);
  };
})();

fetchValue();
```



#### 22.5.10 Promise ####

```js
const fetchData = (data) => new Promise((resolve) => setTimeout(resolve, 1000, data + 1))


// 转换

var fetchData = function fetchData(data) {
  return new Promise(function(resolve) {
    return setTimeout(resolve, 1000, data + 1);
  });
};

```



## 23. css-loader 和style-loader ##

- `css-loader`: 加载.css文件，将@import 和 url() 转换成 import/require()
- `style-loader`:使用`<style>`将css-loader内部样式注入到我们的HTML页面

## 24. 其他 ##

### 24.1 happypack 和 thread-loader ###

[***happypack-参考-npm***](https://www.npmjs.com/package/happypack)，[***thread-loader-参考-webpack***](<https://www.webpackjs.com/loaders/thread-loader/>) 

***HappyPack*** 通过[并行](https://www.npmjs.com/package/happypack#how-it-works)转换文件使得初始webpack构建更快。

***thread-loader*** 可以将非常消耗资源的 loaders 转存到 worker pool 中。

### 23.2 friendly-errors-webpack-plugin 和 node-notifier ###

devServer.quit = true；

弹窗提示

### 24.3. rimraf ###

可以实现文件的删除。

> 替代了 CleanWebpackPlugin 的作用

```js
rm(path.join(...), err => {
  if (err) throw err
  webpack(webpackConfig, (err, stats) => {
    if (err) throw err
    ...
  })
})
```

### 24.4 shelljs ###

nodejs 的shell 命令模块

### 24.5 Vue-template-compiler ###

[博客-Vue-template-compiler 和vue-loader 的关系是怎么样的?马上就要合二为一了？](https://segmentfault.com/q/1010000011811513)

You will only need it if you are writing build tools with very specific needs. In most cases you should be using vue- loader or vueify instead, both of which use this package internally.

[VUE社区-安装了vue-loader之后，还需要vue-template-compiler吗](https://forum.vuejs.org/t/vue-loader-vue-template-compiler/49497)

但凡用了 Vue 模板就需要这个编译器，但 vue-loader 并没有显式依赖 vue-template-compiler（不清楚确切原因，猜测单纯是为了解耦，因为理论上 vue-loader 并不关心模板编译的过程），而是假设用户自行解决了这个依赖，如果你没安装就报错了。

> Vue-loader 依赖 Vue-template-compiler 