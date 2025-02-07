import * as Sentry from "@sentry/react";

Sentry.init({
  environment: process.env, // 环境
  dsn: "https://ba77f1d3a97b52c9842665351cb8c128@sentry.test.io/3", // 项目DSN
  integrations: [
    Sentry.browserTracingIntegration(), // 开启浏览器性能监控
    Sentry.browserProfilingIntegration(), // 开启浏览器性能分析
    Sentry.replayIntegration({   // 开启会话重放
      stickySession: true,  // 无论页面是否刷新，都会跟踪用户。请注意，关闭标签页会结束会话，因此使用多个标签页的单个用户将被记录为多个会话。
      mutationLimit: 1500, // 会话录屏停止录制之前要处理的突变的上限
      mutationBreadcrumbLimit: 1000,  // 会话录屏发送 页面发生较大突变之前要处理的突变上限
      minReplayDuration: 5000,  // 会话录屏时常（以毫秒为单位）。最大值为 15000。
      workerUrl: undefined, //  用于压缩重放数据的自托管工作器的 URL
      networkDetailAllowUrls: [], //捕获 XHR 的请求和响应详细信息并获取与给定 URL 匹配的请求。
      networkCaptureBodies: true, // 决定是否捕获 networkDetailAllowUrls 中定义的 URL 的请求和响应主体。
      networkDetailDenyUrls: [], // 不捕获这些 URL 的请求和响应详细信息。优先于 networkDetailAllowUrls。
      slowClickIgnoreSelectors: [], //忽略与给定 CSS 选择器匹配的元素上的快速或者慢速点击检测。
      maskAllText: false, // 隐私保护 文字 屏蔽
      blockAllMedia: false, // 隐私保护 视频  屏蔽
    }),
  ],
  maxBreadcrumbs: 50, // 面包屑最大数量
  useCompression: true,  // 是否使用压缩 默认就是开启，设置参数不管用
  beforeBreadcrumb: (breadcrumb) => {
    // 如果是 console 日志
    if (breadcrumb.category === 'console') {
      // 如果数据太长，进行截断
      if (breadcrumb.message && breadcrumb.message.length > 500) {
        breadcrumb.message = breadcrumb.message.substring(0, 500) + '...';
      }
      // 可以选择性地过滤掉一些不重要的日志级别
      if (breadcrumb.level === 'debug') {
        return null; // 返回 null 将会丢弃这条日志
      }
    }
    // 如果是 xhr/fetch 请求
    if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
      // 可以清理或压缩数据
      if (breadcrumb.data) {
        delete breadcrumb.data.headers; // 删除请求头信息
        if (breadcrumb.data.body && breadcrumb.data.body.length > 1000) {
          breadcrumb.data.body = '[BODY_TOO_LARGE]';
        }
      }
    }

    return breadcrumb;
  },
  tracesSampleRate: 1.0,  // 采样率:监控追踪数据100%采集
  tracePropagationTargets: [/ida-it\.com/i, /tapbit\.(?:io|tw|com|net)/i], // 仅对指定域名的请求进行追踪(域名+path)
  profilesSampleRate: 1.0, // 采样率:性能数据100%采集
  replaysSessionSampleRate: 0.1, // 采样率:会话重放数据10%采集
  replaysOnErrorSampleRate: 1.0, // 采样率:错误重放数据100%采集
});

window.Sentry = Sentry

// 数据埋点
// 1、 Sentry.init 配置
Sentry.init({
  // 添加默认标签
  defaultTags: {
    environment: 'production',
    platform: 'web'
  },
  // 添加默认上下文
  initialScope: {
    tags: { version: '1.0.0' },
    user: { role: 'user' },
    extras: { region: 'CN' }
  },
});
 
**********************
 
// 2、 设置全局用户信息
Sentry.setUser({
  id: '1111',
  email:'userEmail',
  role: 'userRole'
});
 
// 设置全局标签
Sentry.setTag('app_version', '1.0.0');
Sentry.setTags({
  platform: 'web',
  region: 'asia'
});
 
// 设置全局额外信息
Sentry.setExtra('deployEnvironment', 'staging');
Sentry.setExtras({
  serverRegion: 'east-asia',
  buildTime: process.env.BUILD_TIME
});
 
*********************
 
// 3、使用 beforeSend 钩子添加通用数据
Sentry.init({
  beforeSend(event, hint) {
    // 添加自定义上下文
    event.extra = {
      ...event.extra,
      deviceInfo: getDeviceInfo(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
     
    // 添加自定义标签
    event.tags = {
      ...event.tags,
      appVersion: process.env.VERSION,
      buildNumber: process.env.BUILD_NUMBER
    };
     
    // 可以过滤或修改事件
    if (event.exception) {
      event.fingerprint = ['{{ default }}', event.exception.values[0].type];
    }
     
    return event;
  }
});

