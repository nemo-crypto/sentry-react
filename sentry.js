import * as Sentry from "@sentry/react";

// sentry 版本对应 24.9.0
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

// 数据埋点 自定义参数
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
 
/**********************/
 
// 2、 设置全局用户信息或者用户相关参数
Sentry.setUser({
  id: '1111',
  email:'userEmail',
  role: 'userRole'
});

// 管理后台Issues 中通过 user.id:11111 来查询
 
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
 
/*********************/
 
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

// 自定义事件上报  类似于 数据 埋点
Sentry.captureEvent({
  message: "用户切换主题",
  level: "info",
  tags: {
    button_id: "theme_button",
    user_type: "vip"
  },
  extra: {
    theme: newTheme,
    currency: "CNY"
  }
});

-上报延迟策略-

对于 Sentry 的数据上报，包括错误、性能监控和回放录屏，通常不是立即上报。这是因为立即上报每个小的数据点会导致大量的网络请求，这不仅影响应用的性能，还可能导致服务器的过载。因此，Sentry 设计了一种更加高效的数据上报机制：
1. 批量上报：Sentry 客户端会收集一定量的数据或在一定时间内积累数据后，再统一发送到服务器。这种方法可以减少网络请求的次数，从而减轻服务器的压力并提高客户端性能。
2. 异步上报：数据的发送通常是异步进行的，这意味着它不会阻塞主线程的其他操作。这对于保持应用的响应性和流畅性至关重要。
3. 智能调整：在网络状况不佳或设备性能低下时，Sentry 客户端可能会调整数据发送的策略，例如延迟发送或减少发送的数据量。
Sentry 的回放录屏功能（Session Replay）默认采用批量和延迟上报的方式，以优化性能和减少对用户体验的影响。如果你希望调整这种上报行为，使其能够更快地上报数据，可以通过配置 Sentry 客户端的相关设置来尝试实现。
调整上报策略;虽然 Sentry 官方文档中没有直接提供将回放录屏数据设置为立即上报的选项，但你可以通过以下方式尝试优化数据上报的及时性：
1. 减少批量大小：通过调整批量上报的大小，可以使数据更频繁地发送。这可以通过调整 maxBreadcrumbs 或相关配置来尝试实现。
2. 调整会话结束策略：Sentry 会在会话结束时发送所有未发送的数据。你可以通过程序逻辑控制会话的结束时机，从而触发数据的发送。
3. 使用 Flush API：Sentry SDK 提供了 flush() 方法，该方法可以用来手动触发数据的发送。你可以在关键时刻调用此方法，以确保数据尽快被发送到服务器。

