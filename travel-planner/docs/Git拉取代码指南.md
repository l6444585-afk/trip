# Git 拉取最新代码指南

适用仓库：https://github.com/l6444585-afk/trip.git

---

## Windows 操作步骤

### 方式一：保留本地修改（推荐）

```cmd
cd /d D:\Trae\trip
git status
git stash
git remote set-url origin https://github.com/l6444585-afk/trip.git
git pull origin main
git stash pop
```

### 方式二：放弃本地修改，直接覆盖

```cmd
cd /d D:\Trae\trip
git remote set-url origin https://github.com/l6444585-afk/trip.git
git checkout .
git pull origin main
```

### Windows 启动后端服务

```cmd
cd /d D:\Trae\trip\travel-planner\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

> 注：`python -m venv venv` 和 `pip install` 只需首次执行一次，之后启动只需 `venv\Scripts\activate` 然后 `python main.py`

### Windows 启动前端服务

首次安装依赖（CMD）：
```cmd
cd /d D:\Trae\trip\travel-planner\frontend
npm install
npm start
```

首次安装依赖（PowerShell）：
```powershell
cd D:\Trae\trip\travel-planner\frontend
npm install
npm start
```

> 如果 `npm install` 报错，先清理 node_modules 再重装：
> - **CMD**：`rd /s /q node_modules` 然后 `npm install`
> - **PowerShell**：`Remove-Item -Recurse -Force node_modules` 然后 `npm install`

之后每次启动只需：
```cmd
cd /d D:\Trae\trip\travel-planner\frontend
npm start
```

---

## Mac 操作步骤

### 方式一：保留本地修改（推荐）

```bash
cd ~/Projects/trip
git status
git stash
git remote set-url origin https://github.com/l6444585-afk/trip.git
git pull origin main
git stash pop
```

### 方式二：放弃本地修改，直接覆盖

```bash
cd ~/Projects/trip
git remote set-url origin https://github.com/l6444585-afk/trip.git
git checkout .
git pull origin main
```

---

## 逐行说明

| 命令 | 作用 |
|------|------|
| `cd /d D:\Trae\trip` | 进入项目目录（`/d` 表示切换盘符） |
| `git status` | 查看当前状态（哪些文件被修改了） |
| `git stash` | 把本地修改暂存起来（放进"口袋"） |
| `git remote set-url origin https://...` | 设置远程仓库地址为 HTTPS（只需设置一次） |
| `git pull origin main` | 从远程拉取最新代码 |
| `git stash pop` | 把暂存的本地修改恢复回来（从"口袋"拿出来） |
| `git checkout .` | 放弃所有本地修改 |

---

## 常见报错及解决

| 报错 | 原因 | 解决 |
|------|------|------|
| `Could not read from remote repository` | 远程地址是 SSH 格式，没配密钥 | 执行 `git remote set-url origin https://github.com/l6444585-afk/trip.git` 改成 HTTPS |
| `git: 'pull origin main' is not a git command` | 从微信/网页复制命令带了隐藏字符 | **手动打字输入命令，不要复制粘贴** |
| `CONFLICT (content): Merge conflict` | 本地修改和远程代码冲突 | 用 `git checkout .` 放弃本地修改后重新 pull |
| `fatal: not a git repository` | 没进对目录 | 检查 cd 的路径是否正确 |
| `error: Your local changes would be overwritten` | 有未保存的本地修改 | 先 `git stash` 暂存，pull 完再 `git stash pop` |
| `系统找不到指定的路径` | venv 虚拟环境未创建 | 先执行 `python -m venv venv` 创建虚拟环境 |
| `npm install` 报错（EPERM/ENOENT） | node_modules 损坏或缓存问题 | 先删 node_modules 再重装（见下方说明） |

---

## 注意事项

- **命令手动打字**，不要从微信/飞书复制粘贴（会带隐藏字符导致报错）
- `git remote set-url` 只需要执行一次，之后直接 `git pull origin main` 就行
- 如果不确定当前状态，先执行 `git status` 看看
- Windows 上 Python 虚拟环境（venv）需要在 Windows 上重新创建，不能从 Mac 复制过来
- `npm install` 报错时，先清理 node_modules 再重装：
  - **CMD**：`rd /s /q node_modules` 然后 `npm install`
  - **PowerShell**：`Remove-Item -Recurse -Force node_modules` 然后 `npm install`
