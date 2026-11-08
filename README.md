<div align="center">

# ⚡ LiteLens

**Lightning-fast, zero-config modern web studio for SQLite databases.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/litelens/pulls)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org)

*No Electron bloat. No Java runtimes. No sign-up. Just run one command and explore your SQLite data in a clean, dark-mode browser studio.*

```bash
npx litelens ./my-database.db
```

</div>

---

## 💡 Why LiteLens?

Most developers still view local SQLite files using tools designed in 2008 (DB Browser for SQLite) or bulky enterprise apps (DBeaver). 

**LiteLens was built for speed and developer ergonomics:**

| Feature | LiteLens | DB Browser for SQLite | DBeaver |
| :--- | :---: | :---: | :---: |
| **Startup Time** | **< 150ms** | ~3-5s | ~10-15s |
| **Installation** | **Zero (`npx`)** | Native Installer | ~250MB JRE App |
| **Design / Theme** | **Modern Dark UI (Linear-style)** | Legacy Desktop GUI | Complex IDE |
| **JSON & Cell Inspector** | **Built-in formatted preview** | Raw text only | Separate plugin |
| **Instant Export** | **1-click CSV / JSON** | Multiple dialogs | Multi-step wizard |
| **Read-Only Safety Mode**| **Yes (`--readonly`)** | Manual toggle | Connection settings |

---

## ✨ Features

- ⚡ **Zero Installation Required**: Launch instantly on any machine with `npx litelens [path]`.
- 📊 **Responsive Data Grid**: Fast pagination, multi-column search, column sorting, and primary key badges.
- 🔍 **Cell Inspector**: Formatted JSON viewer and raw clipboard copy for nested payloads and long strings.
- 💻 **SQL Studio**:
  - Run arbitrary queries with execution time metrics (`0.07ms`).
  - Shortcut-driven: `Cmd+Enter` or `Ctrl+Enter` to execute.
  - Query history and quick SQL snippet templates (`Integrity Check`, `Table Count`).
- 📐 **Schema & Index Visualizer**: Inspect table columns, foreign key constraints, indexes, and full `CREATE TABLE` DDL.
- 💾 **One-Click Export**: Export any table or query result to CSV or formatted JSON.
- 🛡️ **Safe by Default**: Support for `--readonly` mode to protect production databases.
- 🎮 **Built-in Demo Generator**: Run without arguments and click **"Load Demo Store Database"** to test everything instantly.

---

## 🚀 Quick Start

### 1. View an existing database
```bash
npx litelens ./path/to/database.sqlite
```

### 2. Specify a custom port
```bash
npx litelens ./database.db --port 8080
```

### 3. Open in Read-Only Mode (Recommended for production replicas)
```bash
npx litelens ./prod.sqlite --readonly
```

### 4. Headless / Server Mode (No auto-browser launch)
```bash
npx litelens ./database.db --no-open --host 0.0.0.0 --port 3000
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>Enter</kbd> | Execute SQL query |
| <kbd>Cmd</kbd> + <kbd>1</kbd> | Switch to Data Grid |
| <kbd>Cmd</kbd> + <kbd>2</kbd> | Switch to Schema Inspector |
| <kbd>Cmd</kbd> + <kbd>3</kbd> | Switch to SQL Studio |

---

## 🛠️ Local Development

Want to contribute or hack on LiteLens? Setting up takes under 60 seconds:

```bash
# Clone the repository
git clone https://github.com/your-username/litelens.git
cd litelens

# Install dependencies
npm install

# Build both client and server
npm run build

# Run local CLI
node bin/litelens.js ./path/to/any.db
```

To run Vite in hot-reloading development mode:
```bash
npm run dev:client
```

---

## 🤝 Contributing

Contributions, feature requests, and suggestions are welcome!
Feel free to open an issue or submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
