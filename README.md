# D&D 5e AI 跑团平台前端

一个基于 React + Vite 构建的 D&D 5e AI 跑团平台前端，支持角色创建、AI 灵感建卡、房间管理和实时游戏（聊天、战斗面板、地图网格）。配合 [dnd_backend](https://github.com/16yunH/dnd_backend) 后端使用，提供完整的 AI 驱动跑团体验。

## 功能特性

- **访客登录** — 输入昵称即可快速加入
- **角色创建** — 手动填写种族、职业、属性等完整建卡流程
- **AI 灵感建卡** — 通过 AI 自动生成角色灵感，一键填充角色表
- **房间大厅** — 创建/加入房间、选择角色、准备开始
- **AI DM 聊天** — 与 AI 地下城主实时对话，推动剧情
- **战斗面板** — Initiative 顺序、HP 追踪、回合操作
- **地图网格** — SVG Token 可视化，支持角色/怪物定位

## 技术栈

- **React 19** + **Vite 6**
- **TailwindCSS 3** + 自定义 D&D 主题色（`dnd-gold`、`dnd-red`）
- **Socket.IO Client** — 实时通信
- **react-router-dom** — 前端路由

## 前置要求

- **Node.js** 20+
- **npm**

## 快速开始

> ⚠️ **请先启动后端服务**，参考 [dnd_backend](https://github.com/16yunH/dnd_backend) 仓库的说明。

```bash
# 克隆仓库
git clone https://github.com/16yunH/dnd-char-creator.git
cd dnd-char-creator

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后访问 http://localhost:5173 即可使用。

## 环境配置

- 前端默认通过 Vite 开发代理访问后端（`/api` → `http://localhost:4100`），无需额外配置
- 如需直连后端，修改 `src/lib/api.js` 中的 `API_BASE_URL`：

```js
const API_BASE_URL = 'http://your-backend-host:port/api';
```

## 开发脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |

## 项目结构

```
src/
├── App.jsx                # 路由配置
├── lib/api.js             # API 调用层
├── pages/
│   ├── Login.jsx          # 登录页
│   ├── CharacterCreator.jsx  # 角色创建（含 AI 建卡）
│   ├── RoomLobby.jsx      # 房间大厅
│   └── GameRoom.jsx       # 游戏房间（聊天+战斗+地图）
└── index.css              # 全局样式 + D&D 主题
```

## 页面功能说明

### Login（登录页）

访客登录，输入昵称即可进入平台，无需注册。

### CharacterCreator（角色创建）

- 手动建卡：填写角色名称、种族、职业、属性值等
- AI 灵感建卡：在 AI 面板中输入创意描述，AI 自动生成角色灵感并填充角色表

### RoomLobby（房间大厅）

- 创建新房间或加入已有房间
- 选择已创建的角色加入房间
- 所有玩家准备后即可开始游戏

### GameRoom（游戏房间）

- **AI DM 聊天** — 与 AI 地下城主对话，推动剧情发展
- **战斗面板** — 显示 Initiative 顺序、角色/怪物 HP、回合操作按钮
- **地图网格** — SVG Token 可视化，展示角色和怪物在地图上的位置

## 配套后端

本项目需要配合后端服务使用：

👉 [dnd_backend](https://github.com/16yunH/dnd_backend)

请按照后端仓库的说明先启动后端，再启动本前端项目。

## 许可

ISC
