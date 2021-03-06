/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import { mark, measure } from '../util/perf'
import { createEmptyVNode } from '../vdom/vnode'
import { updateComponentListeners } from './events'
import { resolveSlots } from './render-helpers/resolve-slots'
import { toggleObserving } from '../observer/index'
import { pushTarget, popTarget } from '../observer/dep'

import {
  warn,
  noop,
  remove,
  emptyObject,
  validateProp,
  invokeWithErrorHandling
} from '../util/index'

// 这个变量将总是保存着当前正在渲染的实例的引用，
// 所以它就是当前实例 components 下注册的子组件的父实例，
// 所以 Vue 实际上就是这样做到自动侦测父级的。
export let activeInstance: any = null
// isUpdatingChildComponent 初始值为 false，只有当
// updateChildComponent 函数开始执行的时候会被更新为 true，
// 当 updateChildComponent 执行结束时又将
// isUpdatingChildComponent 的值还原为 false，
// 这是因为 updateChildComponent 函数需要更新实例对象的
// $attrs 和 $listeners 属性，所以此时是不需要提示 $attrs
// 和 $listeners 是只读属性的。
export let isUpdatingChildComponent: boolean = false

// nzq_mark
// 保存活动实例
export function setActiveInstance(vm: Component) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}

// nzq_mark
// 初始化一些生命周期的变量
export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  // 定义 parent，它引用当前实例的父实例
  let parent = options.parent
  // 如果当前实例有父组件，且当前实例不是抽象的
  // keep-alive 或者 transition，这两个组件它是不会渲染DOM至页
  // 面的、不会出现在父子关系的路径上。但他们依然给我提供了很有
  // 用的功能，他们是抽象的
  if (parent && !options.abstract) {
    // 使用 while 循环查找第一个非抽象的父组件
    
    // 抽象的组件是不能够也不应该作为父级的(keep-alive transition)
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    // 经过上面的 while 循环后，parent 应该是一个非抽象的组件，
    // 将它作为当前实例的父级，所以将当前实例 vm 添加到父级的 $children 属性里
    parent.$children.push(vm)
  }

  // 添加一些属性
  // 设置当前实例的 $parent 属性，指向父级
  vm.$parent = parent
  // 设置 $root 属性，有父级就是用父级的 $root，否则 $root 指向自身
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}

// nzq_mark
export function lifecycleMixin (Vue: Class<Component>) {
  // nzq_mark
  // 官网解释说是:“可以说这三个方法一般是用不到的,除非你代码出问题了~”

  // vnode对象更新时候触发
  // 把 vm._render 函数生成的虚拟节点渲染成真正的 DOM
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  }

  // 强制更新vnode对象Vue.prototype
  Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  // 销毁当前vnode对象
  Vue.prototype.$destroy = function () {
    const vm: Component = this
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy')
    vm._isBeingDestroyed = true
    // remove self from parent
    const parent = vm.$parent
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm)
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    let i = vm._watchers.length
    while (i--) {
      vm._watchers[i].teardown()
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    // call the last hook...
    vm._isDestroyed = true
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null)
    // fire destroyed hook
    callHook(vm, 'destroyed')
    // turn off all instance listeners.
    vm.$off()
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
  }
}

export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  // 为什么我们在beforecreated跟created方法中拿不到this.el的原因,因为this.el？
  // 因为this.el的原因,因为this.el还没被赋值.
  // (1). vm.$el 始终是组件模板的根元素
  // (2). 没有传递 template 选项，el 选项指定的挂载点将被作为组件模板
  // 这里明明把 el 挂载元素赋值给了 vm.$el，那么 vm.$el 怎么可能引用的是 template 选项指定的模板的根元素呢？其实这里仅仅是暂时赋值而已，这是为了给虚拟DOM的 patch 算法使用的，实际上 vm.$el 会被 patch 算法的返回值重写，可见 Vue.prototype._update 方法
  vm.$el = el
  // 没有render 方法的时候
  if (!vm.$options.render) {
    // 创建一个空的vnode
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        // 非生产环境下会根据相应的情况打印警告信息
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }

  callHook(vm, 'beforeMount')

  // 这个函数将用作创建 Watcher 实例时传递给 Watcher 构造函数的第二个参数
  // 把渲染函数生成的虚拟DOM渲染成真正的DOM
  // 数据变化时将重新执行 updateComponent 函数，这就完成了重新渲染
  let updateComponent
  /* istanbul ignore if */

  // 这一段做相应的性能检测 updateComponent 的结果不变
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      // vm._render 函数的作用是调用 vm.$options.render 函数并返回生成的虚拟节点(vnode)
      // vm._update 函数的作用是把 vm._render 函数生成的虚拟节点渲染成真正的 DOM
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  // 渲染函数的观察者
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}

export function updateChildComponent (
  vm: Component,
  propsData: ?Object,
  listeners: ?Object,
  parentVnode: MountedComponentVNode,
  renderChildren: ?Array<VNode>
) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren.

  // check if there are dynamic scopedSlots (hand-written or compiled but with
  // dynamic slot names). Static scoped slots compiled from template has the
  // "$stable" marker.
  const newScopedSlots = parentVnode.data.scopedSlots
  const oldScopedSlots = vm.$scopedSlots
  const hasDynamicScopedSlot = !!(
    (newScopedSlots && !newScopedSlots.$stable) ||
    (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
    (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key)
  )

  // Any static slot children from the parent may have changed during parent's
  // update. Dynamic scoped slots may also have changed. In such cases, a forced
  // update is necessary to ensure correctness.
  const needsForceUpdate = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    hasDynamicScopedSlot
  )

  vm.$options._parentVnode = parentVnode
  vm.$vnode = parentVnode // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode
  }
  vm.$options._renderChildren = renderChildren

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = parentVnode.data.attrs || emptyObject
  vm.$listeners = listeners || emptyObject

  // update props
  if (propsData && vm.$options.props) {
    toggleObserving(false)
    const props = vm._props
    const propKeys = vm.$options._propKeys || []
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i]
      const propOptions: any = vm.$options.props // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    toggleObserving(true)
    // keep a copy of raw propsData
    vm.$options.propsData = propsData
  }

  // update listeners
  listeners = listeners || emptyObject
  const oldListeners = vm.$options._parentListeners
  vm.$options._parentListeners = listeners
  updateComponentListeners(vm, listeners, oldListeners)

  // resolve slots + force update if has children
  if (needsForceUpdate) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }

  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = false
  }
}

function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) return true
  }
  return false
}

// nzq_mark
// 激活 keep-alive
export function activateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i])
    }
    callHook(vm, 'activated')
  }
}

// nzq_mark
// 停用 keep-alive
export function deactivateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    callHook(vm, 'deactivated')
  }
}

// nzq_mark
// 使用 对应hook 函数
export function callHook (vm: Component, hook: string) {
  // disable dep collection when invoking（调用） lifecycle hooks
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget()
  // 生命周期钩子选项最终会被合并处理成一个数组
  // handlers 就是对应生命周期钩子的数组
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  // 执行 对应 hook 下面的函数
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, null, vm, info)
    }
  }
  //  vm._hasHookEvent 是在 initEvents 函数中定义的，它的作用
  // 是判断是否存在生命周期钩子的事件侦听器，初始化值为 false
  // 代表没有，当组件检测到存在生命周期钩子的事件侦听器时，会将
  // vm._hasHookEvent 设置为 true
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }

  // 对应上面得 pushTarget
  popTarget()
}
