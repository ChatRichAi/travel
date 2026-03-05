# Mindtrip 风格设计系统

## 设计概述

受 Mindtrip.ai 启发的极简、沉浸式 AI 旅行规划界面设计系统。

### 核心设计理念
- **极简主义**: 少即是多，留白即奢华
- **对话优先**: 以 AI 对话为核心的交互模式
- **视觉叙事**: 通过图像和地图讲述旅行故事
- **电影感**: 精心设计的动效和过渡

## 色彩系统

### 主色调
```
--color-primary: #1a1a2e        /* 深蓝黑色 - 主要文字 */
--color-secondary: #4a4a6a      /* 次要文字 */
--color-accent: #6366f1         /* 靛蓝点缀 - 按钮/高亮 */
--color-accent-light: #818cf8   /* 浅靛蓝 - 悬停状态 */
```

### 中性色
```
--color-bg: #fafafa             /* 米白背景 */
--color-surface: #ffffff        /* 纯白表面 */
--color-border: #e5e7eb         /* 边框色 */
--color-muted: #9ca3af          /* 淡化文字 */
```

### 语义色
```
--color-success: #10b981        /* 翡翠绿 */
--color-warning: #f59e0b        /* 琥珀黄 */
--color-error: #ef4444          /* 玫瑰红 */
```

## 排版系统

### 字体
- **主字体**: Inter, system-ui, -apple-system, sans-serif
- **备选**: 'SF Pro Display', 'Segoe UI', Roboto

### 字号层级
```
H1: 48px / 700 / -0.02em       /* 主标题 */
H2: 32px / 600 / -0.01em       /* 章节标题 */
H3: 24px / 600 / 0             /* 卡片标题 */
H4: 18px / 500 / 0             /* 小标题 */
Body: 16px / 400 / 0           /* 正文 */
Small: 14px / 400 / 0          /* 辅助文字 */
Caption: 12px / 500 / 0.05em   /* 标签 */
```

## 间距系统

### 基础单位: 4px
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
4xl: 96px
```

## 圆角系统
```
sm: 8px
md: 12px
lg: 16px
xl: 24px
full: 9999px
```

## 阴影系统
```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)
lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)
xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)
```

## 组件规范

### 1. Chat Message Bubble
- 用户消息: 右侧，靛蓝背景，白色文字
- AI 消息: 左侧，白色背景，浅色边框
- 圆角: 16px (用户右上圆角，AI 左上圆角)
- 内边距: 16px
- 最大宽度: 80%

### 2. Trip Card
- 白色背景，圆角 16px
- 阴影: md
- 图片区域: 顶部，圆角 12px，16:9 比例
- 内容区域: 16px 内边距
- 悬停: 阴影 xl，轻微上浮

### 3. Map Panel
- 右侧固定，占 50% 宽度
- 深色地图样式
- 地点标记: 靛蓝圆点 + 脉冲动画

### 4. Input Field
- 底部固定输入框
- 圆角 full (药丸形)
- 白色背景，浅色边框
- 聚焦: 靛蓝边框

### 5. Day Section
- 左侧时间线设计
- 表情符号标记时间段: ☀️ 🌤️ 🌙
- 垂直连接线

## 动效规范

### 过渡时间
```
fast: 150ms
default: 300ms
slow: 500ms
slower: 700ms
```

### 缓动函数
```
default: cubic-bezier(0.4, 0, 0.2, 1)
enter: cubic-bezier(0, 0, 0.2, 1)
leave: cubic-bezier(0.4, 0, 1, 1)
spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

### 常用动效
1. **Fade In Up**: opacity 0→1, translateY 20px→0, 500ms
2. **Scale In**: scale 0.95→1, opacity 0→1, 300ms
3. **Slide In**: translateX -20px→0, opacity 0→1, 300ms
4. **Pulse**: scale 1→1.05→1, 2s infinite

## 布局模式

### 主布局
```
┌─────────────────────────────────────────┐
│  Logo              Nav            User  │  ← Header (固定)
├─────────────────────┬───────────────────┤
│                     │                   │
│   Chat / Itinerary  │       Map         │  ← 50/50 分屏
│      (滚动)         │    (固定/粘性)    │
│                     │                   │
├─────────────────────┴───────────────────┤
│        Input Bar (底部固定)              │
└─────────────────────────────────────────┘
```

### 响应式断点
```
sm: 640px   - 移动端，单栏布局
md: 768px   - 平板，可选分屏
lg: 1024px  - 桌面，固定分屏
xl: 1280px  - 大屏，更宽边距
```

## 交互模式

### 1. 聊天交互
- 输入时显示"正在输入"指示器
- 消息淡入动画
- AI 回复流式显示效果

### 2. 卡片交互
- 悬停: 上浮 4px + 阴影增强
- 点击: 轻微缩小 + 导航

### 3. 地图交互
- 地点标记点击高亮
- 平滑飞行动画
- 与左侧列表联动

## 设计原则

1. **内容优先**: 让旅行内容成为视觉焦点
2. **呼吸空间**: 充足的留白创造奢华感
3. **一致性**: 统一的圆角、阴影、色彩
4. **反馈**: 即时的视觉反馈让用户安心
5. **无障碍**: 足够的对比度，支持键盘导航
