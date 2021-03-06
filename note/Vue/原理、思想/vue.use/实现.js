/**
 * @author NZQ
 * @data 2019/3/12
 * @Description : 主要参考 ———— https://segmentfault.com/a/1190000012296163
 */

export function initUse (Vue) {
  Vue.use = function (...args) {
    const plugin = args.shift()
    args.unshift(this); // 传入 Vue
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))

    // 已经注册了
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    if (typeof plugin.install === 'function') {
      plugin.install.apply(this, plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(this, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
