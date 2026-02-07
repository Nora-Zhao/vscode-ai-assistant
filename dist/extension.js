"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/types/shared.ts
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function estimateTokens(text) {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}
function truncateText(text, maxLength) {
  if (text.length <= maxLength)
    return text;
  return text.substring(0, maxLength - 3) + "...";
}
var SLASH_COMMANDS, AVAILABLE_MODELS, DIAGRAM_TEMPLATES;
var init_shared = __esm({
  "src/types/shared.ts"() {
    "use strict";
    SLASH_COMMANDS = [
      {
        name: "clear",
        description: "\u6E05\u9664\u5F53\u524D\u5BF9\u8BDD\u4E0A\u4E0B\u6587",
        usage: "/clear",
        aliases: ["c"]
      },
      {
        name: "compact",
        description: "\u538B\u7F29\u5BF9\u8BDD\u5386\u53F2\uFF0C\u4FDD\u7559\u6458\u8981",
        usage: "/compact",
        aliases: ["k"]
      },
      {
        name: "resume",
        description: "\u5207\u6362\u5230\u5176\u4ED6\u5386\u53F2\u4F1A\u8BDD",
        usage: "/resume [session_id]",
        aliases: ["r"],
        args: [{ name: "session_id", required: false, description: "\u4F1A\u8BDDID\uFF08\u53EF\u9009\uFF09" }]
      },
      {
        name: "init",
        description: "\u521D\u59CB\u5316\u9879\u76EE\u7406\u89E3",
        usage: "/init",
        aliases: ["i"]
      },
      {
        name: "file",
        description: "\u8BFB\u53D6\u5E76\u8BA8\u8BBA\u6587\u4EF6",
        usage: "/file <path>",
        args: [{ name: "path", required: true, description: "\u6587\u4EF6\u8DEF\u5F84" }]
      },
      {
        name: "search",
        description: "\u641C\u7D22\u9879\u76EE\u4EE3\u7801",
        usage: "/search <query>",
        aliases: ["s"],
        args: [{ name: "query", required: true, description: "\u641C\u7D22\u5173\u952E\u8BCD" }]
      },
      {
        name: "run",
        description: "\u6267\u884C\u7EC8\u7AEF\u547D\u4EE4",
        usage: "/run <command>",
        aliases: ["!"],
        args: [{ name: "command", required: true, description: "\u8981\u6267\u884C\u7684\u547D\u4EE4" }]
      },
      {
        name: "build",
        description: "\u6784\u5EFA\u9879\u76EE",
        usage: "/build",
        aliases: ["b"]
      },
      {
        name: "test",
        description: "\u8FD0\u884C\u6D4B\u8BD5",
        usage: "/test [file]",
        aliases: ["t"],
        args: [{ name: "file", required: false, description: "\u6D4B\u8BD5\u6587\u4EF6\uFF08\u53EF\u9009\uFF09" }]
      },
      {
        name: "git",
        description: "Git \u64CD\u4F5C",
        usage: "/git <command>",
        aliases: ["g"],
        args: [{ name: "command", required: true, description: "git \u547D\u4EE4" }]
      },
      // Git 快捷命令
      {
        name: "gst",
        description: "Git status - \u67E5\u770B\u72B6\u6001",
        usage: "/gst",
        aliases: []
      },
      {
        name: "gpl",
        description: "Git pull - \u62C9\u53D6\u4EE3\u7801",
        usage: "/gpl",
        aliases: []
      },
      {
        name: "gps",
        description: "Git push - \u63A8\u9001\u4EE3\u7801",
        usage: "/gps",
        aliases: []
      },
      {
        name: "gco",
        description: "Git checkout - \u5207\u6362\u5206\u652F",
        usage: "/gco <branch>",
        aliases: [],
        args: [{ name: "branch", required: true, description: "\u5206\u652F\u540D" }]
      },
      {
        name: "gcm",
        description: "Git commit - \u63D0\u4EA4\u4EE3\u7801",
        usage: "/gcm <message>",
        aliases: [],
        args: [{ name: "message", required: true, description: "\u63D0\u4EA4\u4FE1\u606F" }]
      },
      {
        name: "gdf",
        description: "Git diff - \u67E5\u770B\u5DEE\u5F02",
        usage: "/gdf [file]",
        aliases: [],
        args: [{ name: "file", required: false, description: "\u6587\u4EF6\u8DEF\u5F84\uFF08\u53EF\u9009\uFF09" }]
      },
      {
        name: "glg",
        description: "Git log - \u67E5\u770B\u65E5\u5FD7",
        usage: "/glg",
        aliases: []
      },
      {
        name: "diagram",
        description: "\u751F\u6210\u6D41\u7A0B\u56FE",
        usage: "/diagram <type> [description]",
        aliases: ["d"],
        args: [
          { name: "type", required: true, description: "\u56FE\u8868\u7C7B\u578B: flowchart, sequence, class, state, er, architecture" },
          { name: "description", required: false, description: "\u56FE\u8868\u63CF\u8FF0" }
        ]
      },
      {
        name: "gentest",
        description: "\u4E3A\u6587\u4EF6\u751F\u6210\u6D4B\u8BD5",
        usage: "/gentest [file]",
        aliases: ["gt"],
        args: [{ name: "file", required: false, description: "\u6E90\u6587\u4EF6\u8DEF\u5F84\uFF08\u9ED8\u8BA4\u5F53\u524D\u6587\u4EF6\uFF09" }]
      },
      {
        name: "help",
        description: "\u663E\u793A\u5E2E\u52A9\u4FE1\u606F",
        usage: "/help [command]",
        aliases: ["h", "?"],
        args: [{ name: "command", required: false, description: "\u547D\u4EE4\u540D\u79F0" }]
      }
    ];
    AVAILABLE_MODELS = {
      deepseek: [
        { id: "deepseek-chat", name: "DeepSeek Chat", provider: "deepseek", maxTokens: 4096, supportStream: true },
        { id: "deepseek-coder", name: "DeepSeek Coder", provider: "deepseek", maxTokens: 16384, supportStream: true }
      ],
      openai: [
        { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai", maxTokens: 128e3, supportStream: true, supportVision: true },
        { id: "gpt-4o", name: "GPT-4o", provider: "openai", maxTokens: 128e3, supportStream: true, supportVision: true },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", maxTokens: 128e3, supportStream: true, supportVision: true },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai", maxTokens: 16385, supportStream: true }
      ],
      anthropic: [
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic", maxTokens: 8192, supportStream: true, supportVision: true },
        { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic", maxTokens: 4096, supportStream: true, supportVision: true },
        { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "anthropic", maxTokens: 4096, supportStream: true, supportVision: true }
      ],
      kimi: [
        { id: "moonshot-v1-8k", name: "Kimi 8K", provider: "kimi", maxTokens: 8192, supportStream: true },
        { id: "moonshot-v1-32k", name: "Kimi 32K", provider: "kimi", maxTokens: 32768, supportStream: true },
        { id: "moonshot-v1-128k", name: "Kimi 128K", provider: "kimi", maxTokens: 131072, supportStream: true }
      ],
      openrouter: [
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (OpenRouter)", provider: "openrouter", maxTokens: 8192, supportStream: true, supportVision: true },
        { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5", provider: "openrouter", maxTokens: 32768, supportStream: true, supportVision: true },
        { id: "meta-llama/llama-3.1-405b-instruct", name: "Llama 3.1 405B", provider: "openrouter", maxTokens: 32768, supportStream: true }
      ]
    };
    DIAGRAM_TEMPLATES = {
      flowchart: `flowchart TD
    A[\u5F00\u59CB] --> B{\u5224\u65AD}
    B -->|\u662F| C[\u5904\u74061]
    B -->|\u5426| D[\u5904\u74062]
    C --> E[\u7ED3\u675F]
    D --> E`,
      sequence: `sequenceDiagram
    participant A as \u7528\u6237
    participant B as \u7CFB\u7EDF
    A->>B: \u8BF7\u6C42
    B-->>A: \u54CD\u5E94`,
      class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`,
      state: `stateDiagram-v2
    [*] --> \u5F85\u5904\u7406
    \u5F85\u5904\u7406 --> \u5904\u7406\u4E2D: \u5F00\u59CB
    \u5904\u7406\u4E2D --> \u5DF2\u5B8C\u6210: \u5B8C\u6210
    \u5904\u7406\u4E2D --> \u5931\u8D25: \u9519\u8BEF
    \u5DF2\u5B8C\u6210 --> [*]
    \u5931\u8D25 --> \u5F85\u5904\u7406: \u91CD\u8BD5`,
      er: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : includes`,
      gantt: `gantt
    title \u9879\u76EE\u8BA1\u5212
    dateFormat YYYY-MM-DD
    section \u9636\u6BB51
    \u4EFB\u52A11: 2024-01-01, 7d
    \u4EFB\u52A12: 7d`,
      pie: `pie title \u5206\u5E03
    "A" : 40
    "B" : 30
    "C" : 30`,
      mindmap: `mindmap
    root((\u4E3B\u9898))
      \u5206\u652F1
        \u5B50\u8282\u70B91
        \u5B50\u8282\u70B92
      \u5206\u652F2
        \u5B50\u8282\u70B93`,
      architecture: `flowchart TB
    subgraph Frontend
        A[Web App]
        B[Mobile App]
    end
    subgraph Backend
        C[API Gateway]
        D[Service A]
        E[Service B]
    end
    subgraph Database
        F[(\u4E3B\u6570\u636E\u5E93)]
        G[(\u7F13\u5B58)]
    end
    A --> C
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    D --> G`
    };
  }
});

// src/extension/api/BaseAdapter.ts
var BaseAdapter;
var init_BaseAdapter = __esm({
  "src/extension/api/BaseAdapter.ts"() {
    "use strict";
    BaseAdapter = class {
      constructor(config) {
        // ✅ 修复：使用 Map 管理多个独立的 AbortController
        // 这样不同任务（chat, diagram, test）的请求互不影响
        this.abortControllers = /* @__PURE__ */ new Map();
        // ✅ 保留向后兼容的单一 controller（用于没有指定 requestId 的情况）
        this.defaultAbortController = null;
        // ✅ 新增：存储活动的 reader，以便取消时能主动中断流式读取
        this.activeReaders = /* @__PURE__ */ new Map();
        this.defaultReader = null;
        this.config = config;
      }
      /**
       * ✅ 创建或获取 AbortController
       * @param requestId 可选的请求ID，用于隔离不同任务的取消操作
       */
      createAbortController(requestId) {
        const controller = new AbortController();
        if (requestId) {
          this.cancelRequest(requestId);
          this.abortControllers.set(requestId, controller);
        } else {
          this.defaultAbortController = controller;
        }
        return controller;
      }
      /**
       * ✅ 取消特定请求 - 修复：同时取消 reader
       * @param requestId 请求ID，如果不指定则取消默认请求
       */
      cancelRequest(requestId) {
        if (requestId) {
          const controller = this.abortControllers.get(requestId);
          if (controller) {
            controller.abort();
            this.abortControllers.delete(requestId);
          }
          const reader = this.activeReaders.get(requestId);
          if (reader) {
            try {
              reader.cancel();
            } catch (e) {
            }
            this.activeReaders.delete(requestId);
          }
        } else {
          if (this.defaultAbortController) {
            this.defaultAbortController.abort();
            this.defaultAbortController = null;
          }
          if (this.defaultReader) {
            try {
              this.defaultReader.cancel();
            } catch (e) {
            }
            this.defaultReader = null;
          }
        }
      }
      /**
       * ✅ 取消所有请求（保留向后兼容）
       */
      cancel() {
        if (this.defaultAbortController) {
          this.defaultAbortController.abort();
          this.defaultAbortController = null;
        }
        if (this.defaultReader) {
          try {
            this.defaultReader.cancel();
          } catch (e) {
          }
          this.defaultReader = null;
        }
        for (const [id, controller] of this.abortControllers) {
          controller.abort();
        }
        this.abortControllers.clear();
        for (const [id, reader] of this.activeReaders) {
          try {
            reader.cancel();
          } catch (e) {
          }
        }
        this.activeReaders.clear();
      }
      /**
       * ✅ 清理已完成的请求
       */
      cleanupRequest(requestId) {
        if (requestId) {
          this.abortControllers.delete(requestId);
          this.activeReaders.delete(requestId);
        } else {
          this.defaultReader = null;
        }
      }
      buildMessageContent(message) {
        if (!message.attachments || message.attachments.length === 0) {
          return message.content;
        }
        const content = [{ type: "text", text: message.content }];
        for (const attachment of message.attachments) {
          if (attachment.type === "image") {
            content.push({
              type: "image_url",
              image_url: {
                url: attachment.data.startsWith("data:") ? attachment.data : `data:${attachment.mimeType};base64,${attachment.data}`
              }
            });
          } else if (attachment.type === "file") {
            const fileInfo = `

---
\u{1F4CE} **\u9644\u4EF6: ${attachment.name}**`;
            const mimeType = attachment.mimeType || "";
            const fileName = attachment.name || "";
            if (this.isTextFile(mimeType, fileName)) {
              try {
                const fileContent = attachment.data.startsWith("data:") ? this.decodeBase64(attachment.data.split(",")[1] || "") : attachment.data;
                const ext = this.getFileExtension(fileName);
                content.push({
                  type: "text",
                  text: `${fileInfo}
\`\`\`${ext}
${fileContent}
\`\`\``
                });
              } catch (e) {
                content.push({
                  type: "text",
                  text: `${fileInfo}
[\u6587\u4EF6\u89E3\u6790\u9519\u8BEF]`
                });
              }
            } else if (this.isCsvFile(mimeType, fileName)) {
              try {
                const csvContent = attachment.data.startsWith("data:") ? this.decodeBase64(attachment.data.split(",")[1] || "") : attachment.data;
                const parsedCsv = this.parseCSV(csvContent);
                content.push({
                  type: "text",
                  text: `${fileInfo}

**CSV \u6570\u636E\u9884\u89C8\uFF08\u524D20\u884C\uFF09:**
${parsedCsv}`
                });
              } catch (e) {
                content.push({
                  type: "text",
                  text: `${fileInfo}
[CSV \u89E3\u6790\u9519\u8BEF]`
                });
              }
            } else if (this.isJsonFile(mimeType, fileName)) {
              try {
                const jsonContent = attachment.data.startsWith("data:") ? this.decodeBase64(attachment.data.split(",")[1] || "") : attachment.data;
                const parsed = JSON.parse(jsonContent);
                const formatted = JSON.stringify(parsed, null, 2);
                content.push({
                  type: "text",
                  text: `${fileInfo}
\`\`\`json
${formatted.slice(0, 1e4)}${formatted.length > 1e4 ? "\n...(\u622A\u65AD)" : ""}
\`\`\``
                });
              } catch (e) {
                content.push({
                  type: "text",
                  text: `${fileInfo}
[JSON \u89E3\u6790\u9519\u8BEF]`
                });
              }
            } else if (this.isPdfFile(mimeType, fileName)) {
              content.push({
                type: "text",
                text: `${fileInfo}
[PDF \u6587\u4EF6\uFF0C\u5927\u5C0F: ${attachment.size ? Math.round(attachment.size / 1024) + "KB" : "\u672A\u77E5"}]

\u{1F4A1} **\u63D0\u793A**: PDF \u5185\u5BB9\u65E0\u6CD5\u76F4\u63A5\u89E3\u6790\u3002\u5982\u679C\u60A8\u4F7F\u7528\u652F\u6301\u89C6\u89C9\u7684\u6A21\u578B\uFF08\u5982 GPT-4o\u3001Claude 3\uFF09\uFF0C\u53EF\u4EE5\u5C06 PDF \u622A\u56FE\u540E\u4E0A\u4F20\u56FE\u7247\u3002`
              });
            } else if (this.isExcelFile(mimeType, fileName)) {
              content.push({
                type: "text",
                text: `${fileInfo}
[Excel \u6587\u4EF6\uFF0C\u5927\u5C0F: ${attachment.size ? Math.round(attachment.size / 1024) + "KB" : "\u672A\u77E5"}]

\u{1F4A1} **\u63D0\u793A**: Excel \u6587\u4EF6\u65E0\u6CD5\u76F4\u63A5\u89E3\u6790\u3002\u5EFA\u8BAE\u60A8\u5C06\u5176\u5BFC\u51FA\u4E3A CSV \u683C\u5F0F\u540E\u91CD\u65B0\u4E0A\u4F20\u3002`
              });
            } else {
              content.push({
                type: "text",
                text: `${fileInfo}
[\u4E8C\u8FDB\u5236\u6587\u4EF6\uFF0C\u7C7B\u578B: ${mimeType || "\u672A\u77E5"}\uFF0C\u5927\u5C0F: ${attachment.size ? Math.round(attachment.size / 1024) + "KB" : "\u672A\u77E5"}]`
              });
            }
          } else if (attachment.type === "voice") {
            content.push({
              type: "text",
              text: `

---
\u{1F3A4} **\u8BED\u97F3\u8F93\u5165** (\u65F6\u957F: ${attachment.duration ? attachment.duration + "\u79D2" : "\u672A\u77E5"})`
            });
          }
        }
        return content;
      }
      /**
       * 安全解码 Base64
       */
      decodeBase64(base64) {
        try {
          if (typeof atob !== "undefined") {
            return decodeURIComponent(escape(atob(base64)));
          }
          return Buffer.from(base64, "base64").toString("utf-8");
        } catch {
          if (typeof atob !== "undefined") {
            return atob(base64);
          }
          return Buffer.from(base64, "base64").toString("latin1");
        }
      }
      /**
       * 解析 CSV 内容为表格格式
       */
      parseCSV(content, maxRows = 20) {
        const lines = content.split(/\r?\n/).filter((line) => line.trim());
        const displayLines = lines.slice(0, maxRows);
        if (displayLines.length === 0)
          return "(\u7A7A\u6587\u4EF6)";
        const firstLine = displayLines[0];
        const delimiter = firstLine.includes("	") ? "	" : firstLine.includes(";") ? ";" : ",";
        const rows = displayLines.map((line) => {
          const cells = [];
          let current = "";
          let inQuotes = false;
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              cells.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          cells.push(current.trim());
          return cells;
        });
        if (rows.length === 0)
          return "(\u7A7A\u6587\u4EF6)";
        const header = rows[0];
        const separator = header.map(() => "---");
        const dataRows = rows.slice(1);
        let result = `| ${header.join(" | ")} |
| ${separator.join(" | ")} |
`;
        for (const row of dataRows) {
          result += `| ${row.join(" | ")} |
`;
        }
        if (lines.length > maxRows) {
          result += `
... (\u5171 ${lines.length} \u884C\uFF0C\u4EC5\u663E\u793A\u524D ${maxRows} \u884C)`;
        }
        return result;
      }
      isTextFile(mimeType, fileName) {
        const textMimeTypes = [
          "text/",
          "application/javascript",
          "application/typescript",
          "application/x-python",
          "application/x-ruby",
          "application/x-sh",
          "application/x-yaml"
        ];
        const textExtensions = [
          ".txt",
          ".md",
          ".markdown",
          ".html",
          ".htm",
          ".css",
          ".js",
          ".ts",
          ".jsx",
          ".tsx",
          ".py",
          ".java",
          ".cpp",
          ".c",
          ".h",
          ".hpp",
          ".go",
          ".rs",
          ".rb",
          ".php",
          ".sh",
          ".bash",
          ".zsh",
          ".yaml",
          ".yml",
          ".toml",
          ".ini",
          ".cfg",
          ".conf",
          ".sql",
          ".vue",
          ".svelte",
          ".r",
          ".scala",
          ".swift",
          ".kt",
          ".kts",
          ".gradle",
          ".cmake",
          ".makefile",
          ".dockerfile",
          ".gitignore",
          ".env",
          ".env.local",
          ".env.example"
        ];
        if (this.isJsonFile(mimeType, fileName) || this.isCsvFile(mimeType, fileName)) {
          return false;
        }
        if (mimeType && textMimeTypes.some((t2) => mimeType.startsWith(t2))) {
          return true;
        }
        if (fileName) {
          const lowerName = fileName.toLowerCase();
          if (textExtensions.some((ext) => lowerName.endsWith(ext))) {
            return true;
          }
          const noExtNames = ["makefile", "dockerfile", "jenkinsfile", "vagrantfile", ".gitignore", ".dockerignore", ".editorconfig"];
          if (noExtNames.some((name) => lowerName === name || lowerName.endsWith("/" + name))) {
            return true;
          }
        }
        return false;
      }
      isCsvFile(mimeType, fileName) {
        if (mimeType === "text/csv" || mimeType === "application/csv")
          return true;
        if (fileName && (fileName.toLowerCase().endsWith(".csv") || fileName.toLowerCase().endsWith(".tsv")))
          return true;
        return false;
      }
      isJsonFile(mimeType, fileName) {
        if (mimeType === "application/json")
          return true;
        if (fileName && fileName.toLowerCase().endsWith(".json"))
          return true;
        return false;
      }
      isPdfFile(mimeType, fileName) {
        if (mimeType === "application/pdf")
          return true;
        if (fileName && fileName.toLowerCase().endsWith(".pdf"))
          return true;
        return false;
      }
      isExcelFile(mimeType, fileName) {
        const excelMimes = [
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.oasis.opendocument.spreadsheet"
        ];
        if (mimeType && excelMimes.includes(mimeType))
          return true;
        if (fileName) {
          const lowerName = fileName.toLowerCase();
          if ([".xls", ".xlsx", ".xlsm", ".ods"].some((ext) => lowerName.endsWith(ext)))
            return true;
        }
        return false;
      }
      getFileExtension(fileName) {
        var _a;
        const ext = ((_a = fileName.split(".").pop()) == null ? void 0 : _a.toLowerCase()) || "";
        const langMap = {
          "js": "javascript",
          "ts": "typescript",
          "jsx": "jsx",
          "tsx": "tsx",
          "py": "python",
          "java": "java",
          "cpp": "cpp",
          "c": "c",
          "h": "c",
          "go": "go",
          "rs": "rust",
          "rb": "ruby",
          "php": "php",
          "sh": "bash",
          "yaml": "yaml",
          "yml": "yaml",
          "json": "json",
          "xml": "xml",
          "html": "html",
          "css": "css",
          "md": "markdown",
          "sql": "sql",
          "vue": "vue"
        };
        return langMap[ext] || ext;
      }
      async handleSSEStream(response, callbacks, extractContent, requestId) {
        var _a;
        const reader = (_a = response.body) == null ? void 0 : _a.getReader();
        if (!reader) {
          throw new Error("No response body");
        }
        if (requestId) {
          this.activeReaders.set(requestId, reader);
        } else {
          this.defaultReader = reader;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";
        const controller = requestId ? this.abortControllers.get(requestId) : this.defaultAbortController;
        try {
          while (true) {
            if (controller == null ? void 0 : controller.signal.aborted) {
              try {
                reader.cancel();
              } catch (e) {
              }
              return;
            }
            const { done, value } = await reader.read();
            if (done)
              break;
            if (controller == null ? void 0 : controller.signal.aborted) {
              try {
                reader.cancel();
              } catch (e) {
              }
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]")
                  continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = extractContent(parsed);
                  if (content) {
                    fullResponse += content;
                    callbacks.onToken(content);
                  }
                } catch {
                }
              }
            }
          }
          callbacks.onComplete(fullResponse);
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          } else {
            throw error;
          }
        } finally {
          this.cleanupRequest(requestId);
        }
      }
    };
  }
});

// src/extension/api/OpenAIAdapter.ts
var OpenAIAdapter;
var init_OpenAIAdapter = __esm({
  "src/extension/api/OpenAIAdapter.ts"() {
    "use strict";
    init_BaseAdapter();
    OpenAIAdapter = class extends BaseAdapter {
      getEndpoint() {
        return "https://api.openai.com/v1/chat/completions";
      }
      async sendMessage(messages, callbacks, options) {
        var _a;
        const requestId = options == null ? void 0 : options.requestId;
        const abortController = this.createAbortController(requestId);
        const formattedMessages = messages.map((msg) => ({
          role: msg.role,
          content: this.buildMessageContent(msg)
        }));
        const maxTokens = (options == null ? void 0 : options.maxTokens) ?? this.config.maxTokens;
        const temperature = (options == null ? void 0 : options.temperature) ?? this.config.temperature;
        try {
          const response = await fetch(this.getEndpoint(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
              model: this.config.model,
              messages: formattedMessages,
              temperature,
              max_tokens: maxTokens,
              stream: true
            }),
            signal: abortController.signal
            // ✅ 使用正确的 controller
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(((_a = error.error) == null ? void 0 : _a.message) || "API request failed");
          }
          await this.handleSSEStream(response, callbacks, (data) => {
            var _a2, _b, _c;
            return ((_c = (_b = (_a2 = data.choices) == null ? void 0 : _a2[0]) == null ? void 0 : _b.delta) == null ? void 0 : _c.content) || null;
          }, requestId);
        } catch (error) {
          if (error instanceof Error && error.name !== "AbortError") {
            callbacks.onError(error);
          }
        } finally {
          this.cleanupRequest(requestId);
        }
      }
    };
  }
});

// src/extension/api/DeepSeekAdapter.ts
var DeepSeekAdapter;
var init_DeepSeekAdapter = __esm({
  "src/extension/api/DeepSeekAdapter.ts"() {
    "use strict";
    init_OpenAIAdapter();
    DeepSeekAdapter = class extends OpenAIAdapter {
      getEndpoint() {
        return "https://api.deepseek.com/v1/chat/completions";
      }
    };
  }
});

// src/extension/api/AnthropicAdapter.ts
var AnthropicAdapter;
var init_AnthropicAdapter = __esm({
  "src/extension/api/AnthropicAdapter.ts"() {
    "use strict";
    init_BaseAdapter();
    AnthropicAdapter = class extends BaseAdapter {
      getEndpoint() {
        return "https://api.anthropic.com/v1/messages";
      }
      async sendMessage(messages, callbacks, options) {
        var _a;
        const requestId = options == null ? void 0 : options.requestId;
        const abortController = this.createAbortController(requestId);
        let systemPrompt = "";
        const formattedMessages = [];
        for (const msg of messages) {
          if (msg.role === "system") {
            systemPrompt += (systemPrompt ? "\n" : "") + msg.content;
          } else {
            formattedMessages.push({
              role: msg.role,
              content: this.buildAnthropicContent(msg)
            });
          }
        }
        const maxTokens = (options == null ? void 0 : options.maxTokens) ?? this.config.maxTokens ?? 4096;
        try {
          const body = {
            model: this.config.model,
            messages: formattedMessages,
            max_tokens: maxTokens,
            stream: true
          };
          if (systemPrompt) {
            body.system = systemPrompt;
          }
          const response = await fetch(this.getEndpoint(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": this.config.apiKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify(body),
            signal: abortController.signal
            // ✅ 使用正确的 controller
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(((_a = error.error) == null ? void 0 : _a.message) || "API request failed");
          }
          await this.handleAnthropicStream(response, callbacks, requestId);
        } catch (error) {
          if (error instanceof Error && error.name !== "AbortError") {
            callbacks.onError(error);
          }
        } finally {
          this.cleanupRequest(requestId);
        }
      }
      buildAnthropicContent(message) {
        if (!message.attachments || message.attachments.length === 0) {
          return message.content;
        }
        const content = [{ type: "text", text: message.content }];
        for (const attachment of message.attachments) {
          if (attachment.type === "image") {
            content.push({
              type: "image",
              source: {
                type: "base64",
                media_type: attachment.mimeType,
                data: attachment.data.replace(/^data:[^;]+;base64,/, "")
              }
            });
          }
        }
        return content;
      }
      async handleAnthropicStream(response, callbacks, requestId) {
        var _a, _b;
        const reader = (_a = response.body) == null ? void 0 : _a.getReader();
        if (!reader)
          throw new Error("No response body");
        if (requestId) {
          this.activeReaders.set(requestId, reader);
        } else {
          this.defaultReader = reader;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";
        const controller = requestId ? this.abortControllers.get(requestId) : this.defaultAbortController;
        try {
          while (true) {
            if (controller == null ? void 0 : controller.signal.aborted) {
              try {
                reader.cancel();
              } catch (e) {
              }
              return;
            }
            const { done, value } = await reader.read();
            if (done)
              break;
            if (controller == null ? void 0 : controller.signal.aborted) {
              try {
                reader.cancel();
              } catch (e) {
              }
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "content_block_delta") {
                    const text = ((_b = data.delta) == null ? void 0 : _b.text) || "";
                    if (text) {
                      fullResponse += text;
                      callbacks.onToken(text);
                    }
                  }
                } catch {
                }
              }
            }
          }
          callbacks.onComplete(fullResponse);
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          } else {
            throw error;
          }
        } finally {
          this.cleanupRequest(requestId);
        }
      }
    };
  }
});

// src/extension/api/OtherAdapters.ts
var KimiAdapter, OpenRouterAdapter;
var init_OtherAdapters = __esm({
  "src/extension/api/OtherAdapters.ts"() {
    "use strict";
    init_OpenAIAdapter();
    KimiAdapter = class extends OpenAIAdapter {
      getEndpoint() {
        return "https://api.moonshot.cn/v1/chat/completions";
      }
    };
    OpenRouterAdapter = class extends OpenAIAdapter {
      getEndpoint() {
        return "https://openrouter.ai/api/v1/chat/completions";
      }
    };
  }
});

// src/extension/api/ChatService.ts
var ChatService_exports = {};
__export(ChatService_exports, {
  ChatService: () => ChatService
});
var ChatService;
var init_ChatService = __esm({
  "src/extension/api/ChatService.ts"() {
    "use strict";
    init_shared();
    init_OpenAIAdapter();
    init_DeepSeekAdapter();
    init_AnthropicAdapter();
    init_OtherAdapters();
    ChatService = class {
      constructor(config) {
        this.adapter = null;
        this.config = config;
        this.createAdapter();
      }
      createAdapter() {
        switch (this.config.provider) {
          case "openai":
            this.adapter = new OpenAIAdapter(this.config);
            break;
          case "deepseek":
            this.adapter = new DeepSeekAdapter(this.config);
            break;
          case "anthropic":
            this.adapter = new AnthropicAdapter(this.config);
            break;
          case "kimi":
            this.adapter = new KimiAdapter(this.config);
            break;
          case "openrouter":
            this.adapter = new OpenRouterAdapter(this.config);
            break;
          default:
            throw new Error(`Unknown provider: ${this.config.provider}`);
        }
      }
      updateConfig(config) {
        this.config = config;
        this.createAdapter();
      }
      async sendMessage(messages, callbacks, options) {
        if (!this.adapter) {
          throw new Error("No adapter configured");
        }
        if (!this.config.apiKey) {
          throw new Error("API Key not configured");
        }
        await this.adapter.sendMessage(messages, callbacks, options);
      }
      /**
       * 同步发送消息并等待完整响应
       * 用于Agent等需要完整响应的场景
       */
      async sendMessageSync(messages, options) {
        if (!this.adapter) {
          throw new Error("No adapter configured");
        }
        if (!this.config.apiKey) {
          throw new Error("API Key not configured");
        }
        let fullContent = "";
        await this.adapter.sendMessage(
          messages,
          {
            onToken: (token) => {
              fullContent += token;
            },
            onComplete: (content) => {
              fullContent = content;
            },
            onError: (error) => {
              throw error;
            }
          },
          options
        );
        return fullContent;
      }
      /**
       * ✅ 新增：取消特定请求
       * @param requestId 请求ID，对应不同任务类型
       */
      cancelRequest(requestId) {
        var _a;
        (_a = this.adapter) == null ? void 0 : _a.cancelRequest(requestId);
      }
      /**
       * ✅ 取消所有请求（保留向后兼容）
       */
      cancel() {
        var _a;
        (_a = this.adapter) == null ? void 0 : _a.cancel();
      }
      supportsVision() {
        const models = AVAILABLE_MODELS[this.config.provider];
        const model = models == null ? void 0 : models.find((m) => m.id === this.config.model);
        return (model == null ? void 0 : model.supportVision) ?? false;
      }
      getProvider() {
        return this.config.provider;
      }
      getModel() {
        return this.config.model;
      }
    };
  }
});

// src/extension/test-generator/TestGenerator.ts
var TestGenerator_exports = {};
__export(TestGenerator_exports, {
  TestGenerator: () => TestGenerator
});
var path2, fs, TestGenerator;
var init_TestGenerator = __esm({
  "src/extension/test-generator/TestGenerator.ts"() {
    "use strict";
    path2 = __toESM(require("path"));
    fs = __toESM(require("fs"));
    TestGenerator = class {
      constructor(context) {
        this.context = context;
      }
      /**
       * 根据文件扩展名检测语言和对应的测试框架
       */
      detectLanguageAndFramework(filePath, workspaceRoot) {
        const ext = path2.extname(filePath).toLowerCase();
        const langMap = {
          ".py": { language: "python", defaultFramework: "pytest" },
          ".go": { language: "go", defaultFramework: "go" },
          ".java": { language: "java", defaultFramework: "junit" },
          ".kt": { language: "kotlin", defaultFramework: "junit" },
          ".kts": { language: "kotlin", defaultFramework: "junit" },
          ".ts": { language: "typescript", defaultFramework: "jest" },
          ".tsx": { language: "typescript", defaultFramework: "jest" },
          ".js": { language: "javascript", defaultFramework: "jest" },
          ".jsx": { language: "javascript", defaultFramework: "jest" },
          ".mjs": { language: "javascript", defaultFramework: "jest" },
          ".cjs": { language: "javascript", defaultFramework: "jest" },
          ".rs": { language: "rust", defaultFramework: "jest" },
          // Rust 使用内置测试
          ".rb": { language: "ruby", defaultFramework: "jest" },
          // Ruby 使用 RSpec
          ".cs": { language: "csharp", defaultFramework: "jest" },
          // C# 使用 xUnit/NUnit
          ".php": { language: "php", defaultFramework: "jest" },
          // PHP 使用 PHPUnit
          ".swift": { language: "swift", defaultFramework: "jest" },
          // Swift 使用 XCTest
          ".scala": { language: "scala", defaultFramework: "jest" }
          // Scala 使用 ScalaTest
        };
        const detected = langMap[ext] || { language: "code", defaultFramework: "jest" };
        if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) {
          const packageJsonPath = path2.join(workspaceRoot, "package.json");
          if (fs.existsSync(packageJsonPath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
              const deps = { ...pkg.dependencies, ...pkg.devDependencies };
              if (deps["vitest"])
                return { language: detected.language, framework: "vitest" };
              if (deps["jest"])
                return { language: detected.language, framework: "jest" };
              if (deps["mocha"])
                return { language: detected.language, framework: "mocha" };
            } catch {
            }
          }
        }
        return { language: detected.language, framework: detected.defaultFramework };
      }
      async detectFramework(workspaceRoot) {
        const packageJsonPath = path2.join(workspaceRoot, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps["vitest"])
              return "vitest";
            if (deps["jest"])
              return "jest";
            if (deps["mocha"])
              return "mocha";
          } catch {
          }
        }
        if (fs.existsSync(path2.join(workspaceRoot, "pytest.ini")) || fs.existsSync(path2.join(workspaceRoot, "pyproject.toml")) || fs.existsSync(path2.join(workspaceRoot, "requirements.txt"))) {
          return "pytest";
        }
        if (fs.existsSync(path2.join(workspaceRoot, "go.mod"))) {
          return "go";
        }
        if (fs.existsSync(path2.join(workspaceRoot, "pom.xml")) || fs.existsSync(path2.join(workspaceRoot, "build.gradle"))) {
          return "junit";
        }
        return "jest";
      }
      generateTestFilePath(sourceFile, framework) {
        const dir = path2.dirname(sourceFile);
        const ext = path2.extname(sourceFile);
        const base = path2.basename(sourceFile, ext);
        const safeName = base || "unnamed";
        switch (framework) {
          case "pytest":
            return path2.join(dir, `${safeName}_test.py`);
          case "go":
            return path2.join(dir, `${safeName}_test.go`);
          case "junit":
            return path2.join(dir, `${safeName}Test.java`);
          case "jest":
          case "vitest":
          case "mocha":
          default:
            const testExt = ext || ".js";
            return path2.join(dir, `${safeName}_test${testExt}`);
        }
      }
      generatePrompt(sourceCode, filePath, framework) {
        const ext = path2.extname(filePath);
        const lang = this.getLanguage(ext);
        const frameworkGuide = this.getFrameworkGuide(framework);
        return `Generate comprehensive unit tests for the following ${lang} code using ${framework}.

Source file: ${path2.basename(filePath)}
Language: ${lang}

\`\`\`${lang}
${sourceCode}
\`\`\`

${frameworkGuide}

Requirements:
1. Test all public functions/methods
2. Include edge cases and error handling
3. Use descriptive test names in ${lang}
4. Add necessary imports for ${lang}
5. Follow ${framework} best practices
6. The output must be valid ${lang} code

IMPORTANT: Generate ONLY the test code in ${lang}, no markdown, no explanations, no code block markers.`;
      }
      getLanguage(ext) {
        const map = {
          ".ts": "typescript",
          ".tsx": "typescript",
          ".mts": "typescript",
          ".cts": "typescript",
          ".js": "javascript",
          ".jsx": "javascript",
          ".mjs": "javascript",
          ".cjs": "javascript",
          ".py": "python",
          ".go": "go",
          ".java": "java",
          ".kt": "kotlin",
          ".kts": "kotlin",
          ".rs": "rust",
          ".rb": "ruby",
          ".cs": "csharp",
          ".php": "php",
          ".swift": "swift",
          ".scala": "scala",
          ".cpp": "cpp",
          ".cc": "cpp",
          ".cxx": "cpp",
          ".c": "c",
          ".h": "c",
          ".hpp": "cpp",
          ".lua": "lua",
          ".r": "r",
          ".dart": "dart",
          ".ex": "elixir",
          ".exs": "elixir",
          ".erl": "erlang",
          ".clj": "clojure",
          ".hs": "haskell",
          ".ml": "ocaml",
          ".fs": "fsharp",
          ".groovy": "groovy",
          ".pl": "perl",
          ".vue": "vue",
          ".svelte": "svelte"
        };
        return map[ext] || "code";
      }
      getFrameworkGuide(framework) {
        const guides = {
          jest: `Use Jest with:
- describe() for test suites
- it() or test() for test cases
- expect() for assertions
- beforeEach/afterEach for setup/teardown`,
          vitest: `Use Vitest with:
- describe() for test suites
- it() or test() for test cases
- expect() for assertions
- vi.fn() for mocks`,
          mocha: `Use Mocha with Chai:
- describe() for test suites
- it() for test cases
- expect() from chai for assertions`,
          pytest: `Use pytest with:
- test_ prefix for test functions or methods
- assert statements for assertions
- @pytest.fixture for fixtures
- @pytest.mark.parametrize for parameterized tests
- Use Python syntax only`,
          junit: `Use JUnit 5 with:
- @Test annotation
- @BeforeEach/@AfterEach for setup
- Assertions class for assertions
- @DisplayName for readable names`,
          go: `Use Go testing with:
- func TestXxx(t *testing.T) naming
- t.Run() for subtests
- t.Errorf() for failures
- table-driven tests pattern`
        };
        return guides[framework];
      }
      /**
       * 提取测试代码，清理代码块标记
       */
      extractTestCode(response, expectedLanguage) {
        let code = response;
        code = code.replace(/^```[\w]*\s*\n?/gm, "");
        code = code.replace(/\n?```\s*$/gm, "");
        code = code.replace(/```/g, "");
        code = code.trim();
        const langPatterns = ["javascript", "typescript", "python", "java", "go", "rust", "ruby"];
        for (const lang of langPatterns) {
          if (code.toLowerCase().startsWith(lang + "\n")) {
            code = code.substring(lang.length + 1);
            break;
          }
        }
        return code.trim();
      }
      async saveTestFile(testCode, testPath, overwrite = false) {
        try {
          if (fs.existsSync(testPath) && !overwrite) {
            return { success: false, error: "File already exists" };
          }
          const dir = path2.dirname(testPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const cleanCode = this.extractTestCode(testCode);
          fs.writeFileSync(testPath, cleanCode, "utf-8");
          return { success: true, path: testPath };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
      getTestCommand(framework, testPath) {
        const commands8 = {
          jest: `npx jest "${testPath}"`,
          vitest: `npx vitest run "${testPath}"`,
          mocha: `npx mocha "${testPath}"`,
          pytest: `python -m pytest "${testPath}" -v`,
          junit: `mvn test -Dtest=${path2.basename(testPath, ".java")}`,
          go: `go test -v -run ${path2.basename(testPath, "_test.go")}`
        };
        return commands8[framework];
      }
      /**
       * 根据测试文件路径检测应该使用的测试框架
       */
      detectFrameworkByTestPath(testPath, workspaceRoot) {
        const ext = path2.extname(testPath).toLowerCase();
        const extFrameworks = {
          ".py": "pytest",
          ".go": "go",
          ".java": "junit",
          ".kt": "junit",
          ".rs": "go"
          // Rust uses cargo test, but we treat it like go
        };
        if (extFrameworks[ext]) {
          return extFrameworks[ext];
        }
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          const packageJsonPath = path2.join(workspaceRoot, "package.json");
          if (fs.existsSync(packageJsonPath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
              const deps = { ...pkg.dependencies, ...pkg.devDependencies };
              if (deps["vitest"])
                return "vitest";
              if (deps["jest"])
                return "jest";
              if (deps["mocha"])
                return "mocha";
            } catch {
            }
          }
          return "jest";
        }
        return "jest";
      }
      /**
       * 获取运行测试的完整命令（根据文件路径智能判断）
       */
      getSmartTestCommand(testPath, workspaceRoot) {
        const ext = path2.extname(testPath).toLowerCase();
        const testFileName = path2.basename(testPath);
        if (ext === ".py") {
          if (fs.existsSync(path2.join(workspaceRoot, "pytest.ini")) || fs.existsSync(path2.join(workspaceRoot, "pyproject.toml")) || fs.existsSync(path2.join(workspaceRoot, "setup.cfg"))) {
            return `python -m pytest "${testPath}" -v`;
          }
          try {
            const content = fs.readFileSync(testPath, "utf-8");
            if (content.includes("import unittest") || content.includes("from unittest")) {
              return `python -m unittest "${testPath}" -v`;
            }
          } catch {
          }
          return `python -m pytest "${testPath}" -v`;
        }
        if (ext === ".go") {
          const dir = path2.dirname(testPath);
          const testName = path2.basename(testPath, "_test.go");
          return `cd "${dir}" && go test -v -run "Test${this.capitalizeFirst(testName)}"`;
        }
        if (ext === ".java") {
          const testName = path2.basename(testPath, ".java");
          if (fs.existsSync(path2.join(workspaceRoot, "pom.xml"))) {
            return `mvn test -Dtest="${testName}"`;
          } else if (fs.existsSync(path2.join(workspaceRoot, "build.gradle")) || fs.existsSync(path2.join(workspaceRoot, "build.gradle.kts"))) {
            const gradleCmd = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
            return `${gradleCmd} test --tests "${testName}"`;
          }
          return `mvn test -Dtest="${testName}"`;
        }
        if (ext === ".kt") {
          const testName = path2.basename(testPath, ".kt");
          const gradleCmd = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
          return `${gradleCmd} test --tests "${testName}"`;
        }
        if (ext === ".rs") {
          const testName = path2.basename(testPath, ".rs");
          if (testName === "lib" || testName === "main") {
            return "cargo test";
          }
          return `cargo test ${testName}::`;
        }
        if (ext === ".rb") {
          if (testPath.includes("_spec.rb")) {
            return `bundle exec rspec "${testPath}"`;
          } else if (testPath.includes("_test.rb")) {
            return `ruby -Ilib:test "${testPath}"`;
          }
          return `ruby "${testPath}"`;
        }
        if (ext === ".cs") {
          const testName = path2.basename(testPath, ".cs");
          return `dotnet test --filter "FullyQualifiedName~${testName}"`;
        }
        if (ext === ".php") {
          if (testPath.includes("Test.php")) {
            return `./vendor/bin/phpunit "${testPath}"`;
          }
          return `php "${testPath}"`;
        }
        if (ext === ".swift") {
          return `swift test`;
        }
        if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) {
          const packageJsonPath = path2.join(workspaceRoot, "package.json");
          if (fs.existsSync(packageJsonPath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
              const deps = { ...pkg.dependencies, ...pkg.devDependencies };
              const scripts = pkg.scripts || {};
              if (scripts.test) {
                const testScript = scripts.test;
                if (testScript.includes("vitest")) {
                  return `npx vitest run "${testPath}"`;
                }
                if (testScript.includes("jest")) {
                  return `npx jest "${testPath}"`;
                }
                if (testScript.includes("mocha")) {
                  return `npx mocha "${testPath}"`;
                }
                if (testScript.includes("ava")) {
                  return `npx ava "${testPath}"`;
                }
                if (testScript.includes("tap")) {
                  return `npx tap "${testPath}"`;
                }
              }
              if (deps["vitest"])
                return `npx vitest run "${testPath}"`;
              if (deps["jest"])
                return `npx jest "${testPath}"`;
              if (deps["mocha"])
                return `npx mocha "${testPath}"`;
              if (deps["ava"])
                return `npx ava "${testPath}"`;
              if (deps["tap"])
                return `npx tap "${testPath}"`;
              if (deps["jasmine"])
                return `npx jasmine "${testPath}"`;
              if (fs.existsSync(path2.join(workspaceRoot, "deno.json")) || fs.existsSync(path2.join(workspaceRoot, "deno.jsonc"))) {
                return `deno test "${testPath}"`;
              }
              if (fs.existsSync(path2.join(workspaceRoot, "bun.lockb"))) {
                return `bun test "${testPath}"`;
              }
            } catch {
            }
          }
          return `npx jest "${testPath}"`;
        }
        return `npx jest "${testPath}"`;
      }
      /**
       * 首字母大写
       */
      capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
      generateTemplate(framework, className) {
        const templates = {
          jest: `describe('${className || "Module"}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});`,
          vitest: `import { describe, it, expect, beforeEach } from 'vitest';

describe('${className || "Module"}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});`,
          mocha: `const { expect } = require('chai');

describe('${className || "Module"}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should work correctly', () => {
    expect(true).to.be.true;
  });
});`,
          pytest: `import pytest

class Test${className || "Module"}:
    @pytest.fixture(autouse=True)
    def setup(self):
        # Setup
        pass

    def test_should_work_correctly(self):
        assert True`,
          junit: `import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class ${className || "Module"}Test {
    @BeforeEach
    void setUp() {
        // Setup
    }

    @Test
    @DisplayName("Should work correctly")
    void shouldWorkCorrectly() {
        assertTrue(true);
    }
}`,
          go: `package main

import "testing"

func Test${className || "Module"}(t *testing.T) {
    t.Run("should work correctly", func(t *testing.T) {
        if true != true {
            t.Error("Expected true")
        }
    })
}`
        };
        return templates[framework];
      }
    };
  }
});

// src/extension/mcp/types.ts
var init_types = __esm({
  "src/extension/mcp/types.ts"() {
    "use strict";
  }
});

// src/extension/mcp/builtins.ts
function getBuiltinTools() {
  return [
    // 文件读取工具
    {
      id: "builtin_read_file",
      name: "\u8BFB\u53D6\u6587\u4EF6",
      description: "\u8BFB\u53D6\u6307\u5B9A\u8DEF\u5F84\u7684\u6587\u4EF6\u5185\u5BB9",
      version: "1.0.0",
      author: "System",
      category: "file",
      tags: ["file", "read", "content"],
      parameters: [
        {
          name: "filePath",
          type: "file",
          description: "\u6587\u4EF6\u8DEF\u5F84\uFF08\u76F8\u5BF9\u4E8E\u5DE5\u4F5C\u533A\u6216\u7EDD\u5BF9\u8DEF\u5F84\uFF09",
          required: true
        },
        {
          name: "encoding",
          type: "string",
          description: "\u6587\u4EF6\u7F16\u7801",
          required: false,
          default: "utf-8",
          validation: {
            enum: ["utf-8", "ascii", "utf-16", "latin1"]
          }
        }
      ],
      returns: {
        type: "object",
        description: "\u6587\u4EF6\u5185\u5BB9\u548C\u5143\u4FE1\u606F",
        schema: {
          content: "string",
          size: "number",
          path: "string"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "readFile"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u8BFB\u53D6\u6587\u4EF6\u5185\u5BB9\u65F6\u4F7F\u7528",
        examples: [
          {
            input: { filePath: "src/index.ts" },
            output: { content: "...", size: 1234, path: "/workspace/src/index.ts" },
            description: "\u8BFB\u53D6TypeScript\u6587\u4EF6"
          }
        ],
        priority: 80
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 文件写入工具
    {
      id: "builtin_write_file",
      name: "\u5199\u5165\u6587\u4EF6",
      description: "\u5C06\u5185\u5BB9\u5199\u5165\u6307\u5B9A\u6587\u4EF6",
      version: "1.0.0",
      author: "System",
      category: "file",
      tags: ["file", "write", "save"],
      parameters: [
        {
          name: "filePath",
          type: "file",
          description: "\u6587\u4EF6\u8DEF\u5F84",
          required: true
        },
        {
          name: "content",
          type: "string",
          description: "\u8981\u5199\u5165\u7684\u5185\u5BB9",
          required: true
        },
        {
          name: "createDir",
          type: "boolean",
          description: "\u5982\u679C\u76EE\u5F55\u4E0D\u5B58\u5728\u662F\u5426\u521B\u5EFA",
          required: false,
          default: true
        }
      ],
      returns: {
        type: "object",
        description: "\u5199\u5165\u7ED3\u679C",
        schema: {
          success: "boolean",
          path: "string",
          size: "number"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "writeFile"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u521B\u5EFA\u6216\u4FEE\u6539\u6587\u4EF6\u65F6\u4F7F\u7528",
        priority: 70
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ["user", "agent"]
      }
    },
    // 文件搜索工具
    {
      id: "builtin_search_files",
      name: "\u641C\u7D22\u6587\u4EF6",
      description: "\u5728\u5DE5\u4F5C\u533A\u4E2D\u641C\u7D22\u5339\u914D\u7684\u6587\u4EF6",
      version: "1.0.0",
      author: "System",
      category: "file",
      tags: ["file", "search", "find", "glob"],
      parameters: [
        {
          name: "pattern",
          type: "string",
          description: "Glob\u6A21\u5F0F\uFF0C\u5982 **/*.ts",
          required: true
        },
        {
          name: "exclude",
          type: "string",
          description: "\u6392\u9664\u7684Glob\u6A21\u5F0F",
          required: false,
          default: "**/node_modules/**"
        },
        {
          name: "maxResults",
          type: "number",
          description: "\u6700\u5927\u7ED3\u679C\u6570",
          required: false,
          default: 100
        }
      ],
      returns: {
        type: "array",
        description: "\u5339\u914D\u7684\u6587\u4EF6\u8DEF\u5F84\u5217\u8868"
      },
      execution: {
        type: "function",
        builtinFunction: "searchFiles"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u67E5\u627E\u9879\u76EE\u4E2D\u7684\u6587\u4EF6\u65F6\u4F7F\u7528",
        examples: [
          {
            input: { pattern: "**/*.test.ts" },
            output: ["src/utils.test.ts", "src/api.test.ts"],
            description: "\u641C\u7D22\u6240\u6709\u6D4B\u8BD5\u6587\u4EF6"
          }
        ],
        priority: 75
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 代码搜索工具
    {
      id: "builtin_search_code",
      name: "\u641C\u7D22\u4EE3\u7801",
      description: "\u5728\u4EE3\u7801\u6587\u4EF6\u4E2D\u641C\u7D22\u6587\u672C\u6216\u6B63\u5219\u8868\u8FBE\u5F0F",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "search", "grep", "regex"],
      parameters: [
        {
          name: "query",
          type: "string",
          description: "\u641C\u7D22\u6587\u672C\u6216\u6B63\u5219\u8868\u8FBE\u5F0F",
          required: true
        },
        {
          name: "isRegex",
          type: "boolean",
          description: "\u662F\u5426\u4F7F\u7528\u6B63\u5219\u8868\u8FBE\u5F0F",
          required: false,
          default: false
        },
        {
          name: "include",
          type: "string",
          description: "\u5305\u542B\u7684\u6587\u4EF6\u6A21\u5F0F",
          required: false,
          default: "**/*"
        },
        {
          name: "maxResults",
          type: "number",
          description: "\u6700\u5927\u7ED3\u679C\u6570",
          required: false,
          default: 50
        }
      ],
      returns: {
        type: "array",
        description: "\u641C\u7D22\u7ED3\u679C\u5217\u8868",
        schema: {
          items: {
            file: "string",
            line: "number",
            column: "number",
            text: "string"
          }
        }
      },
      execution: {
        type: "function",
        builtinFunction: "searchCode"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u5728\u4EE3\u7801\u4E2D\u641C\u7D22\u7279\u5B9A\u5185\u5BB9\u65F6\u4F7F\u7528",
        priority: 85
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 执行Shell命令
    {
      id: "builtin_run_command",
      name: "\u6267\u884C\u547D\u4EE4",
      description: "\u5728\u7EC8\u7AEF\u6267\u884CShell\u547D\u4EE4",
      version: "1.0.0",
      author: "System",
      category: "shell",
      tags: ["shell", "command", "terminal", "exec"],
      parameters: [
        {
          name: "command",
          type: "string",
          description: "\u8981\u6267\u884C\u7684\u547D\u4EE4",
          required: true
        },
        {
          name: "cwd",
          type: "string",
          description: "\u5DE5\u4F5C\u76EE\u5F55",
          required: false
        },
        {
          name: "timeout",
          type: "number",
          description: "\u8D85\u65F6\u65F6\u95F4\uFF08\u6BEB\u79D2\uFF09",
          required: false,
          default: 3e4
        }
      ],
      returns: {
        type: "object",
        description: "\u547D\u4EE4\u6267\u884C\u7ED3\u679C",
        schema: {
          stdout: "string",
          stderr: "string",
          exitCode: "number"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "runCommand"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u6267\u884C\u7EC8\u7AEF\u547D\u4EE4\u65F6\u4F7F\u7528\uFF0C\u5982npm install, git status\u7B49",
        examples: [
          {
            input: { command: "npm run build" },
            output: { stdout: "Build completed", stderr: "", exitCode: 0 }
          }
        ],
        priority: 60
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ["user", "agent"],
        dangerousPatterns: ["rm -rf", "format", "del /s"]
      }
    },
    // HTTP请求工具
    {
      id: "builtin_http_request",
      name: "HTTP\u8BF7\u6C42",
      description: "\u53D1\u9001HTTP\u8BF7\u6C42\u5E76\u83B7\u53D6\u54CD\u5E94",
      version: "1.0.0",
      author: "System",
      category: "web",
      tags: ["http", "api", "request", "fetch"],
      parameters: [
        {
          name: "url",
          type: "string",
          description: "\u8BF7\u6C42URL",
          required: true
        },
        {
          name: "method",
          type: "string",
          description: "HTTP\u65B9\u6CD5",
          required: false,
          default: "GET",
          validation: {
            enum: ["GET", "POST", "PUT", "DELETE", "PATCH"]
          }
        },
        {
          name: "headers",
          type: "object",
          description: "\u8BF7\u6C42\u5934",
          required: false
        },
        {
          name: "body",
          type: "string",
          description: "\u8BF7\u6C42\u4F53",
          required: false
        },
        {
          name: "timeout",
          type: "number",
          description: "\u8D85\u65F6\u65F6\u95F4\uFF08\u6BEB\u79D2\uFF09",
          required: false,
          default: 3e4
        }
      ],
      returns: {
        type: "object",
        description: "HTTP\u54CD\u5E94",
        schema: {
          status: "number",
          statusText: "string",
          headers: "object",
          body: "string"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "httpRequest"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u8C03\u7528\u5916\u90E8API\u6216\u83B7\u53D6\u7F51\u7EDC\u8D44\u6E90\u65F6\u4F7F\u7528",
        priority: 65
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 获取项目结构
    {
      id: "builtin_get_project_structure",
      name: "\u83B7\u53D6\u9879\u76EE\u7ED3\u6784",
      description: "\u83B7\u53D6\u5F53\u524D\u9879\u76EE\u7684\u76EE\u5F55\u7ED3\u6784",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["project", "structure", "tree", "directory"],
      parameters: [
        {
          name: "depth",
          type: "number",
          description: "\u76EE\u5F55\u6DF1\u5EA6",
          required: false,
          default: 3
        },
        {
          name: "exclude",
          type: "array",
          description: "\u6392\u9664\u7684\u76EE\u5F55",
          required: false,
          default: ["node_modules", ".git", "dist", "build"],
          items: {
            type: "string"
          }
        }
      ],
      returns: {
        type: "object",
        description: "\u9879\u76EE\u7ED3\u6784\u6811"
      },
      execution: {
        type: "function",
        builtinFunction: "getProjectStructure"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u4E86\u89E3\u9879\u76EE\u6574\u4F53\u7ED3\u6784\u65F6\u4F7F\u7528",
        priority: 90
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 获取当前编辑器信息
    {
      id: "builtin_get_editor_context",
      name: "\u83B7\u53D6\u7F16\u8F91\u5668\u4E0A\u4E0B\u6587",
      description: "\u83B7\u53D6\u5F53\u524D\u6D3B\u52A8\u7F16\u8F91\u5668\u7684\u4FE1\u606F",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["editor", "context", "selection", "cursor"],
      parameters: [],
      returns: {
        type: "object",
        description: "\u7F16\u8F91\u5668\u4E0A\u4E0B\u6587\u4FE1\u606F",
        schema: {
          fileName: "string",
          language: "string",
          content: "string",
          selection: "string",
          cursorPosition: "object"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "getEditorContext"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u83B7\u53D6\u7528\u6237\u5F53\u524D\u6B63\u5728\u7F16\u8F91\u7684\u6587\u4EF6\u4FE1\u606F\u65F6\u4F7F\u7528",
        priority: 95
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 插入代码到编辑器
    {
      id: "builtin_insert_code",
      name: "\u63D2\u5165\u4EE3\u7801",
      description: "\u5728\u5F53\u524D\u7F16\u8F91\u5668\u5149\u6807\u4F4D\u7F6E\u63D2\u5165\u4EE3\u7801",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "insert", "editor"],
      parameters: [
        {
          name: "code",
          type: "code",
          description: "\u8981\u63D2\u5165\u7684\u4EE3\u7801",
          required: true
        },
        {
          name: "position",
          type: "string",
          description: "\u63D2\u5165\u4F4D\u7F6E",
          required: false,
          default: "cursor",
          validation: {
            enum: ["cursor", "start", "end", "replace-selection"]
          }
        }
      ],
      returns: {
        type: "object",
        description: "\u63D2\u5165\u7ED3\u679C",
        schema: {
          success: "boolean",
          insertedAt: "object"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "insertCode"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u5728\u7F16\u8F91\u5668\u4E2D\u63D2\u5165\u4EE3\u7801\u65F6\u4F7F\u7528",
        priority: 70
      },
      security: {
        requireConfirmation: false,
        allowedCallers: ["user", "agent"]
      }
    },
    // Git状态
    {
      id: "builtin_git_status",
      name: "Git\u72B6\u6001",
      description: "\u83B7\u53D6\u5F53\u524DGit\u4ED3\u5E93\u72B6\u6001",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["git", "status", "version-control"],
      parameters: [],
      returns: {
        type: "object",
        description: "Git\u72B6\u6001\u4FE1\u606F",
        schema: {
          branch: "string",
          staged: "array",
          modified: "array",
          untracked: "array"
        }
      },
      execution: {
        type: "command",
        command: {
          command: "git status --porcelain -b",
          timeout: 1e4
        }
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u4E86\u89E3Git\u4ED3\u5E93\u72B6\u6001\u65F6\u4F7F\u7528",
        priority: 60
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // ============================================
    // 命令迁移 - 将 /命令 迁移为 MCP 工具
    // ============================================
    // 帮助命令
    {
      id: "builtin_help",
      name: "\u663E\u793A\u5E2E\u52A9",
      description: "\u663E\u793A\u6240\u6709\u53EF\u7528\u7684\u547D\u4EE4\u548C\u529F\u80FD\u5E2E\u52A9\u4FE1\u606F",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["help", "command", "usage"],
      parameters: [],
      returns: {
        type: "string",
        description: "\u5E2E\u52A9\u4FE1\u606F\u6587\u672C"
      },
      execution: {
        type: "function",
        builtinFunction: "showHelp"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u7528\u6237\u8BE2\u95EE\u5982\u4F55\u4F7F\u7528\u6216\u9700\u8981\u5E2E\u52A9\u65F6",
        priority: 50
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 项目初始化/分析
    {
      id: "builtin_init_project",
      name: "\u5206\u6790\u9879\u76EE",
      description: "\u5206\u6790\u5E76\u7406\u89E3\u5F53\u524D\u9879\u76EE\u7684\u7ED3\u6784\u3001\u7C7B\u578B\u3001\u6846\u67B6\u548C\u4F9D\u8D56",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["project", "init", "analyze", "structure"],
      parameters: [
        {
          name: "depth",
          type: "number",
          description: "\u5206\u6790\u6DF1\u5EA6",
          required: false,
          default: 3
        }
      ],
      returns: {
        type: "object",
        description: "\u9879\u76EE\u5206\u6790\u7ED3\u679C",
        schema: {
          type: "string",
          framework: "string",
          language: "string",
          structure: "object"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "initProject"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u4E86\u89E3\u9879\u76EE\u7ED3\u6784\u6216\u5F00\u59CB\u65B0\u7684\u5DE5\u4F5C\u4F1A\u8BDD\u65F6",
        priority: 85
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // Git 快捷命令 - pull
    {
      id: "builtin_git_pull",
      name: "Git\u62C9\u53D6",
      description: "\u4ECE\u8FDC\u7A0B\u4ED3\u5E93\u62C9\u53D6\u6700\u65B0\u4EE3\u7801 (git pull)",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["git", "pull", "sync"],
      parameters: [
        {
          name: "remote",
          type: "string",
          description: "\u8FDC\u7A0B\u4ED3\u5E93\u540D\u79F0",
          required: false,
          default: "origin"
        },
        {
          name: "branch",
          type: "string",
          description: "\u5206\u652F\u540D\u79F0",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u547D\u4EE4\u6267\u884C\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "gitPull"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u62C9\u53D6\u8FDC\u7A0B\u4EE3\u7801\u66F4\u65B0\u65F6",
        priority: 55
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // Git 快捷命令 - push
    {
      id: "builtin_git_push",
      name: "Git\u63A8\u9001",
      description: "\u63A8\u9001\u672C\u5730\u63D0\u4EA4\u5230\u8FDC\u7A0B\u4ED3\u5E93 (git push)",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["git", "push", "sync"],
      parameters: [
        {
          name: "remote",
          type: "string",
          description: "\u8FDC\u7A0B\u4ED3\u5E93\u540D\u79F0",
          required: false,
          default: "origin"
        },
        {
          name: "branch",
          type: "string",
          description: "\u5206\u652F\u540D\u79F0",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u547D\u4EE4\u6267\u884C\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "gitPush"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u63A8\u9001\u672C\u5730\u4EE3\u7801\u5230\u8FDC\u7A0B\u4ED3\u5E93\u65F6",
        priority: 55
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ["user", "agent"]
      }
    },
    // Git 快捷命令 - commit
    {
      id: "builtin_git_commit",
      name: "Git\u63D0\u4EA4",
      description: "\u63D0\u4EA4\u66F4\u6539\u5230\u672C\u5730\u4ED3\u5E93 (git commit)",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["git", "commit", "save"],
      parameters: [
        {
          name: "message",
          type: "string",
          description: "\u63D0\u4EA4\u4FE1\u606F",
          required: true
        },
        {
          name: "all",
          type: "boolean",
          description: "\u662F\u5426\u63D0\u4EA4\u6240\u6709\u66F4\u6539 (-a)",
          required: false,
          default: false
        }
      ],
      returns: {
        type: "object",
        description: "\u547D\u4EE4\u6267\u884C\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "gitCommit"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u63D0\u4EA4\u4EE3\u7801\u66F4\u6539\u65F6",
        priority: 60
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // Git 快捷命令 - checkout
    {
      id: "builtin_git_checkout",
      name: "Git\u5207\u6362\u5206\u652F",
      description: "\u5207\u6362\u5230\u6307\u5B9A\u5206\u652F (git checkout)",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["git", "checkout", "branch", "switch"],
      parameters: [
        {
          name: "branch",
          type: "string",
          description: "\u5206\u652F\u540D\u79F0",
          required: true
        },
        {
          name: "create",
          type: "boolean",
          description: "\u662F\u5426\u521B\u5EFA\u65B0\u5206\u652F (-b)",
          required: false,
          default: false
        }
      ],
      returns: {
        type: "object",
        description: "\u547D\u4EE4\u6267\u884C\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "gitCheckout"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u5207\u6362\u5206\u652F\u65F6",
        priority: 55
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // Git 快捷命令 - diff
    {
      id: "builtin_git_diff",
      name: "Git\u5DEE\u5F02",
      description: "\u663E\u793A\u672A\u63D0\u4EA4\u7684\u66F4\u6539 (git diff)",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["git", "diff", "changes"],
      parameters: [
        {
          name: "file",
          type: "file",
          description: "\u6307\u5B9A\u6587\u4EF6\uFF08\u53EF\u9009\uFF0C\u4E0D\u6307\u5B9A\u5219\u663E\u793A\u6240\u6709\u66F4\u6539\uFF09",
          required: false
        },
        {
          name: "staged",
          type: "boolean",
          description: "\u662F\u5426\u663E\u793A\u5DF2\u6682\u5B58\u7684\u66F4\u6539 (--staged)",
          required: false,
          default: false
        }
      ],
      returns: {
        type: "object",
        description: "\u5DEE\u5F02\u5185\u5BB9"
      },
      execution: {
        type: "function",
        builtinFunction: "gitDiff"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u67E5\u770B\u4EE3\u7801\u66F4\u6539\u65F6",
        priority: 60
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // Git 快捷命令 - log
    {
      id: "builtin_git_log",
      name: "Git\u65E5\u5FD7",
      description: "\u663E\u793A\u63D0\u4EA4\u5386\u53F2 (git log)",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["git", "log", "history"],
      parameters: [
        {
          name: "count",
          type: "number",
          description: "\u663E\u793A\u7684\u63D0\u4EA4\u6570\u91CF",
          required: false,
          default: 15
        },
        {
          name: "oneline",
          type: "boolean",
          description: "\u5355\u884C\u663E\u793A (--oneline)",
          required: false,
          default: true
        }
      ],
      returns: {
        type: "object",
        description: "\u63D0\u4EA4\u5386\u53F2"
      },
      execution: {
        type: "function",
        builtinFunction: "gitLog"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u67E5\u770B\u63D0\u4EA4\u5386\u53F2\u65F6",
        priority: 55
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 运行测试
    {
      id: "builtin_run_test",
      name: "\u8FD0\u884C\u6D4B\u8BD5",
      description: "\u8FD0\u884C\u9879\u76EE\u7684\u6D4B\u8BD5\u5957\u4EF6",
      version: "1.0.0",
      author: "System",
      category: "test",
      tags: ["test", "run", "unit", "jest", "vitest"],
      parameters: [
        {
          name: "pattern",
          type: "string",
          description: "\u6D4B\u8BD5\u6587\u4EF6\u6A21\u5F0F\uFF08\u53EF\u9009\uFF09",
          required: false
        },
        {
          name: "watch",
          type: "boolean",
          description: "\u662F\u5426\u76D1\u542C\u6A21\u5F0F",
          required: false,
          default: false
        }
      ],
      returns: {
        type: "object",
        description: "\u6D4B\u8BD5\u6267\u884C\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "runTest"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u8FD0\u884C\u6D4B\u8BD5\u65F6",
        priority: 65
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 构建项目
    {
      id: "builtin_build",
      name: "\u6784\u5EFA\u9879\u76EE",
      description: "\u6784\u5EFA/\u7F16\u8BD1\u9879\u76EE",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["build", "compile", "npm", "yarn"],
      parameters: [
        {
          name: "command",
          type: "string",
          description: "\u81EA\u5B9A\u4E49\u6784\u5EFA\u547D\u4EE4\uFF08\u53EF\u9009\uFF0C\u9ED8\u8BA4\u4F7F\u7528 npm run build\uFF09",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u6784\u5EFA\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "buildProject"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u6784\u5EFA\u9879\u76EE\u65F6",
        priority: 60
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 生成图表
    {
      id: "builtin_diagram",
      name: "\u751F\u6210\u56FE\u8868",
      description: "\u6839\u636E\u4EE3\u7801\u6216\u63CF\u8FF0\u751F\u6210\u5404\u7C7B\u56FE\u8868\uFF08\u6D41\u7A0B\u56FE\u3001\u65F6\u5E8F\u56FE\u3001\u7C7B\u56FE\u3001\u67B6\u6784\u56FE\u7B49\uFF09",
      version: "1.0.0",
      author: "System",
      category: "diagram",
      tags: ["diagram", "flowchart", "sequence", "class", "mermaid"],
      parameters: [
        {
          name: "type",
          type: "string",
          description: "\u56FE\u8868\u7C7B\u578B",
          required: false,
          default: "flowchart",
          validation: {
            enum: ["flowchart", "sequence", "class", "state", "er", "gantt", "mindmap", "architecture"]
          }
        },
        {
          name: "source",
          type: "string",
          description: "\u6765\u6E90: file(\u5F53\u524D\u6587\u4EF6), project(\u6574\u4E2A\u9879\u76EE), selection(\u9009\u4E2D\u5185\u5BB9), description(\u6587\u5B57\u63CF\u8FF0)",
          required: false,
          default: "file",
          validation: {
            enum: ["file", "project", "selection", "description"]
          }
        },
        {
          name: "description",
          type: "string",
          description: "\u56FE\u8868\u63CF\u8FF0\uFF08\u5F53source\u4E3Adescription\u65F6\u9700\u8981\uFF09",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "Mermaid\u56FE\u8868\u4EE3\u7801"
      },
      execution: {
        type: "function",
        builtinFunction: "generateDiagram"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u53EF\u89C6\u5316\u4EE3\u7801\u7ED3\u6784\u6216\u6D41\u7A0B\u65F6",
        examples: [
          {
            input: { type: "flowchart", source: "file" },
            output: { mermaid: "flowchart TD..." },
            description: "\u4E3A\u5F53\u524D\u6587\u4EF6\u751F\u6210\u6D41\u7A0B\u56FE"
          }
        ],
        priority: 70
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 生成测试
    {
      id: "builtin_gentest",
      name: "\u751F\u6210\u6D4B\u8BD5",
      description: "\u4E3A\u4EE3\u7801\u81EA\u52A8\u751F\u6210\u5355\u5143\u6D4B\u8BD5",
      version: "1.0.0",
      author: "System",
      category: "test",
      tags: ["test", "generate", "unit", "jest", "vitest"],
      parameters: [
        {
          name: "file",
          type: "file",
          description: "\u8981\u751F\u6210\u6D4B\u8BD5\u7684\u6587\u4EF6\uFF08\u53EF\u9009\uFF0C\u9ED8\u8BA4\u5F53\u524D\u6587\u4EF6\uFF09",
          required: false
        },
        {
          name: "framework",
          type: "string",
          description: "\u6D4B\u8BD5\u6846\u67B6",
          required: false,
          validation: {
            enum: ["jest", "vitest", "mocha", "pytest", "auto"]
          }
        }
      ],
      returns: {
        type: "object",
        description: "\u751F\u6210\u7684\u6D4B\u8BD5\u4EE3\u7801"
      },
      execution: {
        type: "function",
        builtinFunction: "generateTest"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u4E3A\u4EE3\u7801\u751F\u6210\u6D4B\u8BD5\u65F6",
        priority: 75
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    }
  ];
}
var vscode10, fs5, path6, builtinFunctions;
var init_builtins = __esm({
  "src/extension/mcp/builtins.ts"() {
    "use strict";
    vscode10 = __toESM(require("vscode"));
    fs5 = __toESM(require("fs"));
    path6 = __toESM(require("path"));
    builtinFunctions = {
      /**
       * 读取文件
       */
      readFile: async (params, context) => {
        const { filePath, encoding = "utf-8" } = params;
        const workspaceRoot = context.workspaceRoot || "";
        const fullPath = path6.isAbsolute(filePath) ? filePath : path6.join(workspaceRoot, filePath);
        if (!fs5.existsSync(fullPath)) {
          throw new Error(`File not found: ${filePath}`);
        }
        const stats = fs5.statSync(fullPath);
        const content = fs5.readFileSync(fullPath, encoding);
        return {
          content,
          size: stats.size,
          path: fullPath,
          modified: stats.mtime.toISOString()
        };
      },
      /**
       * 写入文件
       */
      writeFile: async (params, context) => {
        const { filePath, content, createDir = true } = params;
        const workspaceRoot = context.workspaceRoot || "";
        const fullPath = path6.isAbsolute(filePath) ? filePath : path6.join(workspaceRoot, filePath);
        const dir = path6.dirname(fullPath);
        if (createDir && !fs5.existsSync(dir)) {
          fs5.mkdirSync(dir, { recursive: true });
        }
        fs5.writeFileSync(fullPath, content, "utf-8");
        const stats = fs5.statSync(fullPath);
        return {
          success: true,
          path: fullPath,
          size: stats.size
        };
      },
      /**
       * 搜索文件
       */
      searchFiles: async (params, context) => {
        const { pattern, exclude = "**/node_modules/**", maxResults = 100 } = params;
        const files = await vscode10.workspace.findFiles(
          pattern,
          exclude,
          maxResults
        );
        return files.map((f) => vscode10.workspace.asRelativePath(f));
      },
      /**
       * 搜索代码
       */
      searchCode: async (params, context) => {
        const { query, isRegex = false, include = "**/*", maxResults = 50 } = params;
        const results = [];
        const files = await vscode10.workspace.findFiles(include, "**/node_modules/**", 1e3);
        for (const fileUri of files) {
          if (results.length >= maxResults)
            break;
          try {
            const document = await vscode10.workspace.openTextDocument(fileUri);
            const text = document.getText();
            const lines = text.split("\n");
            const regex = isRegex ? new RegExp(query, "g") : null;
            for (let i = 0; i < lines.length && results.length < maxResults; i++) {
              const line = lines[i];
              let match;
              let column = 0;
              if (regex) {
                const m = regex.exec(line);
                match = m !== null;
                column = (m == null ? void 0 : m.index) || 0;
                regex.lastIndex = 0;
              } else {
                column = line.indexOf(query);
                match = column !== -1;
              }
              if (match) {
                results.push({
                  file: vscode10.workspace.asRelativePath(fileUri),
                  line: i + 1,
                  column: column + 1,
                  text: line.trim().substring(0, 200)
                });
              }
            }
          } catch (e) {
          }
        }
        return results;
      },
      /**
       * 执行命令
       */
      runCommand: async (params, context) => {
        var _a, _b;
        const { command, cwd, timeout = 3e4 } = params;
        const workspaceRoot = context.workspaceRoot || "";
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        try {
          const { stdout, stderr } = await execAsync2(command, {
            cwd: cwd || workspaceRoot,
            timeout,
            maxBuffer: 10 * 1024 * 1024
            // 10MB
          });
          return {
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            exitCode: 0
          };
        } catch (error) {
          return {
            stdout: ((_a = error.stdout) == null ? void 0 : _a.toString()) || "",
            stderr: ((_b = error.stderr) == null ? void 0 : _b.toString()) || error.message,
            exitCode: error.code || 1
          };
        }
      },
      /**
       * HTTP请求
       */
      httpRequest: async (params, context) => {
        const { url, method = "GET", headers = {}, body, timeout = 3e4 } = params;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, {
            method,
            headers,
            body: body ? body : void 0,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const responseBody = await response.text();
          return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody
          };
        } catch (error) {
          clearTimeout(timeoutId);
          throw new Error(`HTTP request failed: ${error.message}`);
        }
      },
      /**
       * 获取项目结构
       */
      getProjectStructure: async (params, context) => {
        const { depth = 3, exclude = ["node_modules", ".git", "dist", "build"] } = params;
        const workspaceRoot = context.workspaceRoot;
        if (!workspaceRoot) {
          throw new Error("No workspace folder open");
        }
        const buildTree = (dir, currentDepth) => {
          if (currentDepth > depth)
            return null;
          const result = {
            name: path6.basename(dir),
            type: "directory",
            children: []
          };
          try {
            const items = fs5.readdirSync(dir);
            for (const item of items) {
              if (exclude.includes(item) || item.startsWith("."))
                continue;
              const fullPath = path6.join(dir, item);
              const stats = fs5.statSync(fullPath);
              if (stats.isDirectory()) {
                const subtree = buildTree(fullPath, currentDepth + 1);
                if (subtree) {
                  result.children.push(subtree);
                }
              } else {
                result.children.push({
                  name: item,
                  type: "file",
                  size: stats.size
                });
              }
            }
          } catch (e) {
          }
          return result;
        };
        return buildTree(workspaceRoot, 1);
      },
      /**
       * 获取编辑器上下文
       */
      getEditorContext: async (params, context) => {
        const editor = vscode10.window.activeTextEditor;
        if (!editor) {
          return {
            active: false,
            message: "No active editor"
          };
        }
        const document = editor.document;
        const selection = editor.selection;
        return {
          active: true,
          fileName: document.fileName,
          relativePath: vscode10.workspace.asRelativePath(document.uri),
          language: document.languageId,
          lineCount: document.lineCount,
          content: document.getText(),
          selection: document.getText(selection),
          hasSelection: !selection.isEmpty,
          cursorPosition: {
            line: selection.active.line + 1,
            column: selection.active.character + 1
          },
          isDirty: document.isDirty
        };
      },
      /**
       * 插入代码
       */
      insertCode: async (params, context) => {
        const { code, position = "cursor" } = params;
        const editor = vscode10.window.activeTextEditor;
        if (!editor) {
          throw new Error("No active editor");
        }
        let insertPosition;
        let range;
        switch (position) {
          case "start":
            insertPosition = new vscode10.Position(0, 0);
            break;
          case "end":
            const lastLine = editor.document.lineCount - 1;
            insertPosition = new vscode10.Position(
              lastLine,
              editor.document.lineAt(lastLine).text.length
            );
            break;
          case "replace-selection":
            range = editor.selection;
            insertPosition = editor.selection.start;
            break;
          case "cursor":
          default:
            insertPosition = editor.selection.active;
            break;
        }
        const success = await editor.edit((editBuilder) => {
          if (range && position === "replace-selection") {
            editBuilder.replace(range, code);
          } else {
            editBuilder.insert(insertPosition, code);
          }
        });
        return {
          success,
          insertedAt: {
            line: insertPosition.line + 1,
            column: insertPosition.character + 1
          }
        };
      },
      // ============================================
      // 命令迁移 - 新增内置函数
      // ============================================
      /**
       * 显示帮助信息
       */
      showHelp: async (params, context) => {
        return {
          content: `## \u{1F916} AI Code Assistant \u5E2E\u52A9

### \u4E3B\u8981\u529F\u80FD

**1. \u667A\u80FD\u5BF9\u8BDD** - \u4E0E AI \u8FDB\u884C\u81EA\u7136\u8BED\u8A00\u5BF9\u8BDD
- \u652F\u6301\u591A\u8F6E\u5BF9\u8BDD\u3001\u4E0A\u4E0B\u6587\u7406\u89E3
- \u53EF\u4E0A\u4F20\u56FE\u7247\u3001\u4EE3\u7801\u8FDB\u884C\u5206\u6790

**2. \u4EE3\u7801\u64CD\u4F5C** - \u9009\u4E2D\u4EE3\u7801\u540E\u4F7F\u7528
- \u53F3\u952E\u83DC\u5355\uFF1A\u89E3\u91CA\u3001\u4FEE\u590D\u3001\u91CD\u6784\u3001\u6DFB\u52A0\u6CE8\u91CA

**3. MCP\u5DE5\u5177\u8C03\u7528** - \u4F7F\u7528 @mcp:\u5DE5\u5177\u540D \u8C03\u7528
- @mcp:file:read - \u8BFB\u53D6\u6587\u4EF6
- @mcp:shell:run - \u6267\u884C\u547D\u4EE4
- @mcp:git:status - Git\u72B6\u6001

**4. Skill\u6280\u80FD\u8C03\u7528** - \u4F7F\u7528 @skill:\u6280\u80FD\u540D \u8C03\u7528
- @skill:test-architect - \u751F\u6210\u6D4B\u8BD5
- @skill:code-reviewer - \u4EE3\u7801\u5BA1\u67E5
- @skill:tool-maker - \u5236\u4F5C\u5DE5\u5177

### \u2328\uFE0F \u5FEB\u6377\u952E

- \`\u2191/\u2193\` - \u6D4F\u89C8\u5386\u53F2\u8F93\u5165
- \`Tab\` - \u547D\u4EE4\u81EA\u52A8\u8865\u5168
- \`ESC\` - \u505C\u6B62\u5F53\u524D\u4EFB\u52A1
- \`Alt+Enter\` - \u8F93\u5165\u6362\u884C

### \u{1F4A1} \u4F7F\u7528\u6280\u5DE7

1. **\u9009\u4E2D\u4EE3\u7801** \u518D\u8F93\u5165\u95EE\u9898\uFF0CAI\u4F1A\u9488\u5BF9\u8BE5\u4EE3\u7801\u56DE\u7B54
2. **\u62D6\u62FD\u6587\u4EF6** \u5230\u8F93\u5165\u6846\u53EF\u4E0A\u4F20\u56FE\u7247/\u6587\u6863
3. **\u8F93\u5165@** \u89E6\u53D1MCP\u548CSkill\u667A\u80FD\u63D0\u793A`
        };
      },
      /**
       * 初始化/分析项目
       */
      initProject: async (params, context) => {
        const workspaceRoot = context.workspaceRoot;
        if (!workspaceRoot) {
          throw new Error("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u5DE5\u4F5C\u533A");
        }
        const analysis = {
          type: "unknown",
          framework: null,
          language: null,
          structure: {}
        };
        try {
          const packageJsonPath = path6.join(workspaceRoot, "package.json");
          if (fs5.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs5.readFileSync(packageJsonPath, "utf-8"));
            analysis.type = "nodejs";
            analysis.language = "javascript/typescript";
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps["react"])
              analysis.framework = "React";
            else if (deps["vue"])
              analysis.framework = "Vue";
            else if (deps["@angular/core"])
              analysis.framework = "Angular";
            else if (deps["next"])
              analysis.framework = "Next.js";
            else if (deps["express"])
              analysis.framework = "Express";
          }
          if (fs5.existsSync(path6.join(workspaceRoot, "requirements.txt")) || fs5.existsSync(path6.join(workspaceRoot, "pyproject.toml"))) {
            analysis.type = "python";
            analysis.language = "python";
          }
          if (fs5.existsSync(path6.join(workspaceRoot, "go.mod"))) {
            analysis.type = "go";
            analysis.language = "go";
          }
          if (fs5.existsSync(path6.join(workspaceRoot, "pom.xml")) || fs5.existsSync(path6.join(workspaceRoot, "build.gradle"))) {
            analysis.type = "java";
            analysis.language = "java";
          }
          const getStructure = (dir, depth = 0, maxDepth = 2) => {
            if (depth > maxDepth)
              return null;
            const result = { name: path6.basename(dir), type: "directory", children: [] };
            const exclude = ["node_modules", ".git", "dist", "build", ".next", "__pycache__", "venv"];
            try {
              const items = fs5.readdirSync(dir);
              for (const item of items) {
                if (exclude.includes(item) || item.startsWith("."))
                  continue;
                const fullPath = path6.join(dir, item);
                const stats = fs5.statSync(fullPath);
                if (stats.isDirectory()) {
                  const subtree = getStructure(fullPath, depth + 1, maxDepth);
                  if (subtree)
                    result.children.push(subtree);
                } else {
                  result.children.push({ name: item, type: "file" });
                }
              }
            } catch (e) {
            }
            return result;
          };
          analysis.structure = getStructure(workspaceRoot);
        } catch (e) {
          console.error("\u9879\u76EE\u5206\u6790\u5931\u8D25:", e);
        }
        return analysis;
      },
      /**
       * Git pull
       */
      gitPull: async (params, context) => {
        var _a, _b;
        const { remote = "origin", branch } = params;
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        try {
          const cmd = branch ? `git pull ${remote} ${branch}` : "git pull";
          const { stdout, stderr } = await execAsync2(cmd, {
            cwd: context.workspaceRoot,
            timeout: 6e4
          });
          return {
            success: true,
            stdout: stdout.toString(),
            stderr: stderr.toString()
          };
        } catch (error) {
          return {
            success: false,
            stdout: ((_a = error.stdout) == null ? void 0 : _a.toString()) || "",
            stderr: ((_b = error.stderr) == null ? void 0 : _b.toString()) || error.message
          };
        }
      },
      /**
       * Git push
       */
      gitPush: async (params, context) => {
        var _a, _b;
        const { remote = "origin", branch } = params;
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        try {
          const cmd = branch ? `git push ${remote} ${branch}` : "git push";
          const { stdout, stderr } = await execAsync2(cmd, {
            cwd: context.workspaceRoot,
            timeout: 6e4
          });
          return {
            success: true,
            stdout: stdout.toString(),
            stderr: stderr.toString()
          };
        } catch (error) {
          return {
            success: false,
            stdout: ((_a = error.stdout) == null ? void 0 : _a.toString()) || "",
            stderr: ((_b = error.stderr) == null ? void 0 : _b.toString()) || error.message
          };
        }
      },
      /**
       * Git commit
       */
      gitCommit: async (params, context) => {
        var _a, _b;
        const { message, all = false } = params;
        if (!message) {
          throw new Error("\u63D0\u4EA4\u4FE1\u606F\u4E0D\u80FD\u4E3A\u7A7A");
        }
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        try {
          const flags = all ? "-am" : "-m";
          const { stdout, stderr } = await execAsync2(`git commit ${flags} "${message}"`, {
            cwd: context.workspaceRoot,
            timeout: 3e4
          });
          return {
            success: true,
            stdout: stdout.toString(),
            stderr: stderr.toString()
          };
        } catch (error) {
          return {
            success: false,
            stdout: ((_a = error.stdout) == null ? void 0 : _a.toString()) || "",
            stderr: ((_b = error.stderr) == null ? void 0 : _b.toString()) || error.message
          };
        }
      },
      /**
       * Git checkout
       */
      gitCheckout: async (params, context) => {
        var _a, _b;
        const { branch, create = false } = params;
        if (!branch) {
          throw new Error("\u8BF7\u6307\u5B9A\u5206\u652F\u540D\u79F0");
        }
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        try {
          const cmd = create ? `git checkout -b ${branch}` : `git checkout ${branch}`;
          const { stdout, stderr } = await execAsync2(cmd, {
            cwd: context.workspaceRoot,
            timeout: 3e4
          });
          return {
            success: true,
            stdout: stdout.toString(),
            stderr: stderr.toString()
          };
        } catch (error) {
          return {
            success: false,
            stdout: ((_a = error.stdout) == null ? void 0 : _a.toString()) || "",
            stderr: ((_b = error.stderr) == null ? void 0 : _b.toString()) || error.message
          };
        }
      },
      /**
       * Git diff
       */
      gitDiff: async (params, context) => {
        var _a;
        const { file, staged = false } = params;
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        try {
          let cmd = "git diff";
          if (staged)
            cmd += " --staged";
          if (file)
            cmd += ` ${file}`;
          const { stdout, stderr } = await execAsync2(cmd, {
            cwd: context.workspaceRoot,
            timeout: 3e4,
            maxBuffer: 10 * 1024 * 1024
          });
          return {
            success: true,
            diff: stdout.toString(),
            stderr: stderr.toString()
          };
        } catch (error) {
          return {
            success: false,
            diff: "",
            stderr: ((_a = error.stderr) == null ? void 0 : _a.toString()) || error.message
          };
        }
      },
      /**
       * Git log
       */
      gitLog: async (params, context) => {
        var _a;
        const { count = 15, oneline = true } = params;
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        try {
          const format = oneline ? "--oneline" : "";
          const { stdout, stderr } = await execAsync2(`git log ${format} -${count}`, {
            cwd: context.workspaceRoot,
            timeout: 3e4
          });
          return {
            success: true,
            log: stdout.toString(),
            stderr: stderr.toString()
          };
        } catch (error) {
          return {
            success: false,
            log: "",
            stderr: ((_a = error.stderr) == null ? void 0 : _a.toString()) || error.message
          };
        }
      },
      /**
       * 运行测试
       */
      runTest: async (params, context) => {
        var _a, _b;
        const { pattern, watch = false } = params;
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        let testCmd = "npm test";
        const workspaceRoot = context.workspaceRoot || "";
        try {
          if (workspaceRoot) {
            const pkgPath = path6.join(workspaceRoot, "package.json");
            if (fs5.existsSync(pkgPath)) {
              const pkg = JSON.parse(fs5.readFileSync(pkgPath, "utf-8"));
              const deps = { ...pkg.dependencies, ...pkg.devDependencies };
              if (deps["vitest"]) {
                testCmd = watch ? "npx vitest" : "npx vitest run";
              } else if (deps["jest"]) {
                testCmd = watch ? "npx jest --watch" : "npx jest";
              }
            }
          }
          if (pattern) {
            testCmd += ` ${pattern}`;
          }
          const { stdout, stderr } = await execAsync2(testCmd, {
            cwd: workspaceRoot || process.cwd(),
            timeout: 12e4,
            maxBuffer: 10 * 1024 * 1024
          });
          return {
            success: true,
            command: testCmd,
            stdout: stdout.toString(),
            stderr: stderr.toString()
          };
        } catch (error) {
          return {
            success: false,
            command: testCmd,
            stdout: ((_a = error.stdout) == null ? void 0 : _a.toString()) || "",
            stderr: ((_b = error.stderr) == null ? void 0 : _b.toString()) || error.message
          };
        }
      },
      /**
       * 构建项目
       */
      buildProject: async (params, context) => {
        var _a, _b;
        const { command } = params;
        const { exec: exec2 } = require("child_process");
        const { promisify: promisify2 } = require("util");
        const execAsync2 = promisify2(exec2);
        let buildCmd = command || "npm run build";
        try {
          const { stdout, stderr } = await execAsync2(buildCmd, {
            cwd: context.workspaceRoot,
            timeout: 3e5,
            // 5分钟超时
            maxBuffer: 10 * 1024 * 1024
          });
          return {
            success: true,
            command: buildCmd,
            stdout: stdout.toString(),
            stderr: stderr.toString()
          };
        } catch (error) {
          return {
            success: false,
            command: buildCmd,
            stdout: ((_a = error.stdout) == null ? void 0 : _a.toString()) || "",
            stderr: ((_b = error.stderr) == null ? void 0 : _b.toString()) || error.message
          };
        }
      },
      /**
       * 生成图表（返回提示，实际生成需要AI配合）
       */
      generateDiagram: async (params, context) => {
        const { type = "flowchart", source = "file", description } = params;
        let content = "";
        if (source === "description") {
          content = description || "";
        } else if (source === "selection") {
          const editor = vscode10.window.activeTextEditor;
          if (editor && !editor.selection.isEmpty) {
            content = editor.document.getText(editor.selection);
          }
        } else if (source === "file") {
          const editor = vscode10.window.activeTextEditor;
          if (editor) {
            content = editor.document.getText();
          }
        }
        return {
          type,
          source,
          content,
          instruction: `\u8BF7\u6839\u636E\u4EE5\u4E0A\u5185\u5BB9\u751F\u6210 ${type} \u7C7B\u578B\u7684 Mermaid \u56FE\u8868`
        };
      },
      /**
       * 生成测试（返回提示，实际生成需要AI配合）
       */
      generateTest: async (params, context) => {
        const { file, framework } = params;
        let targetFile = file;
        let content = "";
        if (!targetFile) {
          const editor = vscode10.window.activeTextEditor;
          if (editor) {
            targetFile = vscode10.workspace.asRelativePath(editor.document.uri);
            content = editor.document.getText();
          }
        } else {
          const workspaceRoot = context.workspaceRoot || "";
          const fullPath = path6.isAbsolute(targetFile) ? targetFile : path6.join(workspaceRoot, targetFile);
          if (fs5.existsSync(fullPath)) {
            content = fs5.readFileSync(fullPath, "utf-8");
          }
        }
        let detectedFramework = framework || "auto";
        if (detectedFramework === "auto") {
          try {
            const workspaceRoot = context.workspaceRoot || "";
            if (workspaceRoot) {
              const pkgPath = path6.join(workspaceRoot, "package.json");
              if (fs5.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs5.readFileSync(pkgPath, "utf-8"));
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (deps["vitest"])
                  detectedFramework = "vitest";
                else if (deps["jest"])
                  detectedFramework = "jest";
                else if (deps["mocha"])
                  detectedFramework = "mocha";
              }
            }
            if (targetFile == null ? void 0 : targetFile.endsWith(".py")) {
              detectedFramework = "pytest";
            }
          } catch (e) {
          }
        }
        return {
          file: targetFile,
          content,
          framework: detectedFramework,
          instruction: `\u8BF7\u4E3A\u4EE5\u4E0A\u4EE3\u7801\u751F\u6210 ${detectedFramework} \u5355\u5143\u6D4B\u8BD5`
        };
      }
    };
  }
});

// src/extension/mcp/additionalBuiltins.ts
function getAdditionalBuiltinTools() {
  return [
    // 测试生成器工具
    {
      id: "builtin_generate_test",
      name: "\u751F\u6210\u5355\u5143\u6D4B\u8BD5",
      description: "\u81EA\u52A8\u8BC6\u522B\u9879\u76EE\u6D4B\u8BD5\u6846\u67B6\u5E76\u4E3A\u6E90\u4EE3\u7801\u751F\u6210\u5BF9\u5E94\u7684\u5355\u5143\u6D4B\u8BD5\uFF0C\u652F\u6301Jest/Vitest/Pytest/Go/JUnit\u7B49",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["test", "unit-test", "testing", "generate", "jest", "vitest", "pytest"],
      parameters: [
        {
          name: "filePath",
          type: "file",
          description: "\u8981\u751F\u6210\u6D4B\u8BD5\u7684\u6E90\u6587\u4EF6\u8DEF\u5F84\uFF08\u53EF\u9009\uFF0C\u9ED8\u8BA4\u5F53\u524D\u6587\u4EF6\uFF09",
          required: false
        },
        {
          name: "code",
          type: "string",
          description: "\u8981\u751F\u6210\u6D4B\u8BD5\u7684\u4EE3\u7801\u5185\u5BB9\uFF08\u53EF\u9009\uFF0C\u5982\u679C\u4E0D\u63D0\u4F9B\u5219\u8BFB\u53D6\u6587\u4EF6\uFF09",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u751F\u6210\u7684\u6D4B\u8BD5\u4EE3\u7801\u3001\u5EFA\u8BAE\u7684\u6587\u4EF6\u8DEF\u5F84\u3001\u68C0\u6D4B\u5230\u7684\u6846\u67B6",
        schema: {
          testCode: "string",
          suggestedPath: "string",
          framework: "string",
          language: "string"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "generateTest"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u7528\u6237\u9700\u8981\u4E3A\u4EE3\u7801\u751F\u6210\u5355\u5143\u6D4B\u8BD5\u65F6\u4F7F\u7528",
        examples: [
          {
            input: { filePath: "src/utils.ts" },
            output: { testCode: "...", framework: "jest", suggestedPath: "src/utils_test.ts" },
            description: "\u4E3ATypeScript\u6587\u4EF6\u751F\u6210Jest\u6D4B\u8BD5"
          }
        ],
        priority: 85
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 代码分析工具
    {
      id: "builtin_analyze_code",
      name: "\u5206\u6790\u4EE3\u7801",
      description: "\u5206\u6790\u4EE3\u7801\u7ED3\u6784\u3001\u590D\u6742\u5EA6\u3001\u4F9D\u8D56\u5173\u7CFB\u7B49",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "analyze", "structure", "complexity", "dependency"],
      parameters: [
        {
          name: "file",
          type: "file",
          description: "\u8981\u5206\u6790\u7684\u6587\u4EF6\u8DEF\u5F84\uFF08\u53EF\u9009\uFF0C\u9ED8\u8BA4\u5F53\u524D\u6587\u4EF6\uFF09",
          required: false
        },
        {
          name: "type",
          type: "string",
          description: "\u5206\u6790\u7C7B\u578B",
          required: false,
          default: "full",
          validation: {
            enum: ["full", "structure", "complexity", "dependencies", "issues"]
          }
        },
        {
          name: "includeMetrics",
          type: "boolean",
          description: "\u662F\u5426\u5305\u542B\u4EE3\u7801\u5EA6\u91CF\u6307\u6807",
          required: false,
          default: true
        }
      ],
      returns: {
        type: "object",
        description: "\u4EE3\u7801\u5206\u6790\u7ED3\u679C",
        schema: {
          structure: "object",
          complexity: "object",
          dependencies: "array",
          issues: "array",
          metrics: "object"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "analyzeCode"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u4E86\u89E3\u4EE3\u7801\u7ED3\u6784\u3001\u590D\u6742\u5EA6\u6216\u5BFB\u627E\u6F5C\u5728\u95EE\u9898\u65F6\u4F7F\u7528",
        examples: [
          {
            input: { file: "src/index.ts", type: "full" },
            output: {
              structure: { classes: 2, functions: 5 },
              complexity: { cyclomatic: 8 },
              dependencies: ["vscode", "path"],
              issues: []
            },
            description: "\u5206\u6790TypeScript\u6587\u4EF6"
          }
        ],
        priority: 80
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 代码重构工具
    {
      id: "builtin_refactor_code",
      name: "\u91CD\u6784\u4EE3\u7801",
      description: "\u6267\u884C\u4EE3\u7801\u91CD\u6784\u64CD\u4F5C\uFF0C\u5982\u63D0\u53D6\u51FD\u6570\u3001\u91CD\u547D\u540D\u3001\u79FB\u52A8\u7B49",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "refactor", "extract", "rename", "move"],
      parameters: [
        {
          name: "action",
          type: "string",
          description: "\u91CD\u6784\u64CD\u4F5C\u7C7B\u578B",
          required: true,
          validation: {
            enum: ["extract-function", "extract-variable", "rename", "move", "inline"]
          }
        },
        {
          name: "target",
          type: "string",
          description: "\u76EE\u6807\u4EE3\u7801\u6216\u7B26\u53F7\u540D\u79F0",
          required: true
        },
        {
          name: "newName",
          type: "string",
          description: "\u65B0\u540D\u79F0\uFF08\u7528\u4E8Erename\u64CD\u4F5C\uFF09",
          required: false
        },
        {
          name: "destination",
          type: "string",
          description: "\u76EE\u6807\u4F4D\u7F6E\uFF08\u7528\u4E8Emove\u64CD\u4F5C\uFF09",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u91CD\u6784\u7ED3\u679C",
        schema: {
          success: "boolean",
          changes: "array",
          preview: "string"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "refactorCode"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u91CD\u6784\u4EE3\u7801\u65F6\u4F7F\u7528",
        priority: 70
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ["user", "agent"]
      }
    },
    // 代码格式化工具
    {
      id: "builtin_format_code",
      name: "\u683C\u5F0F\u5316\u4EE3\u7801",
      description: "\u683C\u5F0F\u5316\u4EE3\u7801\u6216\u6587\u4EF6",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "format", "prettier", "lint"],
      parameters: [
        {
          name: "file",
          type: "file",
          description: "\u8981\u683C\u5F0F\u5316\u7684\u6587\u4EF6\uFF08\u53EF\u9009\uFF0C\u9ED8\u8BA4\u5F53\u524D\u6587\u4EF6\uFF09",
          required: false
        },
        {
          name: "formatter",
          type: "string",
          description: "\u4F7F\u7528\u7684\u683C\u5F0F\u5316\u5DE5\u5177",
          required: false,
          default: "auto",
          validation: {
            enum: ["auto", "prettier", "eslint", "vscode"]
          }
        }
      ],
      returns: {
        type: "object",
        description: "\u683C\u5F0F\u5316\u7ED3\u679C",
        schema: {
          success: "boolean",
          formatted: "string",
          changes: "number"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "formatCode"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u683C\u5F0F\u5316\u4EE3\u7801\u65F6\u4F7F\u7528",
        priority: 65
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 代码解释工具
    {
      id: "builtin_explain_code",
      name: "\u89E3\u91CA\u4EE3\u7801",
      description: "\u83B7\u53D6\u4EE3\u7801\u7684\u8BE6\u7EC6\u89E3\u91CA\uFF0C\u5305\u62EC\u51FD\u6570\u4F5C\u7528\u3001\u53C2\u6570\u8BF4\u660E\u7B49",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "explain", "document", "understand"],
      parameters: [
        {
          name: "code",
          type: "code",
          description: "\u8981\u89E3\u91CA\u7684\u4EE3\u7801\uFF08\u53EF\u9009\uFF0C\u4F7F\u7528\u9009\u4E2D\u5185\u5BB9\uFF09",
          required: false
        },
        {
          name: "level",
          type: "string",
          description: "\u89E3\u91CA\u8BE6\u7EC6\u7A0B\u5EA6",
          required: false,
          default: "normal",
          validation: {
            enum: ["brief", "normal", "detailed"]
          }
        }
      ],
      returns: {
        type: "object",
        description: "\u4EE3\u7801\u89E3\u91CA",
        schema: {
          summary: "string",
          details: "object",
          examples: "array"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "explainCode"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u7528\u6237\u8BF7\u6C42\u89E3\u91CA\u4EE3\u7801\u65F6\u4F7F\u7528",
        priority: 75
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 代码优化建议工具
    {
      id: "builtin_suggest_optimization",
      name: "\u4F18\u5316\u5EFA\u8BAE",
      description: "\u5206\u6790\u4EE3\u7801\u5E76\u63D0\u4F9B\u4F18\u5316\u5EFA\u8BAE",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "optimize", "performance", "suggestion"],
      parameters: [
        {
          name: "file",
          type: "file",
          description: "\u8981\u5206\u6790\u7684\u6587\u4EF6",
          required: false
        },
        {
          name: "focus",
          type: "string",
          description: "\u4F18\u5316\u91CD\u70B9",
          required: false,
          default: "all",
          validation: {
            enum: ["all", "performance", "readability", "security", "memory"]
          }
        }
      ],
      returns: {
        type: "object",
        description: "\u4F18\u5316\u5EFA\u8BAE\u5217\u8868",
        schema: {
          suggestions: "array",
          priority: "string"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "suggestOptimization"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u6539\u8FDB\u4EE3\u7801\u8D28\u91CF\u65F6\u4F7F\u7528",
        priority: 70
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 文档生成工具
    {
      id: "builtin_generate_docs",
      name: "\u751F\u6210\u6587\u6863",
      description: "\u4E3A\u4EE3\u7801\u751F\u6210\u6587\u6863\u6CE8\u91CA",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "document", "jsdoc", "comment"],
      parameters: [
        {
          name: "file",
          type: "file",
          description: "\u8981\u751F\u6210\u6587\u6863\u7684\u6587\u4EF6",
          required: false
        },
        {
          name: "style",
          type: "string",
          description: "\u6587\u6863\u98CE\u683C",
          required: false,
          default: "jsdoc",
          validation: {
            enum: ["jsdoc", "tsdoc", "docstring", "javadoc"]
          }
        },
        {
          name: "overwrite",
          type: "boolean",
          description: "\u662F\u5426\u8986\u76D6\u73B0\u6709\u6587\u6863",
          required: false,
          default: false
        }
      ],
      returns: {
        type: "object",
        description: "\u751F\u6210\u7684\u6587\u6863",
        schema: {
          documentedItems: "number",
          preview: "string"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "generateDocs"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u4E3A\u4EE3\u7801\u6DFB\u52A0\u6587\u6863\u6CE8\u91CA\u65F6\u4F7F\u7528",
        priority: 65
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 依赖分析工具
    {
      id: "builtin_analyze_dependencies",
      name: "\u5206\u6790\u4F9D\u8D56",
      description: "\u5206\u6790\u9879\u76EE\u4F9D\u8D56\u5173\u7CFB\u3001\u7248\u672C\u548C\u5B89\u5168\u95EE\u9898",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["dependency", "package", "npm", "security", "audit"],
      parameters: [
        {
          name: "type",
          type: "string",
          description: "\u5206\u6790\u7C7B\u578B",
          required: false,
          default: "all",
          validation: {
            enum: ["all", "outdated", "security", "unused", "duplicates"]
          }
        }
      ],
      returns: {
        type: "object",
        description: "\u4F9D\u8D56\u5206\u6790\u7ED3\u679C",
        schema: {
          dependencies: "object",
          devDependencies: "object",
          issues: "array",
          recommendations: "array"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "analyzeDependencies"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u68C0\u67E5\u9879\u76EE\u4F9D\u8D56\u65F6\u4F7F\u7528",
        priority: 60
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 代码片段工具
    {
      id: "builtin_code_snippet",
      name: "\u4EE3\u7801\u7247\u6BB5",
      description: "\u641C\u7D22\u548C\u63D2\u5165\u5E38\u7528\u4EE3\u7801\u7247\u6BB5",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["code", "snippet", "template", "boilerplate"],
      parameters: [
        {
          name: "action",
          type: "string",
          description: "\u64CD\u4F5C\u7C7B\u578B",
          required: true,
          validation: {
            enum: ["search", "insert", "save", "list"]
          }
        },
        {
          name: "query",
          type: "string",
          description: "\u641C\u7D22\u5173\u952E\u8BCD\uFF08search\u65F6\u9700\u8981\uFF09",
          required: false
        },
        {
          name: "snippet",
          type: "code",
          description: "\u4EE3\u7801\u7247\u6BB5\uFF08insert/save\u65F6\u9700\u8981\uFF09",
          required: false
        },
        {
          name: "name",
          type: "string",
          description: "\u7247\u6BB5\u540D\u79F0\uFF08save\u65F6\u9700\u8981\uFF09",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u64CD\u4F5C\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "codeSnippet"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u4F7F\u7528\u5E38\u7528\u4EE3\u7801\u6A21\u677F\u65F6\u4F7F\u7528",
        priority: 55
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 终端管理工具
    {
      id: "builtin_terminal",
      name: "\u7EC8\u7AEF\u7BA1\u7406",
      description: "\u521B\u5EFA\u3001\u5207\u6362\u548C\u7BA1\u7406\u7EC8\u7AEF",
      version: "1.0.0",
      author: "System",
      category: "shell",
      tags: ["terminal", "shell", "console"],
      parameters: [
        {
          name: "action",
          type: "string",
          description: "\u64CD\u4F5C\u7C7B\u578B",
          required: true,
          validation: {
            enum: ["create", "show", "hide", "dispose", "list", "sendText"]
          }
        },
        {
          name: "name",
          type: "string",
          description: "\u7EC8\u7AEF\u540D\u79F0",
          required: false
        },
        {
          name: "text",
          type: "string",
          description: "\u8981\u53D1\u9001\u7684\u6587\u672C\uFF08sendText\u65F6\u9700\u8981\uFF09",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u7EC8\u7AEF\u64CD\u4F5C\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "terminalManage"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u7BA1\u7406VS Code\u7EC8\u7AEF\u65F6\u4F7F\u7528",
        priority: 50
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 工作区管理工具
    {
      id: "builtin_workspace",
      name: "\u5DE5\u4F5C\u533A\u7BA1\u7406",
      description: "\u7BA1\u7406VS Code\u5DE5\u4F5C\u533A",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["workspace", "folder", "project"],
      parameters: [
        {
          name: "action",
          type: "string",
          description: "\u64CD\u4F5C\u7C7B\u578B",
          required: true,
          validation: {
            enum: ["info", "addFolder", "removeFolder", "openFile", "openFolder"]
          }
        },
        {
          name: "path",
          type: "string",
          description: "\u6587\u4EF6\u6216\u6587\u4EF6\u5939\u8DEF\u5F84",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u5DE5\u4F5C\u533A\u4FE1\u606F\u6216\u64CD\u4F5C\u7ED3\u679C"
      },
      execution: {
        type: "function",
        builtinFunction: "workspaceManage"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u7BA1\u7406\u5DE5\u4F5C\u533A\u65F6\u4F7F\u7528",
        priority: 50
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 符号查找工具
    {
      id: "builtin_find_symbol",
      name: "\u67E5\u627E\u7B26\u53F7",
      description: "\u5728\u5DE5\u4F5C\u533A\u4E2D\u67E5\u627E\u7B26\u53F7\u5B9A\u4E49",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["symbol", "definition", "reference", "find"],
      parameters: [
        {
          name: "name",
          type: "string",
          description: "\u7B26\u53F7\u540D\u79F0",
          required: true
        },
        {
          name: "kind",
          type: "string",
          description: "\u7B26\u53F7\u7C7B\u578B",
          required: false,
          validation: {
            enum: ["all", "class", "function", "method", "variable", "interface", "type"]
          }
        }
      ],
      returns: {
        type: "array",
        description: "\u7B26\u53F7\u4F4D\u7F6E\u5217\u8868"
      },
      execution: {
        type: "function",
        builtinFunction: "findSymbol"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u67E5\u627E\u4EE3\u7801\u4E2D\u7684\u7B26\u53F7\u5B9A\u4E49\u65F6\u4F7F\u7528",
        priority: 75
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 代码诊断工具
    {
      id: "builtin_diagnostics",
      name: "\u4EE3\u7801\u8BCA\u65AD",
      description: "\u83B7\u53D6\u4EE3\u7801\u8BCA\u65AD\u4FE1\u606F\uFF08\u9519\u8BEF\u3001\u8B66\u544A\u7B49\uFF09",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["diagnostics", "errors", "warnings", "lint"],
      parameters: [
        {
          name: "file",
          type: "file",
          description: "\u8981\u8BCA\u65AD\u7684\u6587\u4EF6\uFF08\u53EF\u9009\uFF0C\u9ED8\u8BA4\u5F53\u524D\u6587\u4EF6\uFF09",
          required: false
        },
        {
          name: "severity",
          type: "string",
          description: "\u4E25\u91CD\u7A0B\u5EA6\u8FC7\u6EE4",
          required: false,
          default: "all",
          validation: {
            enum: ["all", "error", "warning", "info", "hint"]
          }
        }
      ],
      returns: {
        type: "array",
        description: "\u8BCA\u65AD\u4FE1\u606F\u5217\u8868"
      },
      execution: {
        type: "function",
        builtinFunction: "getDiagnostics"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u68C0\u67E5\u4EE3\u7801\u95EE\u9898\u65F6\u4F7F\u7528",
        priority: 80
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    },
    // 自动修复工具
    {
      id: "builtin_auto_fix",
      name: "\u81EA\u52A8\u4FEE\u590D",
      description: "\u81EA\u52A8\u4FEE\u590D\u4EE3\u7801\u95EE\u9898",
      version: "1.0.0",
      author: "System",
      category: "code",
      tags: ["fix", "auto", "quick-fix", "repair"],
      parameters: [
        {
          name: "file",
          type: "file",
          description: "\u8981\u4FEE\u590D\u7684\u6587\u4EF6",
          required: false
        },
        {
          name: "diagnosticIndex",
          type: "number",
          description: "\u8981\u4FEE\u590D\u7684\u8BCA\u65AD\u7D22\u5F15\uFF08\u53EF\u9009\uFF0C\u4E0D\u6307\u5B9A\u5219\u4FEE\u590D\u6240\u6709\uFF09",
          required: false
        }
      ],
      returns: {
        type: "object",
        description: "\u4FEE\u590D\u7ED3\u679C",
        schema: {
          fixed: "number",
          remaining: "number"
        }
      },
      execution: {
        type: "function",
        builtinFunction: "autoFix"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u81EA\u52A8\u4FEE\u590D\u4EE3\u7801\u95EE\u9898\u65F6\u4F7F\u7528",
        priority: 70
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ["user", "agent"]
      }
    },
    // 列出MCP工具
    {
      id: "builtin_list_tools",
      name: "\u5217\u51FA\u5DE5\u5177",
      description: "\u5217\u51FA\u6240\u6709\u53EF\u7528\u7684MCP\u5DE5\u5177",
      version: "1.0.0",
      author: "System",
      category: "utility",
      tags: ["mcp", "tools", "list", "help"],
      parameters: [
        {
          name: "category",
          type: "string",
          description: "\u6309\u7C7B\u522B\u8FC7\u6EE4",
          required: false
        },
        {
          name: "search",
          type: "string",
          description: "\u641C\u7D22\u5173\u952E\u8BCD",
          required: false
        }
      ],
      returns: {
        type: "array",
        description: "\u5DE5\u5177\u5217\u8868"
      },
      execution: {
        type: "function",
        builtinFunction: "listTools"
      },
      metadata: {
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      aiHints: {
        whenToUse: "\u5F53\u9700\u8981\u67E5\u770B\u53EF\u7528\u5DE5\u5177\u65F6\u4F7F\u7528",
        priority: 50
      },
      security: {
        allowedCallers: ["user", "agent"]
      }
    }
  ];
}
function analyzeStructure(content, filePath) {
  const structure = {
    classes: 0,
    functions: 0,
    methods: 0,
    interfaces: 0,
    variables: 0,
    exports: 0
  };
  structure.classes = (content.match(/\bclass\s+\w+/g) || []).length;
  structure.functions = (content.match(/\bfunction\s+\w+/g) || []).length + (content.match(/\bconst\s+\w+\s*=\s*(async\s+)?\(/g) || []).length;
  structure.interfaces = (content.match(/\binterface\s+\w+/g) || []).length;
  structure.exports = (content.match(/\bexport\s+(default\s+)?/g) || []).length;
  return structure;
}
function analyzeComplexity(content) {
  const lines = content.split("\n");
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0).length;
  const branchingKeywords = ["if", "else", "for", "while", "switch", "case", "catch", "\\?", "&&", "\\|\\|"];
  let cyclomatic = 1;
  branchingKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "g");
    cyclomatic += (content.match(regex) || []).length;
  });
  return {
    cyclomatic,
    linesOfCode: lines.length,
    nonEmptyLines,
    commentLines: lines.filter((l) => l.trim().startsWith("//")).length
  };
}
function analyzeDeps(content, filePath) {
  const deps = [];
  const importMatches = content.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g);
  for (const match of importMatches) {
    deps.push(match[1]);
  }
  const requireMatches = content.matchAll(/require\s*\(\s*['"](.+?)['"]\s*\)/g);
  for (const match of requireMatches) {
    deps.push(match[1]);
  }
  return [...new Set(deps)];
}
function detectIssues(content, filePath) {
  const issues = [];
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    var _a;
    if (/console\.(log|warn|error)/.test(line)) {
      issues.push({
        type: "warning",
        line: index + 1,
        message: "\u4EE3\u7801\u4E2D\u5305\u542B console \u8BED\u53E5"
      });
    }
    if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(line)) {
      issues.push({
        type: "info",
        line: index + 1,
        message: ((_a = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX).*/i)) == null ? void 0 : _a[0]) || "TODO/FIXME \u6CE8\u91CA"
      });
    }
    if (line.length > 120) {
      issues.push({
        type: "style",
        line: index + 1,
        message: "\u884C\u957F\u5EA6\u8D85\u8FC7120\u5B57\u7B26"
      });
    }
  });
  return issues;
}
function calculateMetrics(content) {
  const lines = content.split("\n");
  return {
    totalLines: lines.length,
    codeLines: lines.filter((l) => l.trim().length > 0 && !l.trim().startsWith("//")).length,
    commentLines: lines.filter((l) => l.trim().startsWith("//")).length,
    blankLines: lines.filter((l) => l.trim().length === 0).length,
    avgLineLength: Math.round(lines.reduce((sum, l) => sum + l.length, 0) / lines.length),
    maxLineLength: Math.max(...lines.map((l) => l.length))
  };
}
function getSymbolKind(kind) {
  const mapping = {
    class: vscode11.SymbolKind.Class,
    function: vscode11.SymbolKind.Function,
    method: vscode11.SymbolKind.Method,
    variable: vscode11.SymbolKind.Variable,
    interface: vscode11.SymbolKind.Interface,
    type: vscode11.SymbolKind.TypeParameter
  };
  return mapping[kind] || null;
}
function getSeverityFilter(severity) {
  const mapping = {
    error: vscode11.DiagnosticSeverity.Error,
    warning: vscode11.DiagnosticSeverity.Warning,
    info: vscode11.DiagnosticSeverity.Information,
    hint: vscode11.DiagnosticSeverity.Hint
  };
  return mapping[severity] || null;
}
var vscode11, fs6, path7, additionalBuiltinFunctions;
var init_additionalBuiltins = __esm({
  "src/extension/mcp/additionalBuiltins.ts"() {
    "use strict";
    vscode11 = __toESM(require("vscode"));
    fs6 = __toESM(require("fs"));
    path7 = __toESM(require("path"));
    additionalBuiltinFunctions = {
      /**
       * 生成单元测试
       * 此函数会发送消息到chatView触发TestHandler
       */
      generateTest: async (params, context) => {
        const { filePath, code } = params;
        const workspaceRoot = context.workspaceRoot || "";
        let targetPath = filePath;
        let sourceCode = code;
        if (!targetPath) {
          const editor = vscode11.window.activeTextEditor;
          if (editor) {
            targetPath = editor.document.uri.fsPath;
          }
        }
        if (!targetPath && !sourceCode) {
          throw new Error("\u8BF7\u63D0\u4F9B\u6587\u4EF6\u8DEF\u5F84\u6216\u4EE3\u7801\u5185\u5BB9");
        }
        if (targetPath && !sourceCode) {
          const fullPath = path7.isAbsolute(targetPath) ? targetPath : path7.join(workspaceRoot, targetPath);
          if (!fs6.existsSync(fullPath)) {
            throw new Error(`\u6587\u4EF6\u4E0D\u5B58\u5728: ${targetPath}`);
          }
          sourceCode = fs6.readFileSync(fullPath, "utf-8");
        }
        const { TestGenerator: TestGenerator2 } = await Promise.resolve().then(() => (init_TestGenerator(), TestGenerator_exports));
        const testGen = new TestGenerator2(context._extensionContext || {});
        const effectivePath = targetPath || "inline.ts";
        const { language, framework } = testGen.detectLanguageAndFramework(effectivePath, workspaceRoot);
        const testFilePath = testGen.generateTestFilePath(effectivePath, framework);
        const prompt = testGen.generatePrompt(sourceCode, effectivePath, framework);
        try {
          await vscode11.commands.executeCommand("aiAssistant.chatView.focus");
        } catch {
        }
        try {
          await vscode11.commands.executeCommand("aiAssistant.triggerTestGeneration", effectivePath);
        } catch {
        }
        return {
          status: "generating",
          message: `\u6B63\u5728\u4E3A ${path7.basename(effectivePath)} \u751F\u6210 ${framework} \u6D4B\u8BD5...`,
          framework,
          language,
          suggestedPath: testFilePath,
          sourceFile: effectivePath,
          sourceCode: sourceCode.slice(0, 500) + (sourceCode.length > 500 ? "..." : ""),
          prompt,
          instruction: `\u8BF7\u4E3A\u4EE5\u4E0A\u4EE3\u7801\u751F\u6210 ${framework} \u5355\u5143\u6D4B\u8BD5`
        };
      },
      /**
       * 分析代码
       */
      analyzeCode: async (params, context) => {
        const { file, type = "full", includeMetrics = true } = params;
        const workspaceRoot = context.workspaceRoot || "";
        let content = "";
        let filePath = file;
        if (!file) {
          const editor = vscode11.window.activeTextEditor;
          if (editor) {
            content = editor.document.getText();
            filePath = vscode11.workspace.asRelativePath(editor.document.uri);
          }
        } else {
          const fullPath = path7.isAbsolute(file) ? file : path7.join(workspaceRoot, file);
          if (fs6.existsSync(fullPath)) {
            content = fs6.readFileSync(fullPath, "utf-8");
          }
        }
        if (!content) {
          throw new Error("\u65E0\u6CD5\u83B7\u53D6\u6587\u4EF6\u5185\u5BB9");
        }
        const result = {};
        if (type === "full" || type === "structure") {
          result.structure = analyzeStructure(content, filePath);
        }
        if (type === "full" || type === "complexity") {
          result.complexity = analyzeComplexity(content);
        }
        if (type === "full" || type === "dependencies") {
          result.dependencies = analyzeDeps(content, filePath);
        }
        if (type === "full" || type === "issues") {
          result.issues = detectIssues(content, filePath);
        }
        if (includeMetrics) {
          result.metrics = calculateMetrics(content);
        }
        return result;
      },
      /**
       * 重构代码
       */
      refactorCode: async (params, context) => {
        const { action, target, newName, destination } = params;
        const editor = vscode11.window.activeTextEditor;
        if (!editor) {
          throw new Error("\u6CA1\u6709\u6D3B\u52A8\u7684\u7F16\u8F91\u5668");
        }
        switch (action) {
          case "rename":
            if (!newName)
              throw new Error("\u9700\u8981\u63D0\u4F9B\u65B0\u540D\u79F0");
            await vscode11.commands.executeCommand("editor.action.rename");
            return { success: true, message: "\u8BF7\u5728\u5F39\u51FA\u7684\u8F93\u5165\u6846\u4E2D\u8F93\u5165\u65B0\u540D\u79F0" };
          case "extract-function":
            await vscode11.commands.executeCommand("editor.action.codeAction", {
              kind: "refactor.extract.function"
            });
            return { success: true, message: "\u8BF7\u9009\u62E9\u8981\u63D0\u53D6\u7684\u4EE3\u7801" };
          case "extract-variable":
            await vscode11.commands.executeCommand("editor.action.codeAction", {
              kind: "refactor.extract.constant"
            });
            return { success: true, message: "\u8BF7\u9009\u62E9\u8981\u63D0\u53D6\u7684\u8868\u8FBE\u5F0F" };
          case "inline":
            await vscode11.commands.executeCommand("editor.action.codeAction", {
              kind: "refactor.inline"
            });
            return { success: true, message: "\u5185\u8054\u64CD\u4F5C\u5DF2\u89E6\u53D1" };
          default:
            throw new Error(`\u4E0D\u652F\u6301\u7684\u91CD\u6784\u64CD\u4F5C: ${action}`);
        }
      },
      /**
       * 格式化代码
       */
      formatCode: async (params, context) => {
        const { file, formatter = "auto" } = params;
        if (file) {
          const workspaceRoot = context.workspaceRoot || "";
          const fullPath = path7.isAbsolute(file) ? file : path7.join(workspaceRoot, file);
          const uri = vscode11.Uri.file(fullPath);
          const doc = await vscode11.workspace.openTextDocument(uri);
          await vscode11.window.showTextDocument(doc);
        }
        await vscode11.commands.executeCommand("editor.action.formatDocument");
        return {
          success: true,
          message: "\u683C\u5F0F\u5316\u5B8C\u6210"
        };
      },
      /**
       * 解释代码
       */
      explainCode: async (params, context) => {
        const { code, level = "normal" } = params;
        let targetCode = code;
        if (!targetCode) {
          const editor = vscode11.window.activeTextEditor;
          if (editor && !editor.selection.isEmpty) {
            targetCode = editor.document.getText(editor.selection);
          }
        }
        if (!targetCode) {
          throw new Error("\u8BF7\u9009\u62E9\u8981\u89E3\u91CA\u7684\u4EE3\u7801");
        }
        return {
          code: targetCode,
          level,
          instruction: `\u8BF7${level === "brief" ? "\u7B80\u8981" : level === "detailed" ? "\u8BE6\u7EC6" : ""}\u89E3\u91CA\u4EE5\u4E0B\u4EE3\u7801\u7684\u4F5C\u7528`
        };
      },
      /**
       * 优化建议
       */
      suggestOptimization: async (params, context) => {
        const { file, focus = "all" } = params;
        let content = "";
        let filePath = file;
        if (!file) {
          const editor = vscode11.window.activeTextEditor;
          if (editor) {
            content = editor.document.getText();
            filePath = vscode11.workspace.asRelativePath(editor.document.uri);
          }
        } else {
          const workspaceRoot = context.workspaceRoot || "";
          const fullPath = path7.isAbsolute(file) ? file : path7.join(workspaceRoot, file);
          if (fs6.existsSync(fullPath)) {
            content = fs6.readFileSync(fullPath, "utf-8");
          }
        }
        if (!content) {
          throw new Error("\u65E0\u6CD5\u83B7\u53D6\u6587\u4EF6\u5185\u5BB9");
        }
        return {
          code: content,
          file: filePath,
          focus,
          instruction: `\u8BF7\u5206\u6790\u4EE3\u7801\u5E76\u63D0\u4F9B${focus === "all" ? "\u5168\u9762\u7684" : focus}\u4F18\u5316\u5EFA\u8BAE`
        };
      },
      /**
       * 生成文档
       */
      generateDocs: async (params, context) => {
        const { file, style = "jsdoc", overwrite = false } = params;
        let content = "";
        let filePath = file;
        if (!file) {
          const editor = vscode11.window.activeTextEditor;
          if (editor) {
            content = editor.document.getText();
            filePath = vscode11.workspace.asRelativePath(editor.document.uri);
          }
        } else {
          const workspaceRoot = context.workspaceRoot || "";
          const fullPath = path7.isAbsolute(file) ? file : path7.join(workspaceRoot, file);
          if (fs6.existsSync(fullPath)) {
            content = fs6.readFileSync(fullPath, "utf-8");
          }
        }
        if (!content) {
          throw new Error("\u65E0\u6CD5\u83B7\u53D6\u6587\u4EF6\u5185\u5BB9");
        }
        return {
          code: content,
          file: filePath,
          style,
          overwrite,
          instruction: `\u8BF7\u4E3A\u4EE3\u7801\u751F\u6210 ${style} \u98CE\u683C\u7684\u6587\u6863\u6CE8\u91CA`
        };
      },
      /**
       * 分析依赖
       */
      analyzeDependencies: async (params, context) => {
        const { type = "all" } = params;
        const workspaceRoot = context.workspaceRoot || "";
        const pkgPath = path7.join(workspaceRoot, "package.json");
        if (!fs6.existsSync(pkgPath)) {
          throw new Error("\u627E\u4E0D\u5230 package.json");
        }
        const pkg = JSON.parse(fs6.readFileSync(pkgPath, "utf-8"));
        const result = {
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {},
          issues: [],
          recommendations: []
        };
        if (type === "all" || type === "outdated") {
          result.recommendations.push("\u8FD0\u884C npm outdated \u68C0\u67E5\u8FC7\u671F\u4F9D\u8D56");
        }
        if (type === "all" || type === "security") {
          result.recommendations.push("\u8FD0\u884C npm audit \u68C0\u67E5\u5B89\u5168\u95EE\u9898");
        }
        return result;
      },
      /**
       * 代码片段
       */
      codeSnippet: async (params, context) => {
        const { action, query, snippet, name } = params;
        switch (action) {
          case "list":
            return { snippets: ["component", "hook", "api-call", "test"] };
          case "search":
            return {
              results: [],
              instruction: `\u641C\u7D22\u4EE3\u7801\u7247\u6BB5: ${query}`
            };
          case "insert":
            if (!snippet)
              throw new Error("\u9700\u8981\u63D0\u4F9B\u4EE3\u7801\u7247\u6BB5");
            const editor = vscode11.window.activeTextEditor;
            if (editor) {
              await editor.edit((builder) => {
                builder.insert(editor.selection.active, snippet);
              });
            }
            return { success: true };
          case "save":
            return { success: true, message: "\u7247\u6BB5\u4FDD\u5B58\u529F\u80FD\u5F85\u5B9E\u73B0" };
          default:
            throw new Error(`\u4E0D\u652F\u6301\u7684\u64CD\u4F5C: ${action}`);
        }
      },
      /**
       * 终端管理
       */
      terminalManage: async (params, context) => {
        var _a, _b;
        const { action, name, text } = params;
        switch (action) {
          case "create":
            const terminal = vscode11.window.createTerminal(name || "AI Assistant");
            terminal.show();
            return { success: true, name: terminal.name };
          case "list":
            return {
              terminals: vscode11.window.terminals.map((t2) => ({
                name: t2.name
              }))
            };
          case "sendText":
            const activeTerminal = vscode11.window.activeTerminal;
            if (activeTerminal && text) {
              activeTerminal.sendText(text);
            }
            return { success: true };
          case "show":
            (_a = vscode11.window.activeTerminal) == null ? void 0 : _a.show();
            return { success: true };
          case "hide":
            (_b = vscode11.window.activeTerminal) == null ? void 0 : _b.hide();
            return { success: true };
          default:
            throw new Error(`\u4E0D\u652F\u6301\u7684\u64CD\u4F5C: ${action}`);
        }
      },
      /**
       * 工作区管理
       */
      workspaceManage: async (params, context) => {
        var _a;
        const { action, path: targetPath } = params;
        switch (action) {
          case "info":
            return {
              folders: ((_a = vscode11.workspace.workspaceFolders) == null ? void 0 : _a.map((f) => ({
                name: f.name,
                path: f.uri.fsPath
              }))) || [],
              name: vscode11.workspace.name
            };
          case "openFile":
            if (targetPath) {
              const uri = vscode11.Uri.file(targetPath);
              await vscode11.window.showTextDocument(uri);
            }
            return { success: true };
          case "openFolder":
            if (targetPath) {
              await vscode11.commands.executeCommand("vscode.openFolder", vscode11.Uri.file(targetPath));
            }
            return { success: true };
          default:
            throw new Error(`\u4E0D\u652F\u6301\u7684\u64CD\u4F5C: ${action}`);
        }
      },
      /**
       * 查找符号
       */
      findSymbol: async (params, context) => {
        const { name, kind = "all" } = params;
        const symbols = await vscode11.commands.executeCommand(
          "vscode.executeWorkspaceSymbolProvider",
          name
        );
        if (!symbols) {
          return [];
        }
        const kindFilter = kind === "all" ? null : getSymbolKind(kind);
        return symbols.filter((s) => kindFilter === null || s.kind === kindFilter).slice(0, 20).map((s) => ({
          name: s.name,
          kind: vscode11.SymbolKind[s.kind],
          file: vscode11.workspace.asRelativePath(s.location.uri),
          line: s.location.range.start.line + 1
        }));
      },
      /**
       * 获取诊断信息
       */
      getDiagnostics: async (params, context) => {
        var _a;
        const { file, severity = "all" } = params;
        let uri;
        if (file) {
          const workspaceRoot = context.workspaceRoot || "";
          const fullPath = path7.isAbsolute(file) ? file : path7.join(workspaceRoot, file);
          uri = vscode11.Uri.file(fullPath);
        } else {
          uri = (_a = vscode11.window.activeTextEditor) == null ? void 0 : _a.document.uri;
        }
        if (!uri) {
          throw new Error("\u8BF7\u6307\u5B9A\u6587\u4EF6\u6216\u6253\u5F00\u4E00\u4E2A\u6587\u4EF6");
        }
        const diagnostics = vscode11.languages.getDiagnostics(uri);
        const severityFilter = getSeverityFilter(severity);
        return diagnostics.filter((d) => severityFilter === null || d.severity === severityFilter).map((d) => ({
          message: d.message,
          severity: vscode11.DiagnosticSeverity[d.severity],
          line: d.range.start.line + 1,
          column: d.range.start.character + 1,
          source: d.source
        }));
      },
      /**
       * 自动修复
       */
      autoFix: async (params, context) => {
        const { file } = params;
        if (file) {
          const workspaceRoot = context.workspaceRoot || "";
          const fullPath = path7.isAbsolute(file) ? file : path7.join(workspaceRoot, file);
          const uri = vscode11.Uri.file(fullPath);
          const doc = await vscode11.workspace.openTextDocument(uri);
          await vscode11.window.showTextDocument(doc);
        }
        await vscode11.commands.executeCommand("editor.action.fixAll");
        return {
          success: true,
          message: "\u81EA\u52A8\u4FEE\u590D\u5DF2\u6267\u884C"
        };
      },
      /**
       * 列出工具
       */
      listTools: async (params, context) => {
        const { category, search } = params;
        return {
          instruction: `\u5217\u51FA${category ? `${category}\u7C7B\u522B\u7684` : "\u6240\u6709"}\u5DE5\u5177${search ? `\uFF0C\u641C\u7D22: ${search}` : ""}`
        };
      }
    };
  }
});

// src/extension/mcp/MCPRegistry.ts
var vscode12, STORAGE_KEY2, CONFIG_KEY, _MCPRegistry, MCPRegistry;
var init_MCPRegistry = __esm({
  "src/extension/mcp/MCPRegistry.ts"() {
    "use strict";
    vscode12 = __toESM(require("vscode"));
    init_builtins();
    init_additionalBuiltins();
    STORAGE_KEY2 = "aiAssistant.mcp.tools";
    CONFIG_KEY = "aiAssistant.mcp.config";
    _MCPRegistry = class _MCPRegistry {
      constructor(context) {
        this.tools = /* @__PURE__ */ new Map();
        // 事件发射器
        this._onToolsChanged = new vscode12.EventEmitter();
        this.onToolsChanged = this._onToolsChanged.event;
        this.context = context;
        this.config = this.loadConfig();
        this.loadTools();
      }
      /**
       * 获取单例实例
       */
      static getInstance(context) {
        if (!_MCPRegistry.instance) {
          _MCPRegistry.instance = new _MCPRegistry(context);
        }
        return _MCPRegistry.instance;
      }
      // ============================================
      // 配置管理
      // ============================================
      /**
       * 加载配置
       */
      loadConfig() {
        const saved = this.context.globalState.get(CONFIG_KEY);
        return {
          enabled: true,
          maxToolsPerRequest: 5,
          defaultTimeout: 3e4,
          logAllExecutions: true,
          envVariables: {},
          dangerousCommands: [
            "rm -rf",
            "format",
            "del /s",
            "rmdir /s",
            "drop database",
            "truncate table"
          ],
          ...saved
        };
      }
      /**
       * 保存配置
       */
      async saveConfig() {
        await this.context.globalState.update(CONFIG_KEY, this.config);
      }
      /**
       * 获取配置
       */
      getConfig() {
        return { ...this.config };
      }
      /**
       * 更新配置
       */
      async updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        await this.saveConfig();
      }
      // ============================================
      // 工具加载和保存
      // ============================================
      /**
       * 加载工具
       */
      loadTools() {
        const builtinTools = getBuiltinTools();
        for (const tool of builtinTools) {
          this.tools.set(tool.id, {
            tool,
            source: "builtin",
            enabled: true
          });
        }
        const additionalTools = getAdditionalBuiltinTools();
        for (const tool of additionalTools) {
          this.tools.set(tool.id, {
            tool,
            source: "builtin",
            enabled: true
          });
        }
        const savedTools = this.context.globalState.get(STORAGE_KEY2) || [];
        for (const registration of savedTools) {
          if (!this.tools.has(registration.tool.id) || registration.source !== "builtin") {
            this.tools.set(registration.tool.id, registration);
          }
        }
        const totalBuiltin = builtinTools.length + additionalTools.length;
        console.log(`[MCPRegistry] Loaded ${this.tools.size} tools (${totalBuiltin} builtin)`);
      }
      /**
       * 保存工具
       */
      async saveTools() {
        const toSave = Array.from(this.tools.values()).filter((r) => r.source !== "builtin");
        await this.context.globalState.update(STORAGE_KEY2, toSave);
        this._onToolsChanged.fire();
      }
      // ============================================
      // 工具注册和管理
      // ============================================
      /**
       * 注册新工具
       */
      async registerTool(tool, source = "user") {
        var _a;
        const validation = this.validateToolDefinition(tool);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        if (this.tools.has(tool.id)) {
          const existing = this.tools.get(tool.id);
          if (existing.source === "builtin") {
            return { success: false, error: `Cannot override builtin tool: ${tool.id}` };
          }
        }
        const now = Date.now();
        tool.metadata = {
          ...tool.metadata,
          status: "active",
          createdAt: ((_a = tool.metadata) == null ? void 0 : _a.createdAt) || now,
          updatedAt: now
        };
        this.tools.set(tool.id, {
          tool,
          source,
          enabled: true
        });
        await this.saveTools();
        console.log(`[MCPRegistry] Registered tool: ${tool.id}`);
        return { success: true };
      }
      /**
       * 更新工具
       */
      async updateTool(tool) {
        const existing = this.tools.get(tool.id);
        if (!existing) {
          return { success: false, error: `Tool not found: ${tool.id}` };
        }
        if (existing.source === "builtin") {
          return { success: false, error: `Cannot modify builtin tool: ${tool.id}` };
        }
        const validation = this.validateToolDefinition(tool);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        tool.metadata = {
          ...existing.tool.metadata,
          ...tool.metadata,
          updatedAt: Date.now()
        };
        this.tools.set(tool.id, {
          ...existing,
          tool
        });
        await this.saveTools();
        console.log(`[MCPRegistry] Updated tool: ${tool.id}`);
        return { success: true };
      }
      /**
       * 删除工具
       */
      async deleteTool(toolId) {
        const existing = this.tools.get(toolId);
        if (!existing) {
          return { success: false, error: `Tool not found: ${toolId}` };
        }
        if (existing.source === "builtin") {
          return { success: false, error: `Cannot delete builtin tool: ${toolId}` };
        }
        this.tools.delete(toolId);
        await this.saveTools();
        console.log(`[MCPRegistry] Deleted tool: ${toolId}`);
        return { success: true };
      }
      /**
       * 启用/禁用工具
       */
      async toggleTool(toolId, enabled) {
        const existing = this.tools.get(toolId);
        if (!existing) {
          return { success: false, error: `Tool not found: ${toolId}` };
        }
        existing.enabled = enabled;
        await this.saveTools();
        console.log(`[MCPRegistry] Tool ${toolId} ${enabled ? "enabled" : "disabled"}`);
        return { success: true };
      }
      /**
       * 更新工具状态
       */
      async updateToolStatus(toolId, status) {
        const existing = this.tools.get(toolId);
        if (existing) {
          existing.tool.metadata.status = status;
          await this.saveTools();
        }
      }
      /**
       * 更新工具使用统计
       */
      async updateToolStats(toolId, executionTime, success) {
        const existing = this.tools.get(toolId);
        if (existing) {
          const meta = existing.tool.metadata;
          meta.lastUsedAt = Date.now();
          meta.usageCount = (meta.usageCount || 0) + 1;
          const prevAvg = meta.averageExecutionTime || 0;
          const prevCount = meta.usageCount - 1;
          meta.averageExecutionTime = (prevAvg * prevCount + executionTime) / meta.usageCount;
          const prevSuccessRate = meta.successRate || 1;
          meta.successRate = (prevSuccessRate * prevCount + (success ? 1 : 0)) / meta.usageCount;
          await this.saveTools();
        }
      }
      // ============================================
      // 工具查询
      // ============================================
      /**
       * 获取所有工具
       */
      getAllTools() {
        return Array.from(this.tools.values());
      }
      /**
       * 获取启用的工具
       */
      getEnabledTools() {
        return Array.from(this.tools.values()).filter((r) => r.enabled);
      }
      /**
       * 根据ID获取工具
       */
      getTool(toolId) {
        return this.tools.get(toolId);
      }
      /**
       * 根据类别获取工具
       */
      getToolsByCategory(category) {
        return Array.from(this.tools.values()).filter(
          (r) => r.tool.category === category && r.enabled
        );
      }
      /**
       * 搜索工具
       */
      searchTools(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.tools.values()).filter((r) => {
          var _a;
          const tool = r.tool;
          return tool.name.toLowerCase().includes(lowerQuery) || tool.description.toLowerCase().includes(lowerQuery) || ((_a = tool.tags) == null ? void 0 : _a.some((t2) => t2.toLowerCase().includes(lowerQuery))) || tool.category.toLowerCase().includes(lowerQuery);
        });
      }
      /**
       * 获取适合Agent使用的工具列表
       * 返回启用且允许Agent调用的工具，按优先级排序
       */
      getAgentTools() {
        return Array.from(this.tools.values()).filter((r) => {
          if (!r.enabled)
            return false;
          const security = r.tool.security;
          if (!(security == null ? void 0 : security.allowedCallers))
            return true;
          return security.allowedCallers.includes("agent");
        }).sort((a, b) => {
          var _a, _b;
          const priorityA = ((_a = a.tool.aiHints) == null ? void 0 : _a.priority) || 50;
          const priorityB = ((_b = b.tool.aiHints) == null ? void 0 : _b.priority) || 50;
          return priorityB - priorityA;
        }).map((r) => r.tool);
      }
      // ============================================
      // 导入导出
      // ============================================
      /**
       * 导出工具
       */
      exportTools(toolIds) {
        let toExport;
        if (toolIds && toolIds.length > 0) {
          toExport = toolIds.map((id) => this.tools.get(id)).filter((r) => r !== void 0 && r.source !== "builtin");
        } else {
          toExport = Array.from(this.tools.values()).filter((r) => r.source !== "builtin");
        }
        return JSON.stringify(toExport.map((r) => r.tool), null, 2);
      }
      /**
       * 导入工具
       */
      async importTools(data) {
        const errors = [];
        let imported = 0;
        try {
          const tools = JSON.parse(data);
          if (!Array.isArray(tools)) {
            return { success: false, imported: 0, errors: ["Invalid format: expected array"] };
          }
          for (const tool of tools) {
            const result = await this.registerTool(tool, "import");
            if (result.success) {
              imported++;
            } else {
              errors.push(`${tool.id || "unknown"}: ${result.error}`);
            }
          }
          return { success: errors.length === 0, imported, errors };
        } catch (e) {
          return {
            success: false,
            imported: 0,
            errors: [`Parse error: ${e instanceof Error ? e.message : "Unknown error"}`]
          };
        }
      }
      // ============================================
      // 验证
      // ============================================
      /**
       * 验证工具定义
       */
      validateToolDefinition(tool) {
        if (!tool.id || typeof tool.id !== "string") {
          return { valid: false, error: "Tool ID is required" };
        }
        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(tool.id)) {
          return { valid: false, error: "Tool ID must start with letter and contain only alphanumeric, underscore, or hyphen" };
        }
        if (!tool.name || typeof tool.name !== "string") {
          return { valid: false, error: "Tool name is required" };
        }
        if (!tool.description || typeof tool.description !== "string") {
          return { valid: false, error: "Tool description is required" };
        }
        if (!tool.version || typeof tool.version !== "string") {
          return { valid: false, error: "Tool version is required" };
        }
        if (!tool.execution || !tool.execution.type) {
          return { valid: false, error: "Execution configuration is required" };
        }
        const execType = tool.execution.type;
        if (execType === "http" && !tool.execution.http) {
          return { valid: false, error: "HTTP configuration is required for http execution type" };
        }
        if (execType === "command" && !tool.execution.command) {
          return { valid: false, error: "Command configuration is required for command execution type" };
        }
        if (execType === "script" && !tool.execution.script) {
          return { valid: false, error: "Script configuration is required for script execution type" };
        }
        if (execType === "function" && !tool.execution.builtinFunction) {
          return { valid: false, error: "Builtin function name is required for function execution type" };
        }
        if (!Array.isArray(tool.parameters)) {
          return { valid: false, error: "Parameters must be an array" };
        }
        for (const param of tool.parameters) {
          if (!param.name || !param.type || !param.description) {
            return { valid: false, error: `Invalid parameter definition: ${param.name || "unnamed"}` };
          }
        }
        if (!tool.returns || !tool.returns.type || !tool.returns.description) {
          return { valid: false, error: "Returns definition is required" };
        }
        return { valid: true };
      }
      /**
       * 清理所有用户工具
       */
      async clearUserTools() {
        const builtinIds = Array.from(this.tools.entries()).filter(([_, r]) => r.source === "builtin").map(([id, _]) => id);
        this.tools.clear();
        const builtinTools = getBuiltinTools();
        for (const tool of builtinTools) {
          this.tools.set(tool.id, {
            tool,
            source: "builtin",
            enabled: true
          });
        }
        await this.saveTools();
        console.log("[MCPRegistry] Cleared all user tools");
      }
    };
    _MCPRegistry.instance = null;
    MCPRegistry = _MCPRegistry;
  }
});

// src/extension/mcp/MCPExecutor.ts
var vscode13, import_child_process, import_util, allBuiltinFunctions, execAsync, _MCPExecutor, MCPExecutor;
var init_MCPExecutor = __esm({
  "src/extension/mcp/MCPExecutor.ts"() {
    "use strict";
    vscode13 = __toESM(require("vscode"));
    import_child_process = require("child_process");
    import_util = require("util");
    init_builtins();
    init_additionalBuiltins();
    allBuiltinFunctions = { ...builtinFunctions, ...additionalBuiltinFunctions };
    execAsync = (0, import_util.promisify)(import_child_process.exec);
    _MCPExecutor = class _MCPExecutor {
      constructor(context, registry) {
        this.executionHistory = [];
        this.maxHistorySize = 100;
        // 速率限制追踪
        this.rateLimitMap = /* @__PURE__ */ new Map();
        // 事件
        this._onExecutionStart = new vscode13.EventEmitter();
        this._onExecutionComplete = new vscode13.EventEmitter();
        this.onExecutionStart = this._onExecutionStart.event;
        this.onExecutionComplete = this._onExecutionComplete.event;
        this.context = context;
        this.registry = registry;
      }
      static getInstance(context, registry) {
        if (!_MCPExecutor.instance) {
          _MCPExecutor.instance = new _MCPExecutor(context, registry);
        }
        return _MCPExecutor.instance;
      }
      /**
       * 执行工具
       */
      async execute(params) {
        var _a, _b, _c;
        const startTime = Date.now();
        const requestId = params.requestId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const registration = this.registry.getTool(params.toolId);
        if (!registration) {
          return this.createErrorResult(params.toolId, requestId, "TOOL_NOT_FOUND", `Tool not found: ${params.toolId}`, startTime);
        }
        if (!registration.enabled) {
          return this.createErrorResult(params.toolId, requestId, "TOOL_DISABLED", `Tool is disabled: ${params.toolId}`, startTime);
        }
        const tool = registration.tool;
        if (((_a = tool.security) == null ? void 0 : _a.allowedCallers) && !tool.security.allowedCallers.includes(params.caller)) {
          return this.createErrorResult(params.toolId, requestId, "UNAUTHORIZED", `Caller '${params.caller}' is not allowed to use this tool`, startTime);
        }
        if ((_b = tool.security) == null ? void 0 : _b.rateLimit) {
          if (!this.checkRateLimit(params.toolId, tool.security.rateLimit)) {
            return this.createErrorResult(params.toolId, requestId, "RATE_LIMITED", "Rate limit exceeded", startTime);
          }
        }
        const validation = this.validateParams(tool, params.arguments);
        if (!validation.valid) {
          return this.createErrorResult(params.toolId, requestId, "INVALID_PARAMS", validation.error, startTime);
        }
        if (((_c = tool.security) == null ? void 0 : _c.requireConfirmation) && params.caller === "agent") {
          const confirmed = await this.requestConfirmation(tool, params.arguments);
          if (!confirmed) {
            return this.createErrorResult(params.toolId, requestId, "USER_CANCELLED", "User cancelled execution", startTime);
          }
        }
        this._onExecutionStart.fire({ toolId: params.toolId, params: params.arguments });
        let result;
        try {
          const data = await this.executeInternal(tool, params);
          result = {
            success: true,
            toolId: params.toolId,
            requestId,
            data,
            stats: {
              startTime,
              endTime: Date.now(),
              duration: Date.now() - startTime
            }
          };
        } catch (error) {
          result = this.createErrorResult(
            params.toolId,
            requestId,
            "EXECUTION_ERROR",
            error instanceof Error ? error.message : "Unknown error",
            startTime
          );
        }
        await this.registry.updateToolStats(params.toolId, result.stats.duration, result.success);
        this.addToHistory({
          id: requestId,
          toolId: params.toolId,
          toolName: tool.name,
          params: params.arguments,
          result,
          caller: params.caller,
          timestamp: startTime
        });
        this._onExecutionComplete.fire(this.executionHistory[this.executionHistory.length - 1]);
        return result;
      }
      /**
       * 内部执行逻辑
       */
      async executeInternal(tool, params) {
        var _a, _b;
        const execution = tool.execution;
        const config = this.registry.getConfig();
        const workspaceRoot = (_b = (_a = vscode13.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath;
        switch (execution.type) {
          case "function":
            return this.executeBuiltinFunction(execution.builtinFunction, params.arguments, {
              workspaceRoot,
              extensionContext: this.context
            });
          case "http":
            return this.executeHttp(execution.http, params.arguments, config);
          case "command":
            return this.executeCommand(execution.command, params.arguments, config, workspaceRoot);
          case "script":
            return this.executeScript(execution.script, params.arguments);
          default:
            throw new Error(`Unsupported execution type: ${execution.type}`);
        }
      }
      /**
       * 执行内置函数
       */
      async executeBuiltinFunction(functionName, args, context) {
        const fn = allBuiltinFunctions[functionName];
        if (!fn) {
          throw new Error(`Builtin function not found: ${functionName}`);
        }
        return fn(args, context);
      }
      /**
       * 执行HTTP请求
       */
      async executeHttp(httpConfig, args, mcpConfig) {
        var _a, _b;
        let url = this.replaceVariables(httpConfig.url, args, mcpConfig.envVariables);
        if (httpConfig.queryTemplate) {
          const queryParams = new URLSearchParams();
          for (const [key, template] of Object.entries(httpConfig.queryTemplate)) {
            queryParams.set(key, this.replaceVariables(template, args, mcpConfig.envVariables));
          }
          url += (url.includes("?") ? "&" : "?") + queryParams.toString();
        }
        const headers = { ...httpConfig.headers };
        if (httpConfig.auth) {
          const token = httpConfig.auth.tokenEnvVar ? mcpConfig.envVariables[httpConfig.auth.tokenEnvVar] : void 0;
          switch (httpConfig.auth.type) {
            case "bearer":
              if (token)
                headers["Authorization"] = `Bearer ${token}`;
              break;
            case "basic":
              if (token)
                headers["Authorization"] = `Basic ${token}`;
              break;
            case "apiKey":
              if (token && httpConfig.auth.headerName) {
                headers[httpConfig.auth.headerName] = token;
              }
              break;
          }
        }
        let body;
        if (httpConfig.bodyTemplate) {
          body = this.replaceVariables(httpConfig.bodyTemplate, args, mcpConfig.envVariables);
          if (!headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
          }
        }
        const controller = new AbortController();
        const timeout = httpConfig.timeout || mcpConfig.defaultTimeout;
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, {
            method: httpConfig.method,
            headers,
            body,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const responseText = await response.text();
          let responseData;
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = responseText;
          }
          if ((_a = httpConfig.responseMapping) == null ? void 0 : _a.successCondition) {
            const isSuccess = this.evaluateCondition(httpConfig.responseMapping.successCondition, responseData);
            if (!isSuccess) {
              const errorPath = httpConfig.responseMapping.errorPath;
              const errorMessage = errorPath ? this.getNestedValue(responseData, errorPath) : "Request failed";
              throw new Error(errorMessage);
            }
          }
          if ((_b = httpConfig.responseMapping) == null ? void 0 : _b.resultPath) {
            return this.getNestedValue(responseData, httpConfig.responseMapping.resultPath);
          }
          return responseData;
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            throw new Error("Request timeout");
          }
          throw error;
        }
      }
      /**
       * 执行命令行
       */
      async executeCommand(commandConfig, args, mcpConfig, workspaceRoot) {
        var _a, _b;
        let command = this.replaceVariables(commandConfig.command, args, mcpConfig.envVariables);
        const dangerousPatterns = [
          ...mcpConfig.dangerousCommands,
          ...commandConfig.dangerousPatterns || []
        ];
        for (const pattern of dangerousPatterns) {
          if (command.toLowerCase().includes(pattern.toLowerCase())) {
            throw new Error(`Dangerous command detected: ${pattern}`);
          }
        }
        const cwd = commandConfig.cwd ? this.replaceVariables(commandConfig.cwd, args, mcpConfig.envVariables) : workspaceRoot;
        const env3 = {
          ...process.env,
          ...commandConfig.env,
          ...mcpConfig.envVariables
        };
        const timeout = commandConfig.timeout || mcpConfig.defaultTimeout;
        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd,
            env: env3,
            timeout,
            maxBuffer: 10 * 1024 * 1024,
            // 10MB
            shell: commandConfig.shell || (process.platform === "win32" ? "cmd" : "bash")
          });
          return {
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            exitCode: 0
          };
        } catch (error) {
          return {
            stdout: ((_a = error.stdout) == null ? void 0 : _a.toString()) || "",
            stderr: ((_b = error.stderr) == null ? void 0 : _b.toString()) || error.message,
            exitCode: error.code || 1
          };
        }
      }
      /**
       * 执行脚本
       */
      async executeScript(scriptConfig, args) {
        switch (scriptConfig.language) {
          case "javascript":
          case "typescript":
            return this.executeJavaScript(scriptConfig.code, args, scriptConfig.entryFunction);
          default:
            throw new Error(`Unsupported script language: ${scriptConfig.language}`);
        }
      }
      /**
       * 执行JavaScript代码
       */
      async executeJavaScript(code, args, entryFunction) {
        const sandbox = {
          args,
          console: {
            log: (...msgs) => console.log("[MCP Script]", ...msgs),
            error: (...msgs) => console.error("[MCP Script]", ...msgs)
          },
          fetch,
          JSON,
          Math,
          Date,
          Array,
          Object,
          String,
          Number,
          Boolean,
          Promise,
          setTimeout,
          clearTimeout
        };
        const wrappedCode = `
      (async function(sandbox) {
        const { args, console, fetch, JSON, Math, Date, Array, Object, String, Number, Boolean, Promise, setTimeout, clearTimeout } = sandbox;
        ${code}
        ${entryFunction ? `return await ${entryFunction}(args);` : ""}
      })(sandbox)
    `;
        const AsyncFunction = Object.getPrototypeOf(async function() {
        }).constructor;
        const fn = new AsyncFunction("sandbox", `return ${wrappedCode}`);
        return fn(sandbox);
      }
      // ============================================
      // 辅助方法
      // ============================================
      /**
       * 替换变量
       */
      replaceVariables(template, args, envVars) {
        let result = template;
        for (const [key, value] of Object.entries(args)) {
          const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          result = result.replace(placeholder, String(value));
        }
        for (const [key, value] of Object.entries(envVars)) {
          const placeholder = new RegExp(`\\$\\{${key}\\}`, "g");
          result = result.replace(placeholder, value);
        }
        return result;
      }
      /**
       * 获取嵌套属性值
       */
      getNestedValue(obj, path11) {
        return path11.split(".").reduce((current, key) => current == null ? void 0 : current[key], obj);
      }
      /**
       * 评估条件表达式
       */
      evaluateCondition(condition, data) {
        try {
          const fn = new Function("data", `return ${condition}`);
          return fn(data);
        } catch {
          return false;
        }
      }
      /**
       * 验证参数
       */
      validateParams(tool, args) {
        for (const param of tool.parameters) {
          const value = args[param.name];
          if (param.required && (value === void 0 || value === null)) {
            return { valid: false, error: `Missing required parameter: ${param.name}` };
          }
          if (value === void 0 || value === null)
            continue;
          const actualType = Array.isArray(value) ? "array" : typeof value;
          if (param.type !== "json" && actualType !== param.type && !(param.type === "file" && actualType === "string") && !(param.type === "code" && actualType === "string")) {
            return { valid: false, error: `Invalid type for ${param.name}: expected ${param.type}, got ${actualType}` };
          }
          if (param.validation) {
            const v = param.validation;
            if (v.enum && !v.enum.includes(value)) {
              return { valid: false, error: `Invalid value for ${param.name}: must be one of ${v.enum.join(", ")}` };
            }
            if (v.pattern && !new RegExp(v.pattern).test(value)) {
              return { valid: false, error: `Invalid format for ${param.name}` };
            }
            if (typeof value === "number") {
              if (v.min !== void 0 && value < v.min) {
                return { valid: false, error: `${param.name} must be at least ${v.min}` };
              }
              if (v.max !== void 0 && value > v.max) {
                return { valid: false, error: `${param.name} must be at most ${v.max}` };
              }
            }
            if (typeof value === "string") {
              if (v.min !== void 0 && value.length < v.min) {
                return { valid: false, error: `${param.name} must be at least ${v.min} characters` };
              }
              if (v.max !== void 0 && value.length > v.max) {
                return { valid: false, error: `${param.name} must be at most ${v.max} characters` };
              }
            }
          }
        }
        return { valid: true };
      }
      /**
       * 检查速率限制
       */
      checkRateLimit(toolId, limit) {
        const now = Date.now();
        const windowStart = now - 6e4;
        let timestamps = this.rateLimitMap.get(toolId) || [];
        timestamps = timestamps.filter((t2) => t2 > windowStart);
        if (timestamps.length >= limit) {
          return false;
        }
        timestamps.push(now);
        this.rateLimitMap.set(toolId, timestamps);
        return true;
      }
      /**
       * 请求用户确认
       */
      async requestConfirmation(tool, args) {
        const argsStr = Object.entries(args).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join("\n");
        const result = await vscode13.window.showWarningMessage(
          `MCP\u5DE5\u5177 "${tool.name}" \u8BF7\u6C42\u6267\u884C:

${argsStr}

\u662F\u5426\u5141\u8BB8?`,
          { modal: true },
          "\u5141\u8BB8",
          "\u62D2\u7EDD"
        );
        return result === "\u5141\u8BB8";
      }
      /**
       * 创建错误结果
       */
      createErrorResult(toolId, requestId, code, message, startTime) {
        return {
          success: false,
          toolId,
          requestId,
          error: { code, message },
          stats: {
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime
          }
        };
      }
      /**
       * 添加到历史记录
       */
      addToHistory(entry) {
        this.executionHistory.push(entry);
        if (this.executionHistory.length > this.maxHistorySize) {
          this.executionHistory.shift();
        }
      }
      /**
       * 获取执行历史
       */
      getExecutionHistory(limit) {
        const history = [...this.executionHistory].reverse();
        return limit ? history.slice(0, limit) : history;
      }
      /**
       * 清除执行历史
       */
      clearHistory() {
        this.executionHistory = [];
      }
    };
    _MCPExecutor.instance = null;
    MCPExecutor = _MCPExecutor;
  }
});

// src/extension/mcp/MCPAgent.ts
var vscode14, _MCPAgent, MCPAgent;
var init_MCPAgent = __esm({
  "src/extension/mcp/MCPAgent.ts"() {
    "use strict";
    vscode14 = __toESM(require("vscode"));
    init_ChatService();
    _MCPAgent = class _MCPAgent {
      constructor(context, registry, executor, configManager) {
        this.chatService = null;
        this.status = "idle";
        this.currentSteps = [];
        this.abortController = null;
        // 事件
        this._onStatusChange = new vscode14.EventEmitter();
        this._onStepUpdate = new vscode14.EventEmitter();
        this._onProgress = new vscode14.EventEmitter();
        this.onStatusChange = this._onStatusChange.event;
        this.onStepUpdate = this._onStepUpdate.event;
        this.onProgress = this._onProgress.event;
        this.context = context;
        this.registry = registry;
        this.executor = executor;
        this.configManager = configManager;
      }
      static getInstance(context, registry, executor, configManager) {
        if (!_MCPAgent.instance) {
          _MCPAgent.instance = new _MCPAgent(context, registry, executor, configManager);
        }
        return _MCPAgent.instance;
      }
      /**
       * 执行Agent任务
       */
      async executeTask(request) {
        if (this.status !== "idle") {
          return {
            success: false,
            task: request.task,
            executions: [],
            answer: "Agent is busy with another task"
          };
        }
        this.abortController = new AbortController();
        this.currentSteps = [];
        try {
          await this.ensureChatService();
          if (!this.chatService) {
            return {
              success: false,
              task: request.task,
              executions: [],
              answer: "\u8BF7\u5148\u914D\u7F6EAPI Key"
            };
          }
          this.setStatus("planning");
          this._onProgress.fire({ message: "\u6B63\u5728\u5206\u6790\u4EFB\u52A1...", progress: 10 });
          const plan = await this.planTask(request);
          if (!plan.length) {
            this.setStatus("idle");
            return {
              success: true,
              task: request.task,
              executions: [],
              answer: "\u65E0\u9700\u4F7F\u7528\u5DE5\u5177\uFF0C\u6211\u53EF\u4EE5\u76F4\u63A5\u56DE\u7B54\u8FD9\u4E2A\u95EE\u9898\u3002"
            };
          }
          this.currentSteps = plan;
          this._onProgress.fire({ message: `\u5DF2\u89C4\u5212 ${plan.length} \u4E2A\u6B65\u9AA4`, progress: 30 });
          this.setStatus("executing");
          const executions = [];
          for (let i = 0; i < plan.length; i++) {
            if (this.abortController.signal.aborted) {
              break;
            }
            const step = plan[i];
            step.status = "running";
            this._onStepUpdate.fire(step);
            this._onProgress.fire({
              message: `\u6B63\u5728\u6267\u884C: ${step.toolName}`,
              progress: 30 + i / plan.length * 50
            });
            try {
              const result = await this.executor.execute({
                toolId: step.toolId,
                arguments: step.params,
                caller: "agent",
                context: request.context
              });
              step.result = result;
              step.status = result.success ? "success" : "failed";
              executions.push({ toolId: step.toolId, result });
              if (!result.success && this.isCriticalStep(step, plan)) {
                console.log(`[MCPAgent] Critical step failed: ${step.toolId}`);
                break;
              }
            } catch (error) {
              step.status = "failed";
              step.result = {
                success: false,
                toolId: step.toolId,
                error: {
                  code: "EXECUTION_ERROR",
                  message: error instanceof Error ? error.message : "Unknown error"
                },
                stats: {
                  startTime: Date.now(),
                  endTime: Date.now(),
                  duration: 0
                }
              };
              executions.push({ toolId: step.toolId, result: step.result });
            }
            this._onStepUpdate.fire(step);
          }
          this._onProgress.fire({ message: "\u6B63\u5728\u751F\u6210\u603B\u7ED3...", progress: 90 });
          const summary = await this.generateSummary(request.task, executions);
          this.setStatus("completed");
          this._onProgress.fire({ message: "\u5B8C\u6210", progress: 100 });
          return {
            success: executions.every((e) => e.result.success),
            task: request.task,
            plan: plan.map((s) => ({
              step: s.step,
              toolId: s.toolId,
              description: s.description,
              params: s.params
            })),
            executions,
            answer: summary.answer,
            summary: summary.summary
          };
        } catch (error) {
          this.setStatus("failed");
          return {
            success: false,
            task: request.task,
            executions: [],
            answer: `\u6267\u884C\u5931\u8D25: ${error instanceof Error ? error.message : "Unknown error"}`
          };
        } finally {
          this.abortController = null;
        }
      }
      /**
       * 取消当前任务
       */
      cancelTask() {
        if (this.abortController) {
          this.abortController.abort();
          this.setStatus("idle");
        }
      }
      /**
       * 获取当前状态
       */
      getStatus() {
        return this.status;
      }
      /**
       * 获取当前执行步骤
       */
      getCurrentSteps() {
        return [...this.currentSteps];
      }
      /**
       * 规划任务
       */
      async planTask(request) {
        const tools = this.registry.getAgentTools();
        let availableTools = tools;
        if (request.constraints) {
          if (request.constraints.allowedCategories) {
            availableTools = availableTools.filter(
              (t2) => request.constraints.allowedCategories.includes(t2.category)
            );
          }
          if (request.constraints.excludeTools) {
            availableTools = availableTools.filter(
              (t2) => !request.constraints.excludeTools.includes(t2.id)
            );
          }
        }
        if (availableTools.length === 0) {
          return [];
        }
        const toolDescriptions = availableTools.map((t2) => this.formatToolForAI(t2)).join("\n\n");
        const contextInfo = this.buildContextInfo(request.context);
        const planPrompt = this.buildPlanningPrompt(request.task, toolDescriptions, contextInfo);
        try {
          const response = await this.chatService.sendMessageSync([
            {
              id: "plan",
              role: "user",
              content: planPrompt,
              timestamp: Date.now()
            }
          ]);
          return this.parsePlanResponse(response, availableTools);
        } catch (error) {
          console.error("[MCPAgent] Planning failed:", error);
          return [];
        }
      }
      /**
       * 格式化工具描述给AI
       */
      formatToolForAI(tool) {
        var _a;
        const params = tool.parameters.map(
          (p) => `  - ${p.name} (${p.type}${p.required ? ", required" : ""}): ${p.description}`
        ).join("\n");
        return `### ${tool.id}
Name: ${tool.name}
Description: ${tool.description}
Category: ${tool.category}
${((_a = tool.aiHints) == null ? void 0 : _a.whenToUse) ? `When to use: ${tool.aiHints.whenToUse}` : ""}
Parameters:
${params || "  (none)"}
Returns: ${tool.returns.description}`;
      }
      /**
       * 构建上下文信息
       */
      buildContextInfo(context) {
        var _a;
        if (!context)
          return "";
        const parts = [];
        if (context.workspaceRoot) {
          parts.push(`Workspace: ${context.workspaceRoot}`);
        }
        if (context.activeFile) {
          parts.push(`Active file: ${context.activeFile}`);
        }
        if (context.selectedCode) {
          parts.push(`Selected code:
\`\`\`
${context.selectedCode.slice(0, 500)}
\`\`\``);
        }
        if ((_a = context.recentTools) == null ? void 0 : _a.length) {
          parts.push(`Recently used tools: ${context.recentTools.join(", ")}`);
        }
        return parts.length ? `

Context:
${parts.join("\n")}` : "";
      }
      /**
       * 构建规划提示
       */
      buildPlanningPrompt(task, tools, context) {
        return `You are an AI assistant with access to various tools. Your task is to analyze the user's request and create an execution plan.

## Available Tools:
${tools}

## User Task:
${task}
${context}

## Instructions:
1. Analyze what the user wants to accomplish
2. Determine which tools (if any) are needed
3. Create a step-by-step execution plan
4. For each step, specify the tool and its parameters

## Response Format:
If no tools are needed, respond with:
NO_TOOLS_NEEDED

If tools are needed, respond with a JSON array:
\`\`\`json
[
  {
    "step": 1,
    "toolId": "tool_id",
    "description": "What this step does",
    "params": {
      "param1": "value1"
    }
  }
]
\`\`\`

Important:
- Only use tools from the available list
- Provide complete parameter values based on the task context
- Keep the plan concise (usually 1-3 steps)
- If the task is a simple question, NO_TOOLS_NEEDED is appropriate`;
      }
      /**
       * 解析规划响应
       */
      parsePlanResponse(response, tools) {
        if (response.includes("NO_TOOLS_NEEDED")) {
          return [];
        }
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
              return this.validateAndEnrichSteps(parsed, tools);
            }
          } catch {
            console.error("[MCPAgent] Failed to parse plan response");
          }
          return [];
        }
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (!Array.isArray(parsed)) {
            return [];
          }
          return this.validateAndEnrichSteps(parsed, tools);
        } catch (error) {
          console.error("[MCPAgent] Failed to parse plan JSON:", error);
          return [];
        }
      }
      /**
       * 验证和丰富步骤
       */
      validateAndEnrichSteps(steps, tools) {
        const toolMap = new Map(tools.map((t2) => [t2.id, t2]));
        return steps.filter((s) => s.toolId && toolMap.has(s.toolId)).map((s, index) => ({
          step: s.step || index + 1,
          toolId: s.toolId,
          toolName: toolMap.get(s.toolId).name,
          description: s.description || `Execute ${toolMap.get(s.toolId).name}`,
          params: s.params || {},
          status: "pending"
        }));
      }
      /**
       * 判断是否是关键步骤
       */
      isCriticalStep(step, allSteps) {
        if (step.step === 1)
          return true;
        return step.step < allSteps.length;
      }
      /**
       * 生成执行总结
       */
      async generateSummary(task, executions) {
        if (executions.length === 0) {
          return {
            answer: "\u4EFB\u52A1\u5B8C\u6210\uFF0C\u4F46\u6CA1\u6709\u6267\u884C\u4EFB\u4F55\u5DE5\u5177\u3002",
            summary: ""
          };
        }
        const executionSummary = executions.map((e) => {
          var _a;
          const tool = this.registry.getTool(e.toolId);
          const toolName = (tool == null ? void 0 : tool.tool.name) || e.toolId;
          if (e.result.success) {
            const dataPreview = JSON.stringify(e.result.data).slice(0, 500);
            return `\u2713 ${toolName}: ${dataPreview}${dataPreview.length >= 500 ? "..." : ""}`;
          } else {
            return `\u2717 ${toolName}: ${((_a = e.result.error) == null ? void 0 : _a.message) || "Failed"}`;
          }
        }).join("\n");
        const summaryPrompt = `Based on the following tool execution results, provide a concise answer to the user's task.

## Original Task:
${task}

## Execution Results:
${executionSummary}

## Instructions:
1. Summarize what was accomplished
2. Provide the relevant information the user asked for
3. Note any failures if they affected the result
4. Keep the response concise and helpful

Response in the user's language (Chinese if the task is in Chinese).`;
        try {
          const response = await this.chatService.sendMessageSync([
            {
              id: "summary",
              role: "user",
              content: summaryPrompt,
              timestamp: Date.now()
            }
          ]);
          return {
            answer: response,
            summary: executionSummary
          };
        } catch (error) {
          const successCount = executions.filter((e) => e.result.success).length;
          return {
            answer: `\u5DF2\u6267\u884C ${executions.length} \u4E2A\u5DE5\u5177\uFF0C${successCount} \u4E2A\u6210\u529F\u3002`,
            summary: executionSummary
          };
        }
      }
      /**
       * 确保ChatService可用
       */
      async ensureChatService() {
        if (this.chatService)
          return;
        const config = await this.configManager.getFullModelConfig();
        if (config.apiKey) {
          this.chatService = new ChatService(config);
        }
      }
      /**
       * 设置状态
       */
      setStatus(status) {
        this.status = status;
        this._onStatusChange.fire(status);
      }
      /**
       * 直接选择工具（不执行）
       * 用于用户查看AI会选择哪些工具
       */
      async selectTools(task) {
        await this.ensureChatService();
        if (!this.chatService) {
          return [];
        }
        const tools = this.registry.getAgentTools();
        const toolDescriptions = tools.map((t2) => this.formatToolForAI(t2)).join("\n\n");
        const prompt = `Given the following task and available tools, select the most appropriate tools and explain why.

## Task:
${task}

## Available Tools:
${toolDescriptions}

## Instructions:
Select 1-3 tools that would be most helpful for this task.
For each selected tool, provide:
1. Tool ID
2. Confidence score (0-1)
3. Reason for selection
4. Suggested parameter values

Response format:
\`\`\`json
[
  {
    "toolId": "tool_id",
    "confidence": 0.9,
    "reason": "Why this tool is appropriate",
    "suggestedParams": { "param1": "value1" }
  }
]
\`\`\``;
        try {
          const response = await this.chatService.sendMessageSync([
            {
              id: "select",
              role: "user",
              content: prompt,
              timestamp: Date.now()
            }
          ]);
          const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
          }
          return [];
        } catch {
          return [];
        }
      }
    };
    _MCPAgent.instance = null;
    MCPAgent = _MCPAgent;
  }
});

// src/extension/mcp/AutonomousAgent.ts
var vscode15, _AutonomousAgent, AutonomousAgent;
var init_AutonomousAgent = __esm({
  "src/extension/mcp/AutonomousAgent.ts"() {
    "use strict";
    vscode15 = __toESM(require("vscode"));
    init_ChatService();
    _AutonomousAgent = class _AutonomousAgent {
      constructor(context, registry, executor, configManager) {
        this.chatService = null;
        this.status = "idle";
        this.abortController = null;
        // 运行时状态
        this.currentTask = "";
        this.iterations = [];
        this.accumulatedContext = "";
        // 积累的上下文
        this.toolResultsMap = /* @__PURE__ */ new Map();
        // 工具结果缓存
        // 事件
        this._onStatusChange = new vscode15.EventEmitter();
        this._onIteration = new vscode15.EventEmitter();
        this._onThought = new vscode15.EventEmitter();
        this._onToolExecution = new vscode15.EventEmitter();
        this._onProgress = new vscode15.EventEmitter();
        this.onStatusChange = this._onStatusChange.event;
        this.onIteration = this._onIteration.event;
        this.onThought = this._onThought.event;
        this.onToolExecution = this._onToolExecution.event;
        this.onProgress = this._onProgress.event;
        this.context = context;
        this.registry = registry;
        this.executor = executor;
        this.configManager = configManager;
      }
      static getInstance(context, registry, executor, configManager) {
        if (!_AutonomousAgent.instance) {
          _AutonomousAgent.instance = new _AutonomousAgent(context, registry, executor, configManager);
        }
        return _AutonomousAgent.instance;
      }
      /**
       * 执行自主任务
       */
      async execute(request) {
        var _a, _b, _c, _d;
        if (this.status !== "idle") {
          throw new Error("Agent is busy with another task");
        }
        const startTime = Date.now();
        const config = {
          maxIterations: ((_a = request.config) == null ? void 0 : _a.maxIterations) ?? 10,
          maxParallelCalls: ((_b = request.config) == null ? void 0 : _b.maxParallelCalls) ?? 5,
          timeout: ((_c = request.config) == null ? void 0 : _c.timeout) ?? 12e4,
          autoApprove: ((_d = request.config) == null ? void 0 : _d.autoApprove) ?? false
        };
        this.abortController = new AbortController();
        this.currentTask = request.task;
        this.iterations = [];
        this.accumulatedContext = "";
        this.toolResultsMap.clear();
        const toolsUsed = /* @__PURE__ */ new Set();
        let totalCalls = 0;
        let successfulCalls = 0;
        let failedCalls = 0;
        try {
          await this.ensureChatService();
          if (!this.chatService) {
            return this.createFailedResult(request.task, "\u8BF7\u5148\u914D\u7F6EAPI Key", startTime);
          }
          this._onProgress.fire({ message: "\u5F00\u59CB\u5206\u6790\u4EFB\u52A1...", progress: 5 });
          for (let iteration = 1; iteration <= config.maxIterations; iteration++) {
            if (this.abortController.signal.aborted) {
              this.setStatus("cancelled");
              break;
            }
            if (Date.now() - startTime > config.timeout) {
              this._onProgress.fire({ message: "\u4EFB\u52A1\u8D85\u65F6", progress: 100 });
              break;
            }
            const iterationProgress = 5 + iteration / config.maxIterations * 85;
            this._onProgress.fire({
              message: `\u7B2C ${iteration} \u8F6E\u601D\u8003...`,
              progress: iterationProgress,
              detail: `\u5DF2\u6267\u884C ${totalCalls} \u6B21\u5DE5\u5177\u8C03\u7528`
            });
            this.setStatus("thinking");
            const thought = await this.think(request, iteration);
            this._onThought.fire(thought);
            if (thought.decision === "complete") {
              const finalAnswer2 = await this.generateFinalAnswer(request);
              this.setStatus("completed");
              return {
                success: true,
                task: request.task,
                iterations: this.iterations,
                finalAnswer: finalAnswer2,
                totalDuration: Date.now() - startTime,
                toolsUsed: Array.from(toolsUsed),
                stats: {
                  totalIterations: iteration,
                  totalToolCalls: totalCalls,
                  successfulCalls,
                  failedCalls
                }
              };
            }
            if (thought.decision === "need_clarification") {
              this.setStatus("completed");
              return {
                success: true,
                task: request.task,
                iterations: this.iterations,
                finalAnswer: thought.thought,
                totalDuration: Date.now() - startTime,
                toolsUsed: Array.from(toolsUsed),
                stats: {
                  totalIterations: iteration,
                  totalToolCalls: totalCalls,
                  successfulCalls,
                  failedCalls
                }
              };
            }
            if (thought.toolCalls.length > 0) {
              this.setStatus("executing");
              let executions;
              if (thought.parallelizable && thought.toolCalls.length > 1) {
                executions = await this.executeToolsInParallel(
                  thought.toolCalls,
                  config.maxParallelCalls,
                  request.context
                );
              } else {
                executions = await this.executeToolsSequentially(
                  thought.toolCalls,
                  request.context
                );
              }
              for (const exec2 of executions) {
                totalCalls++;
                toolsUsed.add(exec2.toolId);
                if (exec2.success) {
                  successfulCalls++;
                  this.toolResultsMap.set(exec2.callId, exec2.data);
                } else {
                  failedCalls++;
                }
              }
              this.setStatus("reflecting");
              const observation = await this.observe(thought, executions);
              const record = {
                iteration,
                thought,
                executions,
                observation,
                timestamp: Date.now()
              };
              this.iterations.push(record);
              this._onIteration.fire(record);
              this.accumulatedContext += `

--- Iteration ${iteration} ---
`;
              this.accumulatedContext += `Thought: ${thought.thought}
`;
              this.accumulatedContext += `Actions: ${thought.toolCalls.map((c) => c.toolId).join(", ")}
`;
              this.accumulatedContext += `Observation: ${observation}
`;
            }
          }
          this.setStatus("completed");
          const finalAnswer = await this.generateFinalAnswer(request);
          return {
            success: true,
            task: request.task,
            iterations: this.iterations,
            finalAnswer,
            totalDuration: Date.now() - startTime,
            toolsUsed: Array.from(toolsUsed),
            stats: {
              totalIterations: this.iterations.length,
              totalToolCalls: totalCalls,
              successfulCalls,
              failedCalls
            }
          };
        } catch (error) {
          this.setStatus("failed");
          return this.createFailedResult(
            request.task,
            error instanceof Error ? error.message : "Unknown error",
            startTime
          );
        } finally {
          this.abortController = null;
          this.setStatus("idle");
        }
      }
      /**
       * 思考阶段 - 决定下一步行动
       */
      async think(request, iteration) {
        const tools = this.registry.getAgentTools();
        const toolDescriptions = this.formatToolsForAI(tools);
        const prompt = this.buildThinkingPrompt(request, iteration, toolDescriptions);
        try {
          const response = await this.chatService.sendMessageSync([
            {
              id: `think_${iteration}`,
              role: "user",
              content: prompt,
              timestamp: Date.now()
            }
          ]);
          return this.parseThinkingResponse(response, iteration, tools);
        } catch (error) {
          console.error("[AutonomousAgent] Thinking failed:", error);
          return {
            iteration,
            thought: "Unable to process the task due to an error.",
            analysis: "Error occurred during thinking phase.",
            decision: "complete",
            toolCalls: [],
            parallelizable: false
          };
        }
      }
      /**
       * 构建思考提示词
       */
      buildThinkingPrompt(request, iteration, toolDescriptions) {
        var _a, _b, _c, _d;
        const contextParts = [];
        if ((_a = request.context) == null ? void 0 : _a.workspaceRoot) {
          contextParts.push(`Workspace: ${request.context.workspaceRoot}`);
        }
        if ((_b = request.context) == null ? void 0 : _b.activeFile) {
          contextParts.push(`Active file: ${request.context.activeFile}`);
        }
        if ((_c = request.context) == null ? void 0 : _c.selectedCode) {
          contextParts.push(`Selected code:
\`\`\`
${request.context.selectedCode.slice(0, 1e3)}
\`\`\``);
        }
        if ((_d = request.context) == null ? void 0 : _d.additionalContext) {
          contextParts.push(`Additional context: ${request.context.additionalContext}`);
        }
        const previousIterations = this.iterations.length > 0 ? this.formatPreviousIterations() : "None yet.";
        return `You are an autonomous AI agent that can use tools to complete tasks. You operate in a ReAct loop (Reasoning + Acting).

## Your Task
${request.task}

## Current Context
${contextParts.join("\n") || "No additional context."}

## Available Tools
${toolDescriptions}

## Previous Iterations
${previousIterations}

## Accumulated Results
${this.formatAccumulatedResults()}

## Current Iteration: ${iteration}

## Instructions
Analyze the current state and decide what to do next. You can:
1. Call one or more tools (they can run in parallel if independent)
2. Decide the task is complete
3. Ask for clarification if needed

Think step by step:
1. What has been accomplished so far?
2. What still needs to be done?
3. Which tools should be used next and why?
4. Can multiple tools be run in parallel?

## Response Format (JSON)
\`\`\`json
{
  "thought": "Your reasoning process...",
  "analysis": "Analysis of current state...",
  "decision": "continue" | "complete" | "need_clarification",
  "toolCalls": [
    {
      "id": "unique_call_id",
      "toolId": "tool_id",
      "params": { "param1": "value1" },
      "reason": "Why this tool is needed",
      "dependsOn": ["previous_call_id"] // optional, for sequential execution
    }
  ],
  "parallelizable": true | false
}
\`\`\`

If decision is "complete", toolCalls should be empty and thought should contain the final answer.
If decision is "need_clarification", thought should contain the clarifying question.

Important:
- You can call MULTIPLE tools at once if they are independent
- Use "dependsOn" if a tool needs results from another tool
- Set "parallelizable": true if tools can run simultaneously
- Be efficient - don't repeat the same tool calls
- If the task seems complete based on results, set decision to "complete"`;
      }
      /**
       * 格式化之前的迭代记录
       */
      formatPreviousIterations() {
        if (this.iterations.length === 0)
          return "None yet.";
        return this.iterations.map((iter) => {
          const execSummary = iter.executions.map(
            (e) => `  - ${e.toolId}: ${e.success ? "SUCCESS" : "FAILED"}`
          ).join("\n");
          return `### Iteration ${iter.iteration}
Thought: ${iter.thought.thought}
Actions:
${execSummary}
Observation: ${iter.observation}`;
        }).join("\n\n");
      }
      /**
       * 格式化积累的结果
       */
      formatAccumulatedResults() {
        if (this.toolResultsMap.size === 0)
          return "No results yet.";
        const results = [];
        this.toolResultsMap.forEach((value, key) => {
          const preview = JSON.stringify(value).slice(0, 500);
          results.push(`${key}: ${preview}${preview.length >= 500 ? "..." : ""}`);
        });
        return results.join("\n");
      }
      /**
       * 格式化工具描述
       */
      formatToolsForAI(tools) {
        return tools.map((t2) => {
          var _a;
          const params = t2.parameters.map(
            (p) => `    - ${p.name} (${p.type}${p.required ? ", required" : ""}): ${p.description}`
          ).join("\n");
          return `### ${t2.id}
  Name: ${t2.name}
  Description: ${t2.description}
  ${((_a = t2.aiHints) == null ? void 0 : _a.whenToUse) ? `When to use: ${t2.aiHints.whenToUse}` : ""}
  Parameters:
${params || "    (none)"}`;
        }).join("\n\n");
      }
      /**
       * 解析思考响应
       */
      parseThinkingResponse(response, iteration, tools) {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
          try {
            const parsed = JSON.parse(response);
            return this.validateThoughtStep(parsed, iteration, tools);
          } catch {
            return {
              iteration,
              thought: response,
              analysis: "Could not parse structured response.",
              decision: "complete",
              toolCalls: [],
              parallelizable: false
            };
          }
        }
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return this.validateThoughtStep(parsed, iteration, tools);
        } catch (error) {
          console.error("[AutonomousAgent] Failed to parse thinking response:", error);
          return {
            iteration,
            thought: response,
            analysis: "Parse error.",
            decision: "complete",
            toolCalls: [],
            parallelizable: false
          };
        }
      }
      /**
       * 验证思考步骤
       */
      validateThoughtStep(parsed, iteration, tools) {
        const toolMap = new Map(tools.map((t2) => [t2.id, t2]));
        const validToolCalls = (parsed.toolCalls || []).filter((call) => call.toolId && toolMap.has(call.toolId)).map((call, index) => ({
          id: call.id || `call_${iteration}_${index}`,
          toolId: call.toolId,
          toolName: toolMap.get(call.toolId).name,
          params: call.params || {},
          reason: call.reason || "",
          dependsOn: call.dependsOn
        }));
        return {
          iteration,
          thought: parsed.thought || "",
          analysis: parsed.analysis || "",
          decision: ["continue", "complete", "need_clarification"].includes(parsed.decision) ? parsed.decision : "continue",
          toolCalls: validToolCalls,
          parallelizable: parsed.parallelizable ?? validToolCalls.length > 1
        };
      }
      /**
       * 并行执行工具
       */
      async executeToolsInParallel(calls, maxParallel, context) {
        const results = [];
        for (let i = 0; i < calls.length; i += maxParallel) {
          const batch = calls.slice(i, i + maxParallel);
          const batchPromises = batch.map(async (call) => {
            var _a;
            this._onToolExecution.fire({ call });
            const startTime = Date.now();
            try {
              const result = await this.executor.execute({
                toolId: call.toolId,
                arguments: this.resolveParams(call.params, call.dependsOn),
                caller: "agent",
                requestId: call.id,
                context: {
                  workspaceRoot: context == null ? void 0 : context.workspaceRoot,
                  activeFile: context == null ? void 0 : context.activeFile
                }
              });
              const execResult = {
                callId: call.id,
                toolId: call.toolId,
                success: result.success,
                data: result.data,
                error: (_a = result.error) == null ? void 0 : _a.message,
                duration: Date.now() - startTime
              };
              this._onToolExecution.fire({ call, result: execResult });
              return execResult;
            } catch (error) {
              const execResult = {
                callId: call.id,
                toolId: call.toolId,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                duration: Date.now() - startTime
              };
              this._onToolExecution.fire({ call, result: execResult });
              return execResult;
            }
          });
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        }
        return results;
      }
      /**
       * 串行执行工具（有依赖关系）
       */
      async executeToolsSequentially(calls, context) {
        var _a;
        const results = [];
        const localResults = /* @__PURE__ */ new Map();
        for (const call of calls) {
          this._onToolExecution.fire({ call });
          const startTime = Date.now();
          try {
            const resolvedParams = this.resolveParams(
              call.params,
              call.dependsOn,
              localResults
            );
            const result = await this.executor.execute({
              toolId: call.toolId,
              arguments: resolvedParams,
              caller: "agent",
              requestId: call.id,
              context: {
                workspaceRoot: context == null ? void 0 : context.workspaceRoot,
                activeFile: context == null ? void 0 : context.activeFile
              }
            });
            const execResult = {
              callId: call.id,
              toolId: call.toolId,
              success: result.success,
              data: result.data,
              error: (_a = result.error) == null ? void 0 : _a.message,
              duration: Date.now() - startTime
            };
            if (result.success) {
              localResults.set(call.id, result.data);
            }
            results.push(execResult);
            this._onToolExecution.fire({ call, result: execResult });
          } catch (error) {
            const execResult = {
              callId: call.id,
              toolId: call.toolId,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              duration: Date.now() - startTime
            };
            results.push(execResult);
            this._onToolExecution.fire({ call, result: execResult });
          }
        }
        return results;
      }
      /**
       * 解析参数，替换依赖引用
       */
      resolveParams(params, dependsOn, localResults) {
        const resolved = { ...params };
        for (const [key, value] of Object.entries(resolved)) {
          if (typeof value === "string") {
            const refMatch = value.match(/\{\{(\w+)(?:\.(.+?))?\}\}/);
            if (refMatch) {
              const [, refId, path11] = refMatch;
              let refValue = (localResults == null ? void 0 : localResults.get(refId)) ?? this.toolResultsMap.get(refId);
              if (refValue !== void 0 && path11) {
                const pathParts = path11.split(".");
                for (const part of pathParts) {
                  refValue = refValue == null ? void 0 : refValue[part];
                }
              }
              resolved[key] = refValue ?? value;
            }
          }
        }
        return resolved;
      }
      /**
       * 观察阶段 - 分析执行结果
       */
      async observe(thought, executions) {
        const resultsSummary = executions.map((e) => {
          if (e.success) {
            const dataStr = JSON.stringify(e.data).slice(0, 1e3);
            return `\u2713 ${e.toolId} (${e.duration}ms): ${dataStr}`;
          } else {
            return `\u2717 ${e.toolId}: ${e.error}`;
          }
        }).join("\n");
        if (executions.every((e) => !e.success)) {
          return `All tool calls failed. Errors: ${executions.map((e) => e.error).join("; ")}`;
        }
        try {
          const observePrompt = `Based on the tool execution results, provide a brief observation summary.

Tool Calls:
${thought.toolCalls.map((c) => `- ${c.toolId}: ${c.reason}`).join("\n")}

Results:
${resultsSummary}

Provide a 1-2 sentence observation about what was learned or accomplished.`;
          const observation = await this.chatService.sendMessageSync([
            {
              id: "observe",
              role: "user",
              content: observePrompt,
              timestamp: Date.now()
            }
          ]);
          return observation.slice(0, 500);
        } catch {
          const successCount = executions.filter((e) => e.success).length;
          return `Executed ${executions.length} tools: ${successCount} succeeded, ${executions.length - successCount} failed.`;
        }
      }
      /**
       * 生成最终答案
       */
      async generateFinalAnswer(request) {
        if (this.iterations.length === 0) {
          return "No actions were taken for this task.";
        }
        const iterationsSummary = this.iterations.map(
          (iter) => `Iteration ${iter.iteration}: ${iter.thought.thought}
Results: ${iter.observation}`
        ).join("\n\n");
        const prompt = `Based on the following task execution, provide a comprehensive final answer.

## Original Task
${request.task}

## Execution Summary
${iterationsSummary}

## All Results
${this.formatAccumulatedResults()}

## Instructions
Provide a clear, helpful answer that:
1. Directly addresses the user's task
2. Summarizes what was accomplished
3. Includes relevant data from the tool results
4. Notes any issues or limitations

Respond in the same language as the task.`;
        try {
          return await this.chatService.sendMessageSync([
            {
              id: "final",
              role: "user",
              content: prompt,
              timestamp: Date.now()
            }
          ]);
        } catch {
          const successCount = this.iterations.flatMap((i) => i.executions).filter((e) => e.success).length;
          return `\u4EFB\u52A1\u6267\u884C\u5B8C\u6210\u3002\u5171\u8FDB\u884C ${this.iterations.length} \u8F6E\u8FED\u4EE3\uFF0C\u6210\u529F\u6267\u884C ${successCount} \u6B21\u5DE5\u5177\u8C03\u7528\u3002`;
        }
      }
      /**
       * 创建失败结果
       */
      createFailedResult(task, error, startTime) {
        return {
          success: false,
          task,
          iterations: this.iterations,
          finalAnswer: `\u4EFB\u52A1\u6267\u884C\u5931\u8D25: ${error}`,
          totalDuration: Date.now() - startTime,
          toolsUsed: [],
          stats: {
            totalIterations: this.iterations.length,
            totalToolCalls: 0,
            successfulCalls: 0,
            failedCalls: 0
          }
        };
      }
      /**
       * 取消任务
       */
      cancel() {
        if (this.abortController) {
          this.abortController.abort();
          this.setStatus("cancelled");
        }
      }
      /**
       * 获取当前状态
       */
      getStatus() {
        return this.status;
      }
      /**
       * 获取当前迭代记录
       */
      getIterations() {
        return [...this.iterations];
      }
      /**
       * 确保ChatService可用
       */
      async ensureChatService() {
        if (this.chatService)
          return;
        const config = await this.configManager.getFullModelConfig();
        if (config.apiKey) {
          this.chatService = new ChatService(config);
        }
      }
      /**
       * 设置状态
       */
      setStatus(status) {
        this.status = status;
        this._onStatusChange.fire(status);
      }
    };
    _AutonomousAgent.instance = null;
    AutonomousAgent = _AutonomousAgent;
  }
});

// src/extension/mcp/MCPParser.ts
var MCPParser;
var init_MCPParser = __esm({
  "src/extension/mcp/MCPParser.ts"() {
    "use strict";
    MCPParser = class {
      /**
       * 解析用户输入
       */
      static parse(input) {
        var _a, _b;
        const trimmed = input.trim();
        if (!trimmed.toLowerCase().startsWith("@mcp")) {
          return { type: "none", originalInput: input };
        }
        const match = trimmed.match(this.MCP_PATTERN);
        if (!match) {
          return { type: "none", originalInput: input };
        }
        const command = (_a = match[1]) == null ? void 0 : _a.toLowerCase();
        const rest = ((_b = match[2]) == null ? void 0 : _b.trim()) || "";
        if (!command) {
          return { type: "help", originalInput: input };
        }
        switch (command) {
          case "list":
            return { type: "list", originalInput: input };
          case "search":
            return {
              type: "search",
              searchQuery: rest || void 0,
              originalInput: input
            };
          case "agent":
            return {
              type: "agent",
              agentTask: rest || void 0,
              originalInput: input
            };
          case "manage":
          case "config":
          case "settings":
            return { type: "manage", originalInput: input };
          case "history":
            return { type: "history", originalInput: input };
          default:
            return this.parseToolCall(command, rest, input);
        }
      }
      /**
       * 解析工具调用
       */
      static parseToolCall(toolId, paramString, originalInput) {
        const params = {};
        if (paramString) {
          if (this.JSON_PATTERN.test(paramString)) {
            try {
              Object.assign(params, JSON.parse(paramString));
            } catch {
              this.parseKeyValueParams(paramString, params);
            }
          } else {
            this.parseKeyValueParams(paramString, params);
          }
        }
        return {
          type: "call",
          toolId,
          params,
          originalInput
        };
      }
      /**
       * 解析键值对参数
       */
      static parseKeyValueParams(paramString, params) {
        let match;
        const regex = new RegExp(this.PARAM_PATTERN.source, "g");
        while ((match = regex.exec(paramString)) !== null) {
          const key = match[1];
          const value = match[2] ?? match[3] ?? match[4];
          params[key] = this.parseValue(value);
        }
        if (Object.keys(params).length === 0 && paramString.trim()) {
          const values = paramString.split(/\s+/);
          if (values.length === 1) {
            params["_default"] = this.parseValue(values[0]);
          } else {
            params["_args"] = values.map((v) => this.parseValue(v));
          }
        }
      }
      /**
       * 解析值类型
       */
      static parseValue(value) {
        if (value.toLowerCase() === "true")
          return true;
        if (value.toLowerCase() === "false")
          return false;
        if (/^-?\d+$/.test(value))
          return parseInt(value, 10);
        if (/^-?\d+\.\d+$/.test(value))
          return parseFloat(value);
        if (value.startsWith("[") || value.startsWith("{")) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      }
      /**
       * 检查输入是否包含MCP指令
       */
      static isMCPCommand(input) {
        return input.trim().toLowerCase().startsWith("@mcp");
      }
      /**
       * 获取MCP帮助文本
       */
      static getHelpText() {
        return `# MCP \u5DE5\u5177\u4F7F\u7528\u5E2E\u52A9

## \u57FA\u672C\u8BED\u6CD5
\`@mcp\` - \u663E\u793A\u6B64\u5E2E\u52A9
\`@mcp:list\` - \u5217\u51FA\u6240\u6709\u53EF\u7528\u5DE5\u5177
\`@mcp:search \u5173\u952E\u8BCD\` - \u641C\u7D22\u5DE5\u5177
\`@mcp:manage\` - \u6253\u5F00\u5DE5\u5177\u7BA1\u7406\u9762\u677F
\`@mcp:history\` - \u67E5\u770B\u6267\u884C\u5386\u53F2

## \u76F4\u63A5\u8C03\u7528\u5DE5\u5177
\`@mcp:\u5DE5\u5177ID\` - \u8C03\u7528\u6307\u5B9A\u5DE5\u5177\uFF08\u65E0\u53C2\u6570\uFF09
\`@mcp:\u5DE5\u5177ID param1=value1 param2=value2\` - \u5E26\u53C2\u6570\u8C03\u7528
\`@mcp:\u5DE5\u5177ID {"param1": "value1"}\` - JSON\u53C2\u6570\u683C\u5F0F

## Agent\u6A21\u5F0F
\`@mcp:agent \u4F60\u7684\u4EFB\u52A1\u63CF\u8FF0\` - \u8BA9AI\u81EA\u52A8\u9009\u62E9\u5DE5\u5177\u5B8C\u6210\u4EFB\u52A1

## \u793A\u4F8B
\`@mcp:builtin_read_file filePath=src/index.ts\`
\`@mcp:builtin_search_code query=TODO include="**/*.ts"\`
\`@mcp:agent \u5E2E\u6211\u67E5\u627E\u6240\u6709\u5305\u542BTODO\u7684\u6587\u4EF6\`
`;
      }
      /**
       * 将解析结果转换为工具调用参数
       */
      static toToolCallParams(result, context) {
        if (result.type !== "call" || !result.toolId) {
          return null;
        }
        const params = { ...result.params };
        if (params["_default"] !== void 0) {
        }
        return {
          toolId: result.toolId,
          arguments: params,
          caller: "user",
          context
        };
      }
      /**
       * 将解析结果转换为Agent请求
       */
      static toAgentRequest(result, context) {
        if (result.type !== "agent" || !result.agentTask) {
          return null;
        }
        return {
          task: result.agentTask,
          context
        };
      }
      /**
       * 格式化工具调用为显示文本
       */
      static formatToolCall(toolId, params) {
        const paramStr = Object.entries(params).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ");
        return paramStr ? `@mcp:${toolId} ${paramStr}` : `@mcp:${toolId}`;
      }
      /**
       * 自动补全建议
       */
      static getCompletions(input, availableTools) {
        const completions = [];
        if (input === "@" || input === "@m" || input === "@mc" || input === "@mcp") {
          completions.push(
            { text: "@mcp:list", displayText: "@mcp:list", description: "\u5217\u51FA\u6240\u6709\u5DE5\u5177" },
            { text: "@mcp:search ", displayText: "@mcp:search", description: "\u641C\u7D22\u5DE5\u5177" },
            { text: "@mcp:agent ", displayText: "@mcp:agent", description: "Agent\u6A21\u5F0F" },
            { text: "@mcp:manage", displayText: "@mcp:manage", description: "\u7BA1\u7406\u5DE5\u5177" }
          );
        }
        if (input.match(/^@mcp:(\w*)$/i)) {
          const prefix = input.replace(/^@mcp:/i, "").toLowerCase();
          for (const tool of availableTools) {
            if (tool.id.toLowerCase().startsWith(prefix)) {
              completions.push({
                text: `@mcp:${tool.id}`,
                displayText: tool.name,
                description: tool.description
              });
            }
          }
        }
        return completions;
      }
    };
    // @mcp 指令的正则表达式
    MCPParser.MCP_PATTERN = /^@mcp(?::(\w+))?(?:\s+(.*))?$/i;
    // 参数解析正则
    MCPParser.PARAM_PATTERN = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    // JSON参数检测
    MCPParser.JSON_PATTERN = /^\{[\s\S]*\}$/;
  }
});

// src/extension/mcp/MCPPanelProvider.ts
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
var vscode16, _MCPPanelProvider, MCPPanelProvider;
var init_MCPPanelProvider = __esm({
  "src/extension/mcp/MCPPanelProvider.ts"() {
    "use strict";
    vscode16 = __toESM(require("vscode"));
    init_MCPRegistry();
    init_MCPExecutor();
    _MCPPanelProvider = class _MCPPanelProvider {
      constructor(_extensionUri, _context) {
        this._extensionUri = _extensionUri;
        this._context = _context;
        this._registry = MCPRegistry.getInstance(_context);
        this._executor = MCPExecutor.getInstance(_context, this._registry);
        this._registry.onToolsChanged(() => {
          this._sendToolsToWebview();
        });
      }
      static getInstance(extensionUri, context) {
        if (!_MCPPanelProvider.instance) {
          _MCPPanelProvider.instance = new _MCPPanelProvider(extensionUri, context);
        }
        return _MCPPanelProvider.instance;
      }
      resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
          enableScripts: true,
          localResourceRoots: [this._extensionUri]
        };
        webviewView.title = "MCP\u5DE5\u5177\u7BA1\u7406";
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
          await this._handleMessage(data);
        });
        setTimeout(() => this._sendToolsToWebview(), 100);
      }
      /**
       * 处理WebView消息
       */
      async _handleMessage(data) {
        switch (data.type) {
          case "getTools":
            this._sendToolsToWebview();
            break;
          case "getConfig":
            this._sendConfig();
            break;
          case "registerTool":
            await this._registerTool(data.tool);
            break;
          case "updateTool":
            await this._updateTool(data.tool);
            break;
          case "deleteTool":
            await this._deleteTool(data.toolId);
            break;
          case "toggleTool":
            await this._toggleTool(data.toolId, data.enabled);
            break;
          case "testTool":
            await this._testTool(data.toolId, data.params);
            break;
          case "updateConfig":
            await this._updateConfig(data.config);
            break;
          case "importTools":
            await this._importTools(data.data);
            break;
          case "exportTools":
            this._exportTools(data.toolIds);
            break;
          case "getToolTemplate":
            this._sendToolTemplate(data.executionType);
            break;
        }
      }
      /**
       * 发送工具列表到WebView
       */
      _sendToolsToWebview() {
        if (!this._view)
          return;
        const tools = this._registry.getAllTools();
        this._view.webview.postMessage({
          type: "toolList",
          tools
        });
      }
      /**
       * 发送配置到WebView
       */
      _sendConfig() {
        if (!this._view)
          return;
        const config = this._registry.getConfig();
        this._view.webview.postMessage({
          type: "config",
          config
        });
      }
      /**
       * 注册工具
       */
      async _registerTool(tool) {
        var _a;
        const result = await this._registry.registerTool(tool, "user");
        (_a = this._view) == null ? void 0 : _a.webview.postMessage({
          type: "registerResult",
          ...result,
          toolId: tool.id
        });
        if (result.success) {
          vscode16.window.showInformationMessage(`MCP\u5DE5\u5177 "${tool.name}" \u5DF2\u6210\u529F\u6CE8\u518C`);
        } else {
          vscode16.window.showErrorMessage(`\u6CE8\u518C\u5931\u8D25: ${result.error}`);
        }
      }
      /**
       * 更新工具
       */
      async _updateTool(tool) {
        var _a;
        const result = await this._registry.updateTool(tool);
        (_a = this._view) == null ? void 0 : _a.webview.postMessage({
          type: "updateResult",
          ...result,
          toolId: tool.id
        });
        if (result.success) {
          vscode16.window.showInformationMessage(`MCP\u5DE5\u5177 "${tool.name}" \u5DF2\u66F4\u65B0`);
        }
      }
      /**
       * 删除工具
       */
      async _deleteTool(toolId) {
        var _a, _b;
        const tool = this._registry.getTool(toolId);
        const toolName = (tool == null ? void 0 : tool.tool.name) || toolId;
        const answer = await vscode16.window.showWarningMessage(
          `\u786E\u5B9A\u8981\u5220\u9664\u5DE5\u5177 "${toolName}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`,
          { modal: true },
          "\u786E\u8BA4\u5220\u9664"
        );
        if (answer !== "\u786E\u8BA4\u5220\u9664") {
          (_a = this._view) == null ? void 0 : _a.webview.postMessage({
            type: "deleteResult",
            success: false,
            cancelled: true,
            toolId
          });
          return;
        }
        const result = await this._registry.deleteTool(toolId);
        (_b = this._view) == null ? void 0 : _b.webview.postMessage({
          type: "deleteResult",
          ...result,
          toolId
        });
        if (result.success) {
          vscode16.window.showInformationMessage("MCP\u5DE5\u5177\u5DF2\u5220\u9664");
        } else {
          vscode16.window.showErrorMessage(`\u5220\u9664\u5931\u8D25: ${result.error}`);
        }
      }
      /**
       * 切换工具启用状态
       */
      async _toggleTool(toolId, enabled) {
        var _a;
        const result = await this._registry.toggleTool(toolId, enabled);
        (_a = this._view) == null ? void 0 : _a.webview.postMessage({
          type: "toggleResult",
          ...result,
          toolId,
          enabled
        });
      }
      /**
       * 测试工具
       */
      async _testTool(toolId, params) {
        var _a, _b;
        await this._registry.updateToolStatus(toolId, "testing");
        (_a = this._view) == null ? void 0 : _a.webview.postMessage({
          type: "testStart",
          toolId
        });
        const result = await this._executor.execute({
          toolId,
          arguments: params,
          caller: "user",
          requestId: `test_${Date.now()}`
        });
        await this._registry.updateToolStatus(toolId, result.success ? "active" : "error");
        (_b = this._view) == null ? void 0 : _b.webview.postMessage({
          type: "testResult",
          toolId,
          result
        });
      }
      /**
       * 更新配置
       */
      async _updateConfig(config) {
        var _a;
        await this._registry.updateConfig(config);
        (_a = this._view) == null ? void 0 : _a.webview.postMessage({
          type: "configUpdated",
          config: this._registry.getConfig()
        });
        vscode16.window.showInformationMessage("MCP\u914D\u7F6E\u5DF2\u66F4\u65B0");
      }
      /**
       * 导入工具
       */
      async _importTools(data) {
        var _a;
        const result = await this._registry.importTools(data);
        (_a = this._view) == null ? void 0 : _a.webview.postMessage({
          type: "importResult",
          ...result
        });
        if (result.success) {
          vscode16.window.showInformationMessage(`\u6210\u529F\u5BFC\u5165 ${result.imported} \u4E2A\u5DE5\u5177`);
        } else if (result.imported > 0) {
          vscode16.window.showWarningMessage(
            `\u5BFC\u5165\u5B8C\u6210: ${result.imported} \u4E2A\u6210\u529F, ${result.errors.length} \u4E2A\u5931\u8D25`
          );
        } else {
          vscode16.window.showErrorMessage(`\u5BFC\u5165\u5931\u8D25: ${result.errors.join(", ")}`);
        }
      }
      /**
       * 导出工具
       */
      _exportTools(toolIds) {
        var _a;
        const data = this._registry.exportTools(toolIds);
        (_a = this._view) == null ? void 0 : _a.webview.postMessage({
          type: "exportData",
          data
        });
      }
      /**
       * 发送工具模板
       */
      _sendToolTemplate(executionType) {
        var _a;
        const templates = {
          http: {
            id: "my_http_tool",
            name: "My HTTP Tool",
            description: "Description of what this tool does",
            version: "1.0.0",
            category: "api",
            parameters: [
              {
                name: "param1",
                type: "string",
                description: "First parameter",
                required: true
              }
            ],
            returns: {
              type: "object",
              description: "API response"
            },
            execution: {
              type: "http",
              http: {
                url: "https://api.example.com/endpoint",
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                bodyTemplate: '{"param1": "{{param1}}"}',
                responseMapping: {
                  resultPath: "data",
                  successCondition: "data.status === 200"
                },
                timeout: 3e4,
                auth: {
                  type: "bearer",
                  tokenEnvVar: "API_TOKEN"
                }
              }
            },
            metadata: {
              status: "active",
              createdAt: Date.now(),
              updatedAt: Date.now()
            },
            aiHints: {
              whenToUse: "When you need to...",
              priority: 50
            },
            security: {
              requireConfirmation: false,
              allowedCallers: ["user", "agent"]
            }
          },
          command: {
            id: "my_command_tool",
            name: "My Command Tool",
            description: "Execute a shell command",
            version: "1.0.0",
            category: "shell",
            parameters: [
              {
                name: "args",
                type: "string",
                description: "Command arguments",
                required: false
              }
            ],
            returns: {
              type: "object",
              description: "Command output"
            },
            execution: {
              type: "command",
              command: {
                command: "echo {{args}}",
                timeout: 3e4,
                requireConfirmation: true
              }
            },
            metadata: {
              status: "active",
              createdAt: Date.now(),
              updatedAt: Date.now()
            },
            security: {
              requireConfirmation: true,
              allowedCallers: ["user"]
            }
          },
          script: {
            id: "my_script_tool",
            name: "My Script Tool",
            description: "Execute a JavaScript script",
            version: "1.0.0",
            category: "utility",
            parameters: [
              {
                name: "input",
                type: "string",
                description: "Input data",
                required: true
              }
            ],
            returns: {
              type: "object",
              description: "Script result"
            },
            execution: {
              type: "script",
              script: {
                language: "javascript",
                code: `
// Your JavaScript code here
const { input } = args;
return { processed: input.toUpperCase() };
            `.trim(),
                timeout: 1e4
              }
            },
            metadata: {
              status: "active",
              createdAt: Date.now(),
              updatedAt: Date.now()
            },
            security: {
              allowedCallers: ["user", "agent"]
            }
          }
        };
        (_a = this._view) == null ? void 0 : _a.webview.postMessage({
          type: "toolTemplate",
          template: templates[executionType] || templates.http,
          executionType
        });
      }
      /**
       * 生成WebView HTML
       */
      _getHtmlForWebview(webview) {
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>MCP\u5DE5\u5177\u7BA1\u7406</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 12px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .header h2 {
      font-size: 14px;
      font-weight: 600;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    button {
      padding: 6px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    
    button.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    
    button.danger {
      background-color: var(--vscode-errorForeground);
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .tab {
      padding: 8px 16px;
      background: none;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    
    .tab.active {
      border-bottom-color: var(--vscode-focusBorder);
      color: var(--vscode-textLink-foreground);
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    .tool-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .tool-card {
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 12px;
    }
    
    .tool-card.disabled {
      opacity: 0.6;
    }
    
    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    
    .tool-info h3 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .tool-id {
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }
    
    .tool-badges {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    
    .badge {
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 10px;
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    
    .badge.category {
      background-color: var(--vscode-textLink-foreground);
      color: white;
    }
    
    .badge.builtin {
      background-color: var(--vscode-editorInfo-foreground);
    }
    
    .badge.status-active {
      background-color: var(--vscode-terminal-ansiGreen);
    }
    
    .badge.status-error {
      background-color: var(--vscode-errorForeground);
    }
    
    .badge.status-testing {
      background-color: var(--vscode-editorWarning-foreground);
    }
    
    .tool-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    
    .tool-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .tool-actions button {
      padding: 4px 8px;
      font-size: 11px;
    }
    
    /* \u8868\u5355\u6837\u5F0F */
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-family: inherit;
      font-size: 12px;
    }
    
    .form-group textarea {
      min-height: 100px;
      font-family: var(--vscode-editor-font-family);
      resize: vertical;
    }
    
    .form-group .hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .param-list {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 8px;
      margin-top: 8px;
    }
    
    .param-item {
      display: grid;
      grid-template-columns: 1fr 100px 2fr auto;
      gap: 8px;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .param-item:last-child {
      border-bottom: none;
    }
    
    .param-item input,
    .param-item select {
      padding: 4px 8px;
      font-size: 11px;
    }
    
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .checkbox-group input[type="checkbox"] {
      width: auto;
    }
    
    /* \u6D4B\u8BD5\u9762\u677F */
    .test-panel {
      margin-top: 12px;
      padding: 12px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
    }
    
    .test-result {
      margin-top: 12px;
      padding: 8px;
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      max-height: 200px;
      overflow: auto;
    }
    
    .test-result.success {
      background-color: rgba(0, 200, 0, 0.1);
      border: 1px solid var(--vscode-terminal-ansiGreen);
    }
    
    .test-result.error {
      background-color: rgba(200, 0, 0, 0.1);
      border: 1px solid var(--vscode-errorForeground);
    }
    
    /* JSON\u7F16\u8F91\u5668 */
    .json-editor {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      min-height: 300px;
    }
    
    /* \u7A7A\u72B6\u6001 */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--vscode-descriptionForeground);
    }
    
    .empty-state p {
      margin-bottom: 16px;
    }
    
    /* \u641C\u7D22 */
    .search-box {
      margin-bottom: 12px;
    }
    
    .search-box input {
      width: 100%;
      padding: 8px 12px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
    }
    
    /* \u5206\u7C7B\u7B5B\u9009 */
    .filter-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    
    .filter-chip {
      padding: 4px 10px;
      font-size: 11px;
      border-radius: 12px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      cursor: pointer;
    }
    
    .filter-chip.active {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }
    
    /* \u5BFC\u5165\u5BFC\u51FA\u6A21\u6001\u6846 */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 100;
      align-items: center;
      justify-content: center;
    }
    
    .modal-overlay.active {
      display: flex;
    }
    
    .modal {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: auto;
    }
    
    .modal h3 {
      margin-bottom: 16px;
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>\u{1F527} MCP\u5DE5\u5177\u7BA1\u7406</h2>
    <div class="header-actions">
      <button id="btn-import" class="secondary">\u5BFC\u5165</button>
      <button id="btn-export" class="secondary">\u5BFC\u51FA</button>
      <button id="btn-new-tool">+ \u65B0\u5EFA\u5DE5\u5177</button>
    </div>
  </div>
  
  <div class="tabs">
    <button class="tab active" data-tab="list" id="tab-btn-list">\u5DE5\u5177\u5217\u8868</button>
    <button class="tab" data-tab="create" id="tab-btn-create">\u521B\u5EFA\u5DE5\u5177</button>
    <button class="tab" data-tab="config" id="tab-btn-config">\u8BBE\u7F6E</button>
  </div>
  
  <!-- \u5DE5\u5177\u5217\u8868 -->
  <div id="tab-list" class="tab-content active">
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="\u641C\u7D22\u5DE5\u5177...">
    </div>
    
    <div class="filter-row" id="filter-row">
      <span class="filter-chip active" data-filter="all">\u5168\u90E8</span>
      <span class="filter-chip" data-filter="file">\u{1F4C1} \u6587\u4EF6</span>
      <span class="filter-chip" data-filter="code">\u{1F4BB} \u4EE3\u7801</span>
      <span class="filter-chip" data-filter="api">\u{1F310} API</span>
      <span class="filter-chip" data-filter="shell">\u2328\uFE0F Shell</span>
      <span class="filter-chip" data-filter="web">\u{1F517} Web</span>
      <span class="filter-chip" data-filter="utility">\u{1F527} \u5DE5\u5177</span>
      <span class="filter-chip" data-filter="custom">\u{1F4E6} \u81EA\u5B9A\u4E49</span>
    </div>
    
    <div id="toolList" class="tool-list">
      <div class="empty-state">
        <p>\u52A0\u8F7D\u4E2D...</p>
      </div>
    </div>
  </div>
  
  <!-- \u521B\u5EFA\u5DE5\u5177 -->
  <div id="tab-create" class="tab-content">
    <div class="form-group">
      <label>\u6267\u884C\u7C7B\u578B</label>
      <select id="executionType">
        <option value="http">HTTP\u8BF7\u6C42</option>
        <option value="command">\u547D\u4EE4\u884C</option>
        <option value="script">JavaScript\u811A\u672C</option>
      </select>
      <div class="hint">\u9009\u62E9\u5DE5\u5177\u7684\u6267\u884C\u65B9\u5F0F</div>
    </div>
    
    <div class="form-group">
      <label>\u5DE5\u5177\u5B9A\u4E49 (JSON)</label>
      <textarea id="toolJson" class="json-editor" placeholder="\u5DE5\u5177JSON\u5B9A\u4E49..."></textarea>
      <div class="hint">\u6309\u7167MCP\u89C4\u8303\u5B9A\u4E49\u5DE5\u5177\u3002\u70B9\u51FB"\u52A0\u8F7D\u6A21\u677F"\u83B7\u53D6\u793A\u4F8B\u3002</div>
    </div>
    
    <div style="display: flex; gap: 8px;">
      <button id="btn-load-template">\u52A0\u8F7D\u6A21\u677F</button>
      <button id="btn-validate">\u9A8C\u8BC1</button>
      <button id="btn-register">\u6CE8\u518C\u5DE5\u5177</button>
    </div>
    
    <div id="createResult" style="margin-top: 12px;"></div>
  </div>
  
  <!-- \u8BBE\u7F6E -->
  <div id="tab-config" class="tab-content">
    <div class="form-group">
      <div class="checkbox-group">
        <input type="checkbox" id="configEnabled" checked>
        <label for="configEnabled">\u542F\u7528MCP\u529F\u80FD</label>
      </div>
    </div>
    
    <div class="form-group">
      <label>Agent\u6700\u5927\u5DE5\u5177\u6570</label>
      <input type="number" id="configMaxTools" value="5" min="1" max="20">
      <div class="hint">Agent\u5355\u6B21\u8BF7\u6C42\u6700\u591A\u4F7F\u7528\u7684\u5DE5\u5177\u6570\u91CF</div>
    </div>
    
    <div class="form-group">
      <label>\u9ED8\u8BA4\u8D85\u65F6 (\u6BEB\u79D2)</label>
      <input type="number" id="configTimeout" value="30000" min="1000" max="300000">
    </div>
    
    <div class="form-group">
      <div class="checkbox-group">
        <input type="checkbox" id="configLogAll" checked>
        <label for="configLogAll">\u8BB0\u5F55\u6240\u6709\u6267\u884C\u65E5\u5FD7</label>
      </div>
    </div>
    
    <div class="form-group">
      <label>\u73AF\u5883\u53D8\u91CF (JSON)</label>
      <textarea id="configEnvVars" style="min-height: 80px;">{}</textarea>
      <div class="hint">\u7528\u4E8EAPI\u5BC6\u94A5\u7B49\u654F\u611F\u4FE1\u606F\uFF0C\u683C\u5F0F: {"API_KEY": "your-key"}</div>
    </div>
    
    <button id="btn-save-config">\u4FDD\u5B58\u8BBE\u7F6E</button>
  </div>
  
  <!-- \u5BFC\u5165\u6A21\u6001\u6846 -->
  <div id="importModal" class="modal-overlay">
    <div class="modal">
      <h3>\u5BFC\u5165\u5DE5\u5177</h3>
      <div class="form-group">
        <label>\u5DE5\u5177JSON\u6570\u636E</label>
        <textarea id="importData" class="json-editor" placeholder="\u7C98\u8D34\u5BFC\u51FA\u7684\u5DE5\u5177JSON..."></textarea>
      </div>
      <div class="modal-actions">
        <button class="secondary" id="btn-cancel-import">\u53D6\u6D88</button>
        <button id="btn-do-import">\u5BFC\u5165</button>
      </div>
    </div>
  </div>
  
  <!-- \u6D4B\u8BD5\u6A21\u6001\u6846 -->
  <div id="testModal" class="modal-overlay">
    <div class="modal">
      <h3 id="testModalTitle">\u6D4B\u8BD5\u5DE5\u5177</h3>
      <div id="testParamsForm"></div>
      <div id="testResultContainer"></div>
      <div class="modal-actions">
        <button class="secondary" id="btn-close-test">\u5173\u95ED</button>
        <button id="runTestBtn">\u8FD0\u884C\u6D4B\u8BD5</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    
    let allTools = [];
    let currentFilter = 'all';
    let currentTestToolId = null;
    
    console.log('[MCP Panel] Script initializing...');
    
    // DOM\u52A0\u8F7D\u5B8C\u6210\u540E\u521D\u59CB\u5316
    document.addEventListener('DOMContentLoaded', function() {
      console.log('[MCP Panel] DOM loaded, binding events...');
      initializeEventListeners();
      
      // \u5EF6\u8FDF\u8BF7\u6C42\u6570\u636E
      setTimeout(function() {
        vscode.postMessage({ type: 'getTools' });
        vscode.postMessage({ type: 'getConfig' });
      }, 100);
    });
    
    // \u5907\u7528\u521D\u59CB\u5316
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(function() {
        initializeEventListeners();
        vscode.postMessage({ type: 'getTools' });
        vscode.postMessage({ type: 'getConfig' });
      }, 50);
    }
    
    // \u521D\u59CB\u5316\u4E8B\u4EF6\u76D1\u542C\u5668
    function initializeEventListeners() {
      // Tab \u6309\u94AE\u4E8B\u4EF6
      document.getElementById('tab-btn-list')?.addEventListener('click', () => showTab('list'));
      document.getElementById('tab-btn-create')?.addEventListener('click', () => showTab('create'));
      document.getElementById('tab-btn-config')?.addEventListener('click', () => showTab('config'));
      
      // Header \u6309\u94AE\u4E8B\u4EF6
      document.getElementById('btn-import')?.addEventListener('click', showImportModal);
      document.getElementById('btn-export')?.addEventListener('click', exportAllTools);
      document.getElementById('btn-new-tool')?.addEventListener('click', () => showTab('create'));
      
      // \u521B\u5EFA\u5DE5\u5177\u9875\u9762\u6309\u94AE
      document.getElementById('btn-load-template')?.addEventListener('click', loadTemplate);
      document.getElementById('btn-validate')?.addEventListener('click', validateTool);
      document.getElementById('btn-register')?.addEventListener('click', registerTool);
      
      // \u6267\u884C\u7C7B\u578B\u4E0B\u62C9\u6846
      document.getElementById('executionType')?.addEventListener('change', loadTemplate);
      
      // \u641C\u7D22\u6846
      document.getElementById('searchInput')?.addEventListener('input', filterTools);
      
      // \u7B5B\u9009\u5668
      document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
        chip.addEventListener('click', function() {
          setFilter(this.getAttribute('data-filter'));
        });
      });
      
      // \u8BBE\u7F6E\u9875\u9762\u4FDD\u5B58\u6309\u94AE
      document.getElementById('btn-save-config')?.addEventListener('click', saveConfig);
      
      // \u5BFC\u5165\u6A21\u6001\u6846\u6309\u94AE
      document.getElementById('btn-cancel-import')?.addEventListener('click', hideImportModal);
      document.getElementById('btn-do-import')?.addEventListener('click', importTools);
      
      // \u6D4B\u8BD5\u6A21\u6001\u6846\u6309\u94AE
      document.getElementById('btn-close-test')?.addEventListener('click', hideTestModal);
      document.getElementById('runTestBtn')?.addEventListener('click', runTest);
      
      console.log('[MCP Panel] Event listeners bound');
    }
    
    // \u5904\u7406\u6765\u81EA\u6269\u5C55\u7684\u6D88\u606F
    window.addEventListener('message', event => {
      const data = event.data;
      console.log('[MCP Panel] Received message:', data.type);
      
      switch (data.type) {
        case 'toolList':
          allTools = data.tools || [];
          console.log('[MCP Panel] Loaded', allTools.length, 'tools');
          renderTools();
          break;
          
        case 'config':
          loadConfigToForm(data.config);
          break;
          
        case 'toolTemplate':
          const jsonEditor = document.getElementById('toolJson');
          if (jsonEditor) {
            jsonEditor.value = JSON.stringify(data.template, null, 2);
          }
          break;
          
        case 'registerResult':
          showCreateResult(data);
          if (data.success) {
            vscode.postMessage({ type: 'getTools' });
          }
          break;
          
        case 'testStart':
          const startBtn = document.getElementById('runTestBtn');
          if (startBtn) {
            startBtn.disabled = true;
            startBtn.textContent = '\u8FD0\u884C\u4E2D...';
          }
          break;
          
        case 'testResult':
          showTestResult(data.result);
          const endBtn = document.getElementById('runTestBtn');
          if (endBtn) {
            endBtn.disabled = false;
            endBtn.textContent = '\u8FD0\u884C\u6D4B\u8BD5';
          }
          vscode.postMessage({ type: 'getTools' });
          break;
          
        case 'exportData':
          downloadJson(data.data, 'mcp-tools-export.json');
          break;
          
        case 'importResult':
          alert(data.success 
            ? '\u5BFC\u5165\u6210\u529F: ' + data.imported + ' \u4E2A\u5DE5\u5177'
            : '\u5BFC\u5165\u5931\u8D25: ' + (data.errors || []).join(', '));
          hideImportModal();
          vscode.postMessage({ type: 'getTools' });
          break;
          
        case 'configUpdated':
          loadConfigToForm(data.config);
          break;
      }
    });
    
    // \u5207\u6362\u6807\u7B7E - \u4F7F\u7528data-tab\u5C5E\u6027
    function showTab(tabName) {
      console.log('[MCP Panel] Switching to tab:', tabName);
      
      // \u79FB\u9664\u6240\u6709active\u72B6\u6001
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      // \u4F7F\u7528data\u5C5E\u6027\u627E\u5230\u5BF9\u5E94\u7684tab\u6309\u94AE
      const tabButton = document.querySelector('.tab[data-tab="' + tabName + '"]');
      const tabContent = document.getElementById('tab-' + tabName);
      
      if (tabButton) {
        tabButton.classList.add('active');
      }
      
      if (tabContent) {
        tabContent.classList.add('active');
      }
      
      // \u5982\u679C\u5207\u6362\u5230\u8BBE\u7F6E\u9875\uFF0C\u8BF7\u6C42\u914D\u7F6E\u6570\u636E
      if (tabName === 'config') {
        vscode.postMessage({ type: 'getConfig' });
      }
      
      // \u5982\u679C\u5207\u6362\u5230\u521B\u5EFA\u9875\u4E14\u7F16\u8F91\u5668\u4E3A\u7A7A\uFF0C\u52A0\u8F7D\u6A21\u677F
      if (tabName === 'create') {
        const jsonEditor = document.getElementById('toolJson');
        if (jsonEditor && !jsonEditor.value.trim()) {
          loadTemplate();
        }
      }
    }
    
    // \u6E32\u67D3\u5DE5\u5177\u5217\u8868
    function renderTools() {
      const container = document.getElementById('toolList');
      const searchQuery = document.getElementById('searchInput').value.toLowerCase();
      
      let filtered = allTools.filter(r => {
        if (currentFilter !== 'all' && r.tool.category !== currentFilter) {
          return false;
        }
        if (searchQuery) {
          const tool = r.tool;
          return tool.name.toLowerCase().includes(searchQuery) ||
                 tool.description.toLowerCase().includes(searchQuery) ||
                 tool.id.toLowerCase().includes(searchQuery);
        }
        return true;
      });
      
      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>\u6CA1\u6709\u627E\u5230\u5DE5\u5177</p><button id="btn-create-first" class="primary">\u521B\u5EFA\u7B2C\u4E00\u4E2A\u5DE5\u5177</button></div>';
        // \u4F7F\u7528setTimeout\u786E\u4FDDDOM\u66F4\u65B0\u5B8C\u6210\u540E\u518D\u7ED1\u5B9A\u4E8B\u4EF6
        setTimeout(function() {
          const btn = document.getElementById('btn-create-first');
          if (btn) {
            btn.onclick = function(e) {
              e.preventDefault();
              console.log('[MCP Panel] Create first tool button clicked');
              showTab('create');
            };
          }
        }, 0);
        return;
      }
      
      container.innerHTML = filtered.map(r => renderToolCard(r)).join('');
      // \u7ED1\u5B9A\u5DE5\u5177\u5361\u7247\u6309\u94AE\u4E8B\u4EF6
      bindToolCardEvents();
    }
    
    // \u7ED1\u5B9A\u5DE5\u5177\u5361\u7247\u6309\u94AE\u4E8B\u4EF6\uFF08\u4F7F\u7528\u4E8B\u4EF6\u59D4\u6258\uFF09
    function bindToolCardEvents() {
      const container = document.getElementById('toolList');
      if (!container) return;
      
      // \u4F7F\u7528\u4E8B\u4EF6\u59D4\u6258\u5904\u7406\u5DE5\u5177\u5361\u7247\u4E2D\u7684\u6309\u94AE\u70B9\u51FB
      container.onclick = function(event) {
        // \u4F7F\u7528closest\u627E\u5230\u6700\u8FD1\u7684\u6309\u94AE\u5143\u7D20\uFF0C\u5904\u7406\u70B9\u51FB\u6309\u94AE\u5185\u6587\u672C\u7684\u60C5\u51B5
        const target = event.target.closest('button[data-action]');
        if (!target) return;
        
        const action = target.getAttribute('data-action');
        const toolId = target.getAttribute('data-tool-id');
        
        if (!action || !toolId) return;
        
        console.log('[MCP Panel] Tool action:', action, 'toolId:', toolId);
        
        // \u963B\u6B62\u4E8B\u4EF6\u5192\u6CE1
        event.preventDefault();
        event.stopPropagation();
        
        switch (action) {
          case 'test':
            showTestModal(toolId);
            break;
          case 'copy':
            copyToolCommand(toolId);
            break;
          case 'edit':
            editTool(toolId);
            break;
          case 'toggle':
            const enabled = target.getAttribute('data-enabled') === 'true';
            toggleTool(toolId, enabled);
            break;
          case 'delete':
            deleteTool(toolId);
            break;
        }
      };
    }
    
    // \u6E32\u67D3\u5355\u4E2A\u5DE5\u5177\u5361\u7247
    function renderToolCard(registration) {
      const tool = registration.tool;
      const isBuiltin = registration.source === 'builtin';
      const statusClass = 'status-' + (tool.metadata?.status || 'active');
      
      return \`
        <div class="tool-card \${registration.enabled ? '' : 'disabled'}">
          <div class="tool-header">
            <div class="tool-info">
              <h3>\${tool.name}</h3>
              <div class="tool-id">@mcp:\${tool.id}</div>
            </div>
            <div class="tool-badges">
              <span class="badge category">\${getCategoryIcon(tool.category)} \${tool.category}</span>
              \${isBuiltin ? '<span class="badge builtin">\u5185\u7F6E</span>' : ''}
              <span class="badge \${statusClass}">\${tool.metadata?.status || 'active'}</span>
              <span class="badge">v\${tool.version}</span>
            </div>
          </div>
          <div class="tool-description">\${tool.description}</div>
          <div class="tool-actions">
            <button data-action="test" data-tool-id="\${tool.id}">\u6D4B\u8BD5</button>
            <button data-action="copy" data-tool-id="\${tool.id}" class="secondary">\u590D\u5236\u547D\u4EE4</button>
            \${!isBuiltin ? \`
              <button data-action="edit" data-tool-id="\${tool.id}" class="secondary">\u7F16\u8F91</button>
              <button data-action="toggle" data-tool-id="\${tool.id}" data-enabled="\${!registration.enabled}" class="secondary">
                \${registration.enabled ? '\u7981\u7528' : '\u542F\u7528'}
              </button>
              <button data-action="delete" data-tool-id="\${tool.id}" class="danger">\u5220\u9664</button>
            \` : ''}
          </div>
        </div>
      \`;
    }
    
    function getCategoryIcon(category) {
      const icons = {
        file: '\u{1F4C1}', code: '\u{1F4BB}', api: '\u{1F310}', database: '\u{1F5C4}\uFE0F',
        shell: '\u2328\uFE0F', web: '\u{1F517}', ai: '\u{1F916}', utility: '\u{1F527}', custom: '\u{1F4E6}'
      };
      return icons[category] || '\u{1F4E6}';
    }
    
    // \u7B5B\u9009
    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.textContent.toLowerCase().includes(filter) || (filter === 'all' && chip.textContent === '\u5168\u90E8'));
      });
      renderTools();
    }
    
    function filterTools() {
      renderTools();
    }
    
    // \u52A0\u8F7D\u6A21\u677F
    function loadTemplate() {
      console.log('[MCP Panel] loadTemplate called');
      const typeSelect = document.getElementById('executionType');
      if (!typeSelect) {
        console.error('[MCP Panel] executionType select not found');
        return;
      }
      const type = typeSelect.value;
      console.log('[MCP Panel] Loading template for type:', type);
      vscode.postMessage({ type: 'getToolTemplate', executionType: type });
    }
    
    // \u9A8C\u8BC1\u5DE5\u5177
    function validateTool() {
      console.log('[MCP Panel] validateTool called');
      try {
        const jsonEditor = document.getElementById('toolJson');
        if (!jsonEditor) {
          showCreateResult({ success: false, error: '\u65E0\u6CD5\u627E\u5230JSON\u7F16\u8F91\u5668' });
          return;
        }
        
        const json = jsonEditor.value;
        if (!json || !json.trim()) {
          showCreateResult({ success: false, error: '\u8BF7\u8F93\u5165\u5DE5\u5177\u5B9A\u4E49JSON' });
          return;
        }
        
        const tool = JSON.parse(json);
        
        const errors = [];
        if (!tool.id) errors.push('\u7F3A\u5C11 id');
        if (!tool.name) errors.push('\u7F3A\u5C11 name');
        if (!tool.description) errors.push('\u7F3A\u5C11 description');
        if (!tool.version) errors.push('\u7F3A\u5C11 version');
        if (!tool.execution?.type) errors.push('\u7F3A\u5C11 execution.type');
        
        if (errors.length > 0) {
          showCreateResult({ success: false, error: errors.join(', ') });
        } else {
          showCreateResult({ success: true, message: '\u2713 \u9A8C\u8BC1\u901A\u8FC7\uFF01\u53EF\u4EE5\u6CE8\u518C\u5DE5\u5177\u3002' });
        }
      } catch (e) {
        showCreateResult({ success: false, error: 'JSON\u89E3\u6790\u5931\u8D25: ' + e.message });
      }
    }
    
    // \u6CE8\u518C\u5DE5\u5177
    function registerTool() {
      console.log('[MCP Panel] registerTool called');
      try {
        const jsonEditor = document.getElementById('toolJson');
        if (!jsonEditor) {
          showCreateResult({ success: false, error: '\u65E0\u6CD5\u627E\u5230JSON\u7F16\u8F91\u5668' });
          return;
        }
        
        const json = jsonEditor.value;
        if (!json || !json.trim()) {
          showCreateResult({ success: false, error: '\u8BF7\u8F93\u5165\u5DE5\u5177\u5B9A\u4E49JSON' });
          return;
        }
        
        const tool = JSON.parse(json);
        console.log('[MCP Panel] Registering tool:', tool.id);
        
        showCreateResult({ success: true, message: '\u6B63\u5728\u6CE8\u518C\u5DE5\u5177...' });
        vscode.postMessage({ type: 'registerTool', tool });
      } catch (e) {
        console.error('[MCP Panel] registerTool error:', e);
        showCreateResult({ success: false, error: 'JSON\u89E3\u6790\u5931\u8D25: ' + e.message });
      }
    }
    
    function showCreateResult(result) {
      const container = document.getElementById('createResult');
      if (!container) return;
      
      if (result.success) {
        container.innerHTML = '<div class="test-result success">' + (result.message || '\u64CD\u4F5C\u6210\u529F\uFF01') + '</div>';
      } else {
        container.innerHTML = '<div class="test-result error">\u9519\u8BEF: ' + (result.error || '\u672A\u77E5\u9519\u8BEF') + '</div>';
      }
    }
    
    // \u7F16\u8F91\u5DE5\u5177
    function editTool(toolId) {
      console.log('[MCP Panel] editTool called:', toolId);
      const registration = allTools.find(r => r.tool.id === toolId);
      if (registration) {
        const jsonEditor = document.getElementById('toolJson');
        if (jsonEditor) {
          jsonEditor.value = JSON.stringify(registration.tool, null, 2);
        }
        showTab('create');
      }
    }
    
    // \u5207\u6362\u542F\u7528\u72B6\u6001
    function toggleTool(toolId, enabled) {
      console.log('[MCP Panel] toggleTool called:', toolId, enabled);
      vscode.postMessage({ type: 'toggleTool', toolId, enabled });
      // \u7ACB\u5373\u66F4\u65B0UI
      const tool = allTools.find(r => r.tool.id === toolId);
      if (tool) {
        tool.enabled = enabled;
        renderTools();
      }
    }
    
    // \u5220\u9664\u5DE5\u5177 - \u53D1\u9001\u5230\u540E\u7AEF\u5904\u7406\u786E\u8BA4
    function deleteTool(toolId) {
      console.log('[MCP Panel] Delete tool requested:', toolId);
      // \u76F4\u63A5\u53D1\u9001\u5230\u540E\u7AEF\uFF0C\u7531VSCode API\u5904\u7406\u786E\u8BA4\u5BF9\u8BDD\u6846
      vscode.postMessage({ type: 'deleteTool', toolId });
    }
    
    // \u590D\u5236\u547D\u4EE4
    function copyToolCommand(toolId) {
      const text = '@mcp:' + toolId;
      navigator.clipboard.writeText(text);
      // \u7B80\u5355\u7684\u63D0\u793A
      alert('\u5DF2\u590D\u5236: ' + text);
    }
    
    // \u6D4B\u8BD5\u76F8\u5173
    function showTestModal(toolId) {
      console.log('[MCP Panel] showTestModal called:', toolId);
      currentTestToolId = toolId;
      const registration = allTools.find(r => r.tool.id === toolId);
      if (!registration) {
        console.error('[MCP Panel] Tool not found:', toolId);
        return;
      }
      
      const tool = registration.tool;
      const titleEl = document.getElementById('testModalTitle');
      if (titleEl) {
        titleEl.textContent = '\u6D4B\u8BD5: ' + tool.name;
      }
      
      // \u751F\u6210\u53C2\u6570\u8868\u5355
      const paramsHtml = tool.parameters.map(p => \`
        <div class="form-group">
          <label>\${p.name} \${p.required ? '*' : ''} (\${p.type})</label>
          <input type="text" id="test-param-\${p.name}" placeholder="\${p.description}" value="\${p.default || ''}">
        </div>
      \`).join('');
      
      const paramsForm = document.getElementById('testParamsForm');
      if (paramsForm) {
        paramsForm.innerHTML = paramsHtml || '<p>\u6B64\u5DE5\u5177\u65E0\u9700\u53C2\u6570</p>';
      }
      
      const resultContainer = document.getElementById('testResultContainer');
      if (resultContainer) {
        resultContainer.innerHTML = '';
      }
      
      const modal = document.getElementById('testModal');
      if (modal) {
        modal.classList.add('active');
      }
    }
    
    function hideTestModal() {
      const modal = document.getElementById('testModal');
      if (modal) {
        modal.classList.remove('active');
      }
      currentTestToolId = null;
    }
    
    function runTest() {
      console.log('[MCP Panel] runTest called, toolId:', currentTestToolId);
      
      if (!currentTestToolId) {
        console.error('[MCP Panel] No tool selected for testing');
        return;
      }
      
      const registration = allTools.find(r => r.tool.id === currentTestToolId);
      if (!registration) {
        console.error('[MCP Panel] Tool not found:', currentTestToolId);
        return;
      }
      
      const params = {};
      registration.tool.parameters.forEach(p => {
        const input = document.getElementById('test-param-' + p.name);
        if (input && input.value) {
          // \u5C1D\u8BD5\u89E3\u6790JSON
          try {
            params[p.name] = JSON.parse(input.value);
          } catch {
            params[p.name] = input.value;
          }
        }
      });
      
      console.log('[MCP Panel] Testing with params:', params);
      
      // \u7981\u7528\u6309\u94AE
      const btn = document.getElementById('runTestBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '\u8FD0\u884C\u4E2D...';
      }
      
      vscode.postMessage({ type: 'testTool', toolId: currentTestToolId, params });
    }
    
    function showTestResult(result) {
      const container = document.getElementById('testResultContainer');
      if (!container) return;
      
      const className = result.success ? 'success' : 'error';
      const content = result.success 
        ? JSON.stringify(result.data, null, 2)
        : result.error?.message || '\u6267\u884C\u5931\u8D25';
      
      container.innerHTML = \`
        <div class="test-result \${className}">
          <strong>\${result.success ? '\u2713 \u6210\u529F' : '\u2717 \u5931\u8D25'}</strong> (\u8017\u65F6: \${result.stats?.duration || 0}ms)
          <pre>\${content}</pre>
        </div>
      \`;
    }
    
    // \u5BFC\u5165\u5BFC\u51FA
    function showImportModal() {
      const modal = document.getElementById('importModal');
      if (modal) {
        modal.classList.add('active');
      }
    }
    
    function hideImportModal() {
      const modal = document.getElementById('importModal');
      if (modal) {
        modal.classList.remove('active');
      }
      const importData = document.getElementById('importData');
      if (importData) {
        importData.value = '';
      }
    }
    
    function importTools() {
      const importData = document.getElementById('importData');
      if (!importData) return;
      
      const data = importData.value;
      if (!data.trim()) {
        alert('\u8BF7\u8F93\u5165\u5DE5\u5177JSON\u6570\u636E');
        return;
      }
      console.log('[MCP Panel] Importing tools...');
      vscode.postMessage({ type: 'importTools', data });
    }
    
    function exportAllTools() {
      console.log('[MCP Panel] Exporting tools...');
      vscode.postMessage({ type: 'exportTools' });
    }
    
    function downloadJson(data, filename) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    // \u914D\u7F6E
    function loadConfigToForm(config) {
      console.log('[MCP Panel] Loading config to form');
      if (!config) return;
      
      const enabledEl = document.getElementById('configEnabled');
      const maxToolsEl = document.getElementById('configMaxTools');
      const timeoutEl = document.getElementById('configTimeout');
      const logAllEl = document.getElementById('configLogAll');
      const envVarsEl = document.getElementById('configEnvVars');
      
      if (enabledEl) enabledEl.checked = config.enabled !== false;
      if (maxToolsEl) maxToolsEl.value = config.maxToolsPerRequest || 5;
      if (timeoutEl) timeoutEl.value = config.defaultTimeout || 30000;
      if (logAllEl) logAllEl.checked = config.logAllExecutions !== false;
      if (envVarsEl) envVarsEl.value = JSON.stringify(config.envVariables || {}, null, 2);
    }
    
    function saveConfig() {
      console.log('[MCP Panel] saveConfig called');
      try {
        const enabledEl = document.getElementById('configEnabled');
        const maxToolsEl = document.getElementById('configMaxTools');
        const timeoutEl = document.getElementById('configTimeout');
        const logAllEl = document.getElementById('configLogAll');
        const envVarsEl = document.getElementById('configEnvVars');
        
        if (!enabledEl || !maxToolsEl || !timeoutEl) {
          alert('\u65E0\u6CD5\u627E\u5230\u914D\u7F6E\u8868\u5355\u5143\u7D20');
          return;
        }
        
        const config = {
          enabled: enabledEl.checked,
          maxToolsPerRequest: parseInt(maxToolsEl.value) || 5,
          defaultTimeout: parseInt(timeoutEl.value) || 30000,
          logAllExecutions: logAllEl ? logAllEl.checked : true,
          envVariables: JSON.parse(envVarsEl?.value || '{}'),
        };
        
        console.log('[MCP Panel] Saving config:', config);
        vscode.postMessage({ type: 'updateConfig', config });
      } catch (e) {
        console.error('[MCP Panel] saveConfig error:', e);
        alert('\u914D\u7F6E\u683C\u5F0F\u9519\u8BEF: ' + e.message);
      }
    }
    
    // \u2705 \u4FEE\u590D\uFF1A\u5C06\u51FD\u6570\u66B4\u9732\u5230\u5168\u5C40\u4F5C\u7528\u57DF\uFF0C\u4F7Fonclick\u5C5E\u6027\u80FD\u591F\u8BBF\u95EE
    window.showTestModal = showTestModal;
    window.copyToolCommand = copyToolCommand;
    window.editTool = editTool;
    window.toggleTool = toggleTool;
    window.deleteTool = deleteTool;
    window.showTab = showTab;
    window.runTest = runTest;
    window.hideTestModal = hideTestModal;
    window.showImportModal = showImportModal;
    window.hideImportModal = hideImportModal;
    window.importTools = importTools;
    window.exportAllTools = exportAllTools;
    window.loadTemplate = loadTemplate;
    window.validateTool = validateTool;
    window.registerTool = registerTool;
    window.saveConfig = saveConfig;
    window.setFilter = setFilter;
    
    console.log('[MCP Panel] Functions exposed to global scope');
  </script>
</body>
</html>`;
      }
    };
    _MCPPanelProvider.viewType = "aiAssistant.mcpPanel";
    _MCPPanelProvider.instance = null;
    MCPPanelProvider = _MCPPanelProvider;
  }
});

// src/extension/mcp/index.ts
var mcp_exports = {};
__export(mcp_exports, {
  AutonomousAgent: () => AutonomousAgent,
  MCPAgent: () => MCPAgent,
  MCPExecutor: () => MCPExecutor,
  MCPPanelProvider: () => MCPPanelProvider,
  MCPParser: () => MCPParser,
  MCPRegistry: () => MCPRegistry,
  additionalBuiltinFunctions: () => additionalBuiltinFunctions,
  builtinFunctions: () => builtinFunctions,
  getAdditionalBuiltinTools: () => getAdditionalBuiltinTools,
  getBuiltinTools: () => getBuiltinTools
});
var init_mcp = __esm({
  "src/extension/mcp/index.ts"() {
    "use strict";
    init_types();
    init_MCPRegistry();
    init_MCPExecutor();
    init_MCPAgent();
    init_AutonomousAgent();
    init_MCPParser();
    init_MCPPanelProvider();
    init_builtins();
    init_additionalBuiltins();
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode26 = __toESM(require("vscode"));

// src/extension/chatview/ChatViewProvider.ts
var vscode22 = __toESM(require("vscode"));
init_shared();
init_ChatService();

// src/extension/ConfigManager.ts
var vscode = __toESM(require("vscode"));
init_shared();
var _ConfigManager = class _ConfigManager {
  constructor(context) {
    this.context = context;
  }
  async getApiKey(provider) {
    return this.context.secrets.get(_ConfigManager.API_KEY_PREFIX + provider);
  }
  async setApiKey(provider, apiKey) {
    if (apiKey) {
      await this.context.secrets.store(_ConfigManager.API_KEY_PREFIX + provider, apiKey);
    } else {
      await this.context.secrets.delete(_ConfigManager.API_KEY_PREFIX + provider);
    }
  }
  async hasAnyApiKey() {
    const providers = ["deepseek", "openai", "anthropic", "kimi", "openrouter"];
    for (const provider of providers) {
      const key = await this.getApiKey(provider);
      if (key)
        return true;
    }
    return false;
  }
  /**
   * 获取所有API Key的状态（是否已保存及预览）
   */
  async getAllApiKeyStatus() {
    const providers = ["deepseek", "openai", "anthropic", "kimi", "openrouter"];
    const status = {};
    for (const provider of providers) {
      const key = await this.getApiKey(provider);
      if (key) {
        status[provider] = {
          saved: true,
          preview: key.slice(0, 10)
        };
      } else {
        status[provider] = {
          saved: false,
          preview: ""
        };
      }
    }
    return status;
  }
  getModelConfig() {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    return {
      provider: config.get("defaultProvider", "deepseek"),
      model: config.get("defaultModel", "deepseek-chat"),
      temperature: config.get("temperature", 0.7),
      maxTokens: config.get("maxTokens", 8192)
      // 提高默认值，避免测试代码截断
    };
  }
  async getFullModelConfig() {
    const config = this.getModelConfig();
    config.apiKey = await this.getApiKey(config.provider);
    return config;
  }
  async updateModelConfig(updates) {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    if (updates.provider !== void 0) {
      await config.update("defaultProvider", updates.provider, vscode.ConfigurationTarget.Global);
    }
    if (updates.model !== void 0) {
      await config.update("defaultModel", updates.model, vscode.ConfigurationTarget.Global);
    }
    if (updates.temperature !== void 0) {
      await config.update("temperature", updates.temperature, vscode.ConfigurationTarget.Global);
    }
    if (updates.maxTokens !== void 0) {
      await config.update("maxTokens", updates.maxTokens, vscode.ConfigurationTarget.Global);
    }
  }
  getAvailableModels(provider) {
    return AVAILABLE_MODELS[provider] || [];
  }
  getAllModels() {
    return AVAILABLE_MODELS;
  }
  supportsVision(provider, model) {
    const models = this.getAvailableModels(provider);
    const modelInfo = models.find((m) => m.id === model);
    return (modelInfo == null ? void 0 : modelInfo.supportVision) ?? false;
  }
  getSessionConfig() {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    return {
      maxSessions: config.get("sessionHistory.maxSessions", 50),
      autoSave: config.get("sessionHistory.autoSave", true)
    };
  }
  getCompressionConfig() {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    return {
      enabled: config.get("contextCompression.enabled", true),
      maxMessages: config.get("contextCompression.maxMessages", 20)
    };
  }
  getDiagramConfig() {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    return {
      defaultFormat: config.get("diagram.defaultFormat", "mermaid")
    };
  }
  getVoiceConfig() {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    return {
      language: config.get("voice.language", "zh-CN")
    };
  }
  getTestConfig() {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    return {
      framework: config.get("testGenerator.framework", "auto")
    };
  }
  // ==================== V16 新功能配置 ====================
  /**
   * 获取语言配置
   */
  getLanguageConfig() {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    return {
      language: config.get("language", "zh-CN"),
      autoDetect: config.get("language.autoDetect", true)
    };
  }
  /**
   * 设置语言
   */
  async setLanguage(language) {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    await config.update("language", language, vscode.ConfigurationTarget.Global);
  }
  /**
   * 获取并行任务配置
   */
  getParallelConfig() {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    return {
      maxConcurrency: config.get("parallel.maxConcurrency", 3),
      stopOnError: config.get("parallel.stopOnError", false)
    };
  }
  /**
   * 设置并行任务配置
   */
  async setParallelConfig(updates) {
    const config = vscode.workspace.getConfiguration("aiAssistant");
    if (updates.maxConcurrency !== void 0) {
      await config.update("parallel.maxConcurrency", updates.maxConcurrency, vscode.ConfigurationTarget.Global);
    }
    if (updates.stopOnError !== void 0) {
      await config.update("parallel.stopOnError", updates.stopOnError, vscode.ConfigurationTarget.Global);
    }
  }
};
_ConfigManager.API_KEY_PREFIX = "aiAssistant.apiKey.";
var ConfigManager = _ConfigManager;

// src/extension/session/SessionManager.ts
var vscode2 = __toESM(require("vscode"));
init_shared();
var SESSIONS_KEY = "aiAssistant.sessions";
var CURRENT_SESSION_KEY = "aiAssistant.currentSessionId";
var SessionManager = class {
  // 用于↑↓翻历史
  constructor(context) {
    this._currentSession = null;
    this._messageHistory = [];
    this._context = context;
  }
  /**
   * 获取当前会话
   */
  get currentSession() {
    return this._currentSession;
  }
  /**
   * 获取消息历史（用于↑↓翻历史）
   */
  get messageHistory() {
    return this._messageHistory;
  }
  /**
   * 创建新会话
   * ✅ 添加日志以便调试
   */
  createSession(title) {
    const session = {
      id: generateId(),
      title: title || `\u5BF9\u8BDD ${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {}
    };
    this._currentSession = session;
    this._messageHistory = [];
    this._context.globalState.update(CURRENT_SESSION_KEY, session.id);
    console.log("[SessionManager] New session created:", session.id);
    return session;
  }
  /**
   * 加载指定会话
   * ✅ 修复：添加详细日志
   */
  async loadSession(sessionId) {
    console.log("[SessionManager] Loading session:", sessionId);
    const sessions = this._getAllSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      this._currentSession = session;
      this._messageHistory = session.messages.filter((m) => m.role === "user").map((m) => m.content);
      await this._saveCurrentSessionId(session.id);
      console.log("[SessionManager] Session loaded successfully:", session.id, "messages:", session.messages.length);
      return session;
    }
    console.log("[SessionManager] Session not found:", sessionId);
    return null;
  }
  /**
   * 继续上次对话 (-c 参数)
   * ✅ 修复：添加详细日志和错误处理
   */
  async continueLastSession() {
    try {
      const lastSessionId = this._context.globalState.get(CURRENT_SESSION_KEY);
      console.log("[SessionManager] Attempting to continue last session, ID:", lastSessionId);
      if (lastSessionId) {
        const session = await this.loadSession(lastSessionId);
        if (session) {
          console.log("[SessionManager] Successfully loaded session:", session.id, "with", session.messages.length, "messages");
          return session;
        }
        console.log("[SessionManager] Failed to load session by ID, it may have been deleted");
      }
      const sessions = this._getAllSessions();
      console.log("[SessionManager] Total sessions in storage:", sessions.length);
      if (sessions.length > 0) {
        const sorted = sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        console.log("[SessionManager] Loading most recent session:", sorted[0].id);
        return this.loadSession(sorted[0].id);
      }
      console.log("[SessionManager] No sessions found in storage");
      return null;
    } catch (error) {
      console.error("[SessionManager] Error in continueLastSession:", error);
      return null;
    }
  }
  /**
   * 保存当前会话
   * ✅ 修复：确保每次保存都更新 currentSessionId
   * ✅ 修复：返回 Promise 以确保保存完成
   */
  async saveCurrentSession() {
    if (!this._currentSession) {
      console.log("[SessionManager] No current session to save");
      return;
    }
    this._currentSession.updatedAt = Date.now();
    if (this._currentSession.messages.length > 0 && this._currentSession.title.startsWith("\u5BF9\u8BDD ")) {
      const firstUserMsg = this._currentSession.messages.find((m) => m.role === "user");
      if (firstUserMsg) {
        this._currentSession.title = truncateText(firstUserMsg.content, 30);
      }
    }
    const sessions = this._getAllSessions();
    const existingIndex = sessions.findIndex((s) => s.id === this._currentSession.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = this._currentSession;
    } else {
      sessions.push(this._currentSession);
    }
    const maxSessions = vscode2.workspace.getConfiguration("aiAssistant").get("sessionHistory.maxSessions", 50);
    if (sessions.length > maxSessions) {
      sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      sessions.splice(maxSessions);
    }
    await this._context.globalState.update(SESSIONS_KEY, sessions);
    await this._saveCurrentSessionId(this._currentSession.id);
    console.log("[SessionManager] Session saved:", this._currentSession.id, "messages:", this._currentSession.messages.length);
  }
  /**
   * 添加消息到当前会话
   * ✅ 修复：改为异步方法以确保保存完成
   */
  async addMessage(message) {
    if (!this._currentSession) {
      this.createSession();
    }
    this._currentSession.messages.push(message);
    if (message.role === "user") {
      this._messageHistory.push(message.content);
    }
    const compressionEnabled = vscode2.workspace.getConfiguration("aiAssistant").get("contextCompression.enabled", true);
    const maxMessages = vscode2.workspace.getConfiguration("aiAssistant").get("contextCompression.maxMessages", 20);
    if (compressionEnabled && this._currentSession.messages.length > maxMessages) {
      vscode2.commands.executeCommand("aiAssistant.compactContext");
    }
    await this.saveCurrentSession();
  }
  /**
   * 更新最后一条消息（用于流式响应）
   * ✅ 修复：改为异步方法，确保保存完成
   */
  async updateLastMessage(content, isComplete = false, forceSave = false) {
    if (!this._currentSession || this._currentSession.messages.length === 0)
      return;
    const lastMsg = this._currentSession.messages[this._currentSession.messages.length - 1];
    lastMsg.content = content;
    lastMsg.isStreaming = !isComplete;
    if (isComplete || forceSave) {
      await this.saveCurrentSession();
    }
  }
  /**
   * 压缩上下文
   * 将历史消息压缩为摘要，只保留最近几条
   */
  async compactContext(generateSummary) {
    if (!this._currentSession) {
      return { originalCount: 0, compressedCount: 0, savedTokens: 0 };
    }
    const keepRecent = vscode2.workspace.getConfiguration("aiAssistant").get("contextCompression.keepRecent", 4);
    const messages = this._currentSession.messages;
    const originalCount = messages.length;
    if (originalCount <= keepRecent) {
      return { originalCount, compressedCount: originalCount, savedTokens: 0 };
    }
    const originalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    const toCompress = messages.slice(0, -keepRecent);
    const toKeep = messages.slice(-keepRecent);
    const summary = await generateSummary(toCompress);
    const summaryMessage = {
      id: generateId(),
      role: "system",
      content: `[\u5BF9\u8BDD\u6458\u8981]
${summary}

---
\u4EE5\u4E0A\u662F\u4E4B\u524D\u5BF9\u8BDD\u7684\u6458\u8981\uFF0C\u8BF7\u57FA\u4E8E\u6B64\u7EE7\u7EED\u5BF9\u8BDD\u3002`,
      timestamp: Date.now()
    };
    this._currentSession.messages = [summaryMessage, ...toKeep];
    this._currentSession.metadata = {
      ...this._currentSession.metadata,
      summary
    };
    const compressedTokens = this._currentSession.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    this.saveCurrentSession();
    return {
      originalCount,
      compressedCount: this._currentSession.messages.length,
      savedTokens: originalTokens - compressedTokens
    };
  }
  /**
   * 清除当前会话消息
   */
  clearCurrentSession() {
    if (this._currentSession) {
      this._currentSession.messages = [];
      this._currentSession.updatedAt = Date.now();
      this.saveCurrentSession();
    }
  }
  /**
   * 删除会话
   */
  deleteSession(sessionId) {
    var _a;
    const sessions = this._getAllSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    this._context.globalState.update(SESSIONS_KEY, filtered);
    if (((_a = this._currentSession) == null ? void 0 : _a.id) === sessionId) {
      this._currentSession = null;
    }
  }
  /**
   * 重命名会话
   */
  renameSession(sessionId, newTitle) {
    var _a;
    const sessions = this._getAllSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      session.title = newTitle;
      session.updatedAt = Date.now();
      this._context.globalState.update(SESSIONS_KEY, sessions);
      if (((_a = this._currentSession) == null ? void 0 : _a.id) === sessionId) {
        this._currentSession.title = newTitle;
      }
      return true;
    }
    return false;
  }
  /**
   * 获取所有会话摘要列表
   */
  getSessionList() {
    const sessions = this._getAllSessions();
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt).map((s) => ({
      id: s.id,
      title: s.title,
      preview: this._getSessionPreview(s),
      messageCount: s.messages.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));
  }
  /**
   * 获取消息历史（用于↑↓键）
   */
  getMessageHistory() {
    return [...this._messageHistory];
  }
  /**
   * 获取当前会话的消息列表
   */
  getMessages() {
    var _a;
    return ((_a = this._currentSession) == null ? void 0 : _a.messages) || [];
  }
  /**
   * 移除最后一条消息
   */
  removeLastMessage() {
    if (!this._currentSession || this._currentSession.messages.length === 0) {
      return null;
    }
    const removedMessage = this._currentSession.messages.pop() || null;
    this.saveCurrentSession();
    return removedMessage;
  }
  /**
   * 通过ID移除消息
   */
  removeMessageById(messageId) {
    if (!this._currentSession) {
      return null;
    }
    const index = this._currentSession.messages.findIndex((m) => m.id === messageId);
    if (index === -1) {
      return null;
    }
    const [removedMessage] = this._currentSession.messages.splice(index, 1);
    if (removedMessage.role === "user") {
      const historyIndex = this._messageHistory.findIndex((h) => h === removedMessage.content);
      if (historyIndex !== -1) {
        this._messageHistory.splice(historyIndex, 1);
      }
    }
    this.saveCurrentSession();
    return removedMessage;
  }
  /**
   * 获取所有会话（完整对象）
   */
  getAllSessions() {
    return this._getAllSessions();
  }
  /**
   * 根据ID获取会话（不加载为当前会话）
   */
  getSessionById(sessionId) {
    const sessions = this._getAllSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  }
  /**
   * 清理旧会话
   */
  cleanupOldSessions(maxAge = 30 * 24 * 60 * 60 * 1e3) {
    const sessions = this._getAllSessions();
    const cutoff = Date.now() - maxAge;
    const filtered = sessions.filter((s) => s.updatedAt > cutoff);
    const removed = sessions.length - filtered.length;
    if (removed > 0) {
      this._context.globalState.update(SESSIONS_KEY, filtered);
    }
    return removed;
  }
  // ============================================
  // 私有方法
  // ============================================
  _getAllSessions() {
    return this._context.globalState.get(SESSIONS_KEY, []);
  }
  async _saveCurrentSessionId(sessionId) {
    await this._context.globalState.update(CURRENT_SESSION_KEY, sessionId);
  }
  _getSessionPreview(session) {
    const lastUserMsg = [...session.messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      return truncateText(lastUserMsg.content, 50);
    }
    return "\u7A7A\u5BF9\u8BDD";
  }
};

// src/extension/commands/CommandParser.ts
var vscode3 = __toESM(require("vscode"));
var path = __toESM(require("path"));
init_shared();
var CommandParser = class {
  /**
   * 解析输入
   */
  parse(input) {
    const trimmed = input.trim();
    if (!trimmed.startsWith("/") && !trimmed.startsWith("!")) {
      return null;
    }
    if (trimmed.startsWith("!")) {
      const command = trimmed.substring(1).trim();
      return {
        command: "run",
        args: [command],
        raw: trimmed,
        isValid: command.length > 0,
        error: command.length === 0 ? "\u8BF7\u6307\u5B9A\u8981\u6267\u884C\u7684\u547D\u4EE4" : void 0
      };
    }
    const parts = trimmed.substring(1).split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);
    const commandDef = this._findCommand(commandName);
    if (!commandDef) {
      return {
        command: commandName,
        args,
        raw: trimmed,
        isValid: false,
        error: `\u672A\u77E5\u547D\u4EE4: /${commandName}\uFF0C\u8F93\u5165 /help \u67E5\u770B\u5E2E\u52A9`
      };
    }
    const validation = this._validateArgs(commandDef, args);
    return {
      command: commandDef.name,
      args,
      raw: trimmed,
      isValid: validation.valid,
      error: validation.error
    };
  }
  /**
   * 获取命令补全建议
   */
  getSuggestions(input) {
    if (!input.startsWith("/")) {
      return SLASH_COMMANDS;
    }
    const partial = input.substring(1).toLowerCase();
    return SLASH_COMMANDS.filter((cmd) => {
      var _a;
      return cmd.name.startsWith(partial) || ((_a = cmd.aliases) == null ? void 0 : _a.some((a) => a.startsWith(partial)));
    });
  }
  /**
   * 获取命令帮助
   */
  getHelp(commandName) {
    if (commandName) {
      const cmd = this._findCommand(commandName);
      if (cmd) {
        return this._formatCommandHelp(cmd);
      }
      return `\u672A\u77E5\u547D\u4EE4: ${commandName}`;
    }
    let help = "\u{1F4DA} **\u53EF\u7528\u547D\u4EE4**\n\n";
    const categories = {
      session: ["clear", "compact", "resume"],
      project: ["init", "file", "search", "run", "build", "test", "git"],
      generate: ["diagram", "gentest"],
      other: ["help"]
    };
    help += "**\u4F1A\u8BDD\u7BA1\u7406**\n";
    categories.session.forEach((name) => {
      const cmd = SLASH_COMMANDS.find((c) => c.name === name);
      if (cmd)
        help += `  \`${cmd.usage}\` - ${cmd.description}
`;
    });
    help += "\n**\u9879\u76EE\u64CD\u4F5C**\n";
    categories.project.forEach((name) => {
      const cmd = SLASH_COMMANDS.find((c) => c.name === name);
      if (cmd)
        help += `  \`${cmd.usage}\` - ${cmd.description}
`;
    });
    help += "\n**\u751F\u6210\u529F\u80FD**\n";
    categories.generate.forEach((name) => {
      const cmd = SLASH_COMMANDS.find((c) => c.name === name);
      if (cmd)
        help += `  \`${cmd.usage}\` - ${cmd.description}
`;
    });
    help += "\n**\u5FEB\u6377\u952E**\n";
    help += "  `\u2191` / `\u2193` - \u7FFB\u9605\u5386\u53F2\u6D88\u606F\n";
    help += "  `Tab` - \u547D\u4EE4/\u8DEF\u5F84\u8865\u5168\n";
    help += "  `Alt+Enter` - \u8F93\u5165\u6362\u884C\n";
    help += "  `ESC` - \u505C\u6B62\u5F53\u524D\u4EFB\u52A1\n";
    help += "  `Ctrl+C` - \u53D6\u6D88\u8F93\u5165\n";
    return help;
  }
  /**
   * 路径补全
   */
  async getPathCompletions(partial) {
    var _a;
    const workspaceFolder = (_a = vscode3.workspace.workspaceFolders) == null ? void 0 : _a[0];
    if (!workspaceFolder)
      return [];
    try {
      const basePath = path.dirname(partial) || ".";
      const prefix = path.basename(partial);
      const fullBasePath = path.isAbsolute(basePath) ? basePath : path.join(workspaceFolder.uri.fsPath, basePath);
      const entries = await vscode3.workspace.fs.readDirectory(
        vscode3.Uri.file(fullBasePath)
      );
      return entries.filter(([name]) => name.startsWith(prefix)).map(([name, type]) => {
        const fullPath = path.join(basePath, name);
        return type === vscode3.FileType.Directory ? fullPath + "/" : fullPath;
      }).slice(0, 10);
    } catch {
      return [];
    }
  }
  // ============================================
  // 私有方法
  // ============================================
  _findCommand(nameOrAlias) {
    return SLASH_COMMANDS.find(
      (cmd) => {
        var _a;
        return cmd.name === nameOrAlias || ((_a = cmd.aliases) == null ? void 0 : _a.includes(nameOrAlias));
      }
    );
  }
  _validateArgs(cmd, args) {
    if (!cmd.args) {
      return { valid: true };
    }
    const requiredArgs = cmd.args.filter((a) => a.required);
    if (args.length < requiredArgs.length) {
      const missing = requiredArgs[args.length];
      return {
        valid: false,
        error: `\u7F3A\u5C11\u53C2\u6570: ${missing.name} - ${missing.description}`
      };
    }
    return { valid: true };
  }
  _formatCommandHelp(cmd) {
    var _a, _b;
    let help = `**/${cmd.name}** - ${cmd.description}

`;
    help += `\u7528\u6CD5: \`${cmd.usage}\`
`;
    if ((_a = cmd.aliases) == null ? void 0 : _a.length) {
      help += `\u522B\u540D: ${cmd.aliases.map((a) => `\`/${a}\``).join(", ")}
`;
    }
    if ((_b = cmd.args) == null ? void 0 : _b.length) {
      help += "\n\u53C2\u6570:\n";
      cmd.args.forEach((arg) => {
        const required = arg.required ? "(\u5FC5\u9700)" : "(\u53EF\u9009)";
        help += `  - \`${arg.name}\` ${required}: ${arg.description}
`;
      });
    }
    return help;
  }
};

// src/extension/diagram/DiagramGenerator.ts
var vscode4 = __toESM(require("vscode"));
init_shared();
var DIAGRAMS_KEY = "aiAssistant.diagrams";
var DiagramGenerator = class {
  constructor(context) {
    this._context = context;
  }
  /**
   * 生成 AI 提示词
   */
  generatePrompt(type, description, code) {
    const format = this._getDefaultFormat();
    let prompt = `\u8BF7\u751F\u6210\u4E00\u4E2A ${this._getTypeDisplayName(type)} (${format} \u683C\u5F0F)\u3002

`;
    if (description) {
      prompt += `\u9700\u6C42\u63CF\u8FF0\uFF1A${description}

`;
    }
    if (code) {
      prompt += `\u57FA\u4E8E\u4EE5\u4E0B\u4EE3\u7801\uFF1A
\`\`\`
${code}
\`\`\`

`;
    }
    const syntaxGuide = this._getSyntaxGuide(type);
    prompt += `\u8BF7\u6CE8\u610F\uFF1A
1. \u53EA\u8FD4\u56DE ${format} \u4EE3\u7801\uFF0C\u4E0D\u8981\u6DFB\u52A0\u989D\u5916\u89E3\u91CA
2. \u4EE3\u7801\u9700\u8981\u7528 \`\`\`${format} \u548C \`\`\` \u5305\u88F9
3. \u786E\u4FDD\u8BED\u6CD5\u6B63\u786E\uFF0C\u53EF\u4EE5\u76F4\u63A5\u6E32\u67D3
4. \u4F7F\u7528\u4E2D\u6587\u6807\u7B7E
5. \u4E25\u683C\u9075\u5FAA Mermaid \u5B98\u65B9\u8BED\u6CD5

${syntaxGuide}

\u53C2\u8003\u6A21\u677F\uFF1A
\`\`\`${format}
${DIAGRAM_TEMPLATES[type]}
\`\`\`

\u{1F4DA} \u5B98\u65B9\u8BED\u6CD5\u53C2\u8003\uFF1Ahttps://mermaid.js.org/syntax/${this._getSyntaxDocPath(type)}.html`;
    return prompt;
  }
  /**
   * 获取类型特定的语法指南
   */
  _getSyntaxGuide(type) {
    const guides = {
      flowchart: `Mermaid \u6D41\u7A0B\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u4F7F\u7528 flowchart TB/LR/BT/RL \u58F0\u660E\u65B9\u5411
- \u8282\u70B9\u5B9A\u4E49\uFF1AA[\u65B9\u5F62] B(\u5706\u89D2) C{\u83F1\u5F62} D((\u5706\u5F62)) E([\u4F53\u80B2\u573A\u5F62])
- \u8FDE\u63A5\u7EBF\uFF1AA --> B (\u7BAD\u5934) A --- B (\u5B9E\u7EBF) A -.-> B (\u865A\u7EBF) A ==> B (\u7C97\u7EBF)
- \u5B50\u56FE\uFF1Asubgraph \u540D\u79F0 ... end
- \u6CE8\u610F\uFF1A\u8282\u70B9\u6587\u672C\u4E2D\u4E0D\u8981\u6709\u7279\u6B8A\u5B57\u7B26 [ ] { } ( ) < >`,
      sequence: `Mermaid \u65F6\u5E8F\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u4F7F\u7528 sequenceDiagram \u58F0\u660E
- \u53C2\u4E0E\u8005\uFF1Aparticipant A as \u522B\u540D
- \u6D88\u606F\uFF1AA->>B: \u6D88\u606F\u6587\u672C (\u5B9E\u7EBF\u7BAD\u5934) A-->>B: (\u865A\u7EBF\u7BAD\u5934)
- \u6FC0\u6D3B\uFF1Aactivate A / deactivate A \u6216 A->>+B / A->>-B
- \u5FAA\u73AF/\u6761\u4EF6\uFF1Aloop/alt/opt ... end
- \u6CE8\u610F\uFF1A\u6D88\u606F\u6587\u672C\u4E0D\u8981\u6709\u7279\u6B8A\u5B57\u7B26`,
      class: `Mermaid \u7C7B\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u4F7F\u7528 classDiagram \u58F0\u660E
- \u7C7B\u5B9A\u4E49\uFF1Aclass ClassName { +method() -field }
- \u5173\u7CFB\uFF1AA <|-- B (\u7EE7\u627F) A *-- B (\u7EC4\u5408) A o-- B (\u805A\u5408)
- \u6CE8\u610F\uFF1A\u65B9\u6CD5\u548C\u5C5E\u6027\u524D\u7528 + - # \u8868\u793A\u8BBF\u95EE\u7EA7\u522B`,
      state: `Mermaid \u72B6\u6001\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u4F7F\u7528 stateDiagram-v2 \u58F0\u660E
- \u72B6\u6001\uFF1Astate "\u63CF\u8FF0" as s1
- \u8F6C\u6362\uFF1As1 --> s2 : \u4E8B\u4EF6
- \u7279\u6B8A\u72B6\u6001\uFF1A[*] --> s1 (\u5F00\u59CB) s1 --> [*] (\u7ED3\u675F)`,
      er: `Mermaid ER\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u4F7F\u7528 erDiagram \u58F0\u660E
- \u5173\u7CFB\uFF1AA ||--o{ B : "\u5173\u7CFB"
- \u57FA\u6570\uFF1A|o (\u96F6\u6216\u4E00) || (\u6070\u597D\u4E00) }o (\u96F6\u6216\u591A) }| (\u4E00\u6216\u591A)`,
      gantt: `Mermaid \u7518\u7279\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u4F7F\u7528 gantt \u58F0\u660E
- \u5FC5\u987B\u6709 title \u548C dateFormat
- \u4EFB\u52A1\uFF1A\u4EFB\u52A1\u540D :\u6807\u8BC6, \u5F00\u59CB\u65E5\u671F, \u6301\u7EED\u65F6\u95F4
- section \u5206\u7EC4\u4EFB\u52A1`,
      pie: `Mermaid \u997C\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u4F7F\u7528 pie \u6216 pie showData \u58F0\u660E
- \u53EF\u9009 title \u6807\u9898
- \u6570\u636E\uFF1A"\u6807\u7B7E" : \u6570\u503C`,
      mindmap: `Mermaid \u601D\u7EF4\u5BFC\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u4F7F\u7528 mindmap \u58F0\u660E
- \u7F29\u8FDB\u8868\u793A\u5C42\u7EA7
- \u6839\u8282\u70B9\u65E0\u7F29\u8FDB\uFF0C\u5B50\u8282\u70B9\u7528\u7A7A\u683C\u7F29\u8FDB`,
      architecture: `Mermaid \u67B6\u6784\u56FE\u8BED\u6CD5\u8981\u70B9\uFF1A
- \u63A8\u8350\u4F7F\u7528 flowchart TB \u914D\u5408 subgraph
- \u4F7F\u7528\u591A\u4E2A subgraph \u5206\u5C42\u8868\u793A\u67B6\u6784
- \u7528\u4E0D\u540C\u5F62\u72B6\u8282\u70B9\u533A\u5206\u7C7B\u578B`
    };
    return guides[type] || "";
  }
  /**
   * 获取语法文档路径
   */
  _getSyntaxDocPath(type) {
    const paths = {
      flowchart: "flowchart",
      sequence: "sequenceDiagram",
      class: "classDiagram",
      state: "stateDiagram",
      er: "entityRelationshipDiagram",
      gantt: "gantt",
      pie: "pie",
      mindmap: "mindmap",
      architecture: "flowchart"
    };
    return paths[type] || "flowchart";
  }
  /**
   * 从 AI 响应中提取图表代码
   */
  extractDiagramCode(response) {
    const format = this._getDefaultFormat();
    const patterns = [
      new RegExp(`\`\`\`${format}\\s*([\\s\\S]*?)\`\`\``, "i"),
      new RegExp(`\`\`\`mermaid\\s*([\\s\\S]*?)\`\`\``, "i"),
      new RegExp(`\`\`\`\\s*([\\s\\S]*?)\`\`\``, "i")
    ];
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    if (this._looksLikeDiagramCode(response)) {
      return response.trim();
    }
    return null;
  }
  /**
   * 创建图表对象
   */
  createDiagram(type, code, title, sessionId) {
    const diagram = {
      id: generateId(),
      title: title || `${this._getTypeDisplayName(type)} - ${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}`,
      type,
      format: this._getDefaultFormat(),
      code,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sessionId
    };
    this._saveDiagram(diagram);
    return diagram;
  }
  /**
   * 更新图表
   */
  updateDiagram(diagramId, code) {
    const diagrams = this._getAllDiagrams();
    const index = diagrams.findIndex((d) => d.id === diagramId);
    if (index === -1)
      return null;
    diagrams[index].code = code;
    diagrams[index].updatedAt = Date.now();
    this._context.globalState.update(DIAGRAMS_KEY, diagrams);
    return diagrams[index];
  }
  /**
   * 获取图表
   */
  getDiagram(diagramId) {
    const diagrams = this._getAllDiagrams();
    return diagrams.find((d) => d.id === diagramId) || null;
  }
  /**
   * 获取所有图表
   */
  getAllDiagrams() {
    return this._getAllDiagrams().sort((a, b) => b.updatedAt - a.updatedAt);
  }
  /**
   * 删除图表
   */
  deleteDiagram(diagramId) {
    const diagrams = this._getAllDiagrams();
    const filtered = diagrams.filter((d) => d.id !== diagramId);
    if (filtered.length === diagrams.length)
      return false;
    this._context.globalState.update(DIAGRAMS_KEY, filtered);
    return true;
  }
  /**
   * 重命名图表
   */
  renameDiagram(diagramId, newTitle) {
    const diagrams = this._getAllDiagrams();
    const index = diagrams.findIndex((d) => d.id === diagramId);
    if (index === -1)
      return false;
    diagrams[index].title = newTitle;
    diagrams[index].updatedAt = Date.now();
    this._context.globalState.update(DIAGRAMS_KEY, diagrams);
    return true;
  }
  /**
   * 导出图表
   */
  async exportDiagram(diagram, format) {
    switch (format) {
      case "md":
        return this._exportAsMarkdown(diagram);
      case "html":
        return this._exportAsHtml(diagram);
      case "svg":
      case "png":
        throw new Error(`${format.toUpperCase()} \u5BFC\u51FA\u9700\u8981\u5728\u524D\u7AEF\u5B8C\u6210`);
      default:
        throw new Error(`\u4E0D\u652F\u6301\u7684\u5BFC\u51FA\u683C\u5F0F: ${format}`);
    }
  }
  /**
   * 验证图表代码
   */
  validateCode(code) {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: "\u4EE3\u7801\u4E0D\u80FD\u4E3A\u7A7A" };
    }
    const trimmed = code.trim();
    const validStarts = [
      "flowchart",
      "graph",
      "sequenceDiagram",
      "classDiagram",
      "stateDiagram",
      "erDiagram",
      "gantt",
      "pie",
      "mindmap",
      "journey",
      "gitGraph",
      "C4Context",
      "timeline"
    ];
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    if (!validStarts.some((s) => firstWord.startsWith(s.toLowerCase()))) {
      return {
        valid: false,
        error: `\u65E0\u6548\u7684\u56FE\u8868\u7C7B\u578B\u3002\u652F\u6301\u7684\u7C7B\u578B: ${validStarts.join(", ")}`
      };
    }
    const brackets = { "(": 0, "[": 0, "{": 0 };
    for (const char of trimmed) {
      if (char === "(")
        brackets["("]++;
      if (char === ")")
        brackets["("]--;
      if (char === "[")
        brackets["["]++;
      if (char === "]")
        brackets["["]--;
      if (char === "{")
        brackets["{"]++;
      if (char === "}")
        brackets["{"]--;
    }
    if (brackets["("] !== 0 || brackets["["] !== 0 || brackets["{"] !== 0) {
      return { valid: false, error: "\u62EC\u53F7\u4E0D\u5339\u914D" };
    }
    return { valid: true };
  }
  /**
   * 获取图表模板
   */
  getTemplate(type) {
    return DIAGRAM_TEMPLATES[type] || DIAGRAM_TEMPLATES.flowchart;
  }
  /**
   * 生成项目架构图提示词
   */
  generateArchitecturePrompt(projectInfo) {
    var _a;
    let prompt = `\u8BF7\u6839\u636E\u4EE5\u4E0B\u9879\u76EE\u4FE1\u606F\u751F\u6210\u67B6\u6784\u56FE (Mermaid \u683C\u5F0F)\uFF1A

\u9879\u76EE\u540D\u79F0\uFF1A${projectInfo.name}
\u9879\u76EE\u7C7B\u578B\uFF1A${projectInfo.type}

\u9879\u76EE\u7ED3\u6784\uFF1A
\`\`\`
${projectInfo.structure}
\`\`\`
`;
    if ((_a = projectInfo.dependencies) == null ? void 0 : _a.length) {
      prompt += `
\u4E3B\u8981\u4F9D\u8D56\uFF1A${projectInfo.dependencies.join(", ")}
`;
    }
    prompt += `
\u8BF7\u751F\u6210\u4E00\u4E2A\u6E05\u6670\u7684\u67B6\u6784\u56FE\uFF0C\u5305\u542B\uFF1A
1. \u4E3B\u8981\u6A21\u5757/\u7EC4\u4EF6
2. \u6A21\u5757\u95F4\u7684\u4F9D\u8D56\u5173\u7CFB
3. \u6570\u636E\u6D41\u5411
4. \u4F7F\u7528\u4E2D\u6587\u6807\u7B7E

\u4F7F\u7528 subgraph \u5206\u7EC4\u76F8\u5173\u7EC4\u4EF6\uFF0C\u7BAD\u5934\u8868\u793A\u4F9D\u8D56/\u6570\u636E\u6D41\u5411\u3002
\u53EA\u8FD4\u56DE Mermaid \u4EE3\u7801\uFF0C\u7528 \`\`\`mermaid \u548C \`\`\` \u5305\u88F9\u3002`;
    return prompt;
  }
  /**
   * 从代码生成流程图提示词
   */
  generateFlowchartFromCodePrompt(code, language) {
    return `\u8BF7\u5206\u6790\u4EE5\u4E0B ${language} \u4EE3\u7801\uFF0C\u751F\u6210\u5BF9\u5E94\u7684\u6D41\u7A0B\u56FE (Mermaid \u683C\u5F0F)\uFF1A

\`\`\`${language}
${code}
\`\`\`

\u8981\u6C42\uFF1A
1. \u5C55\u793A\u4EE3\u7801\u7684\u6267\u884C\u6D41\u7A0B
2. \u5305\u542B\u6761\u4EF6\u5224\u65AD\u3001\u5FAA\u73AF\u7B49\u63A7\u5236\u6D41
3. \u4F7F\u7528\u4E2D\u6587\u6807\u7B7E
4. \u53EA\u8FD4\u56DE Mermaid \u4EE3\u7801\uFF0C\u7528 \`\`\`mermaid \u548C \`\`\` \u5305\u88F9`;
  }
  // ============================================
  // 私有方法
  // ============================================
  _getDefaultFormat() {
    return vscode4.workspace.getConfiguration("aiAssistant").get("diagram.defaultFormat", "mermaid");
  }
  _getTypeDisplayName(type) {
    const names = {
      flowchart: "\u6D41\u7A0B\u56FE",
      sequence: "\u65F6\u5E8F\u56FE",
      class: "\u7C7B\u56FE",
      state: "\u72B6\u6001\u56FE",
      er: "ER\u56FE",
      gantt: "\u7518\u7279\u56FE",
      pie: "\u997C\u56FE",
      mindmap: "\u601D\u7EF4\u5BFC\u56FE",
      architecture: "\u67B6\u6784\u56FE"
    };
    return names[type] || type;
  }
  _getAllDiagrams() {
    return this._context.globalState.get(DIAGRAMS_KEY, []);
  }
  _saveDiagram(diagram) {
    const diagrams = this._getAllDiagrams();
    diagrams.push(diagram);
    if (diagrams.length > 100) {
      diagrams.sort((a, b) => b.updatedAt - a.updatedAt);
      diagrams.splice(100);
    }
    this._context.globalState.update(DIAGRAMS_KEY, diagrams);
  }
  _looksLikeDiagramCode(text) {
    const indicators = [
      "flowchart",
      "graph",
      "sequenceDiagram",
      "classDiagram",
      "stateDiagram",
      "erDiagram",
      "gantt",
      "pie",
      "mindmap",
      "-->",
      "---",
      "-.->"
    ];
    return indicators.some((ind) => text.includes(ind));
  }
  _exportAsMarkdown(diagram) {
    return `# ${diagram.title}

\`\`\`mermaid
${diagram.code}
\`\`\`

---
*\u751F\u6210\u65F6\u95F4: ${new Date(diagram.createdAt).toLocaleString("zh-CN")}*
`;
  }
  _exportAsHtml(diagram) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${diagram.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
    .mermaid {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>${diagram.title}</h1>
  <div class="mermaid">
${diagram.code}
  </div>
  <script>mermaid.initialize({ startOnLoad: true });</script>
</body>
</html>`;
  }
};

// src/extension/chatview/ChatViewProvider.ts
init_TestGenerator();

// src/extension/services/AutoFixService.ts
init_ChatService();
var AutoFixService = class {
  constructor(context) {
    this._fixHistory = [];
    this._maxRetries = 3;
    this._configManager = new ConfigManager(context);
  }
  /**
   * 初始化 ChatService
   */
  async _ensureChatService() {
    if (!this._chatService) {
      const config = await this._configManager.getFullModelConfig();
      if (!config.apiKey) {
        return false;
      }
      this._chatService = new ChatService(config);
    }
    return true;
  }
  /**
   * 自动修复图表代码
   */
  async fixDiagram(code, error) {
    if (!await this._ensureChatService()) {
      return { success: false, error: "\u8BF7\u5148\u914D\u7F6E API Key" };
    }
    const prompt = this._buildDiagramFixPrompt(code, error);
    return await this._executeFixWithRetry(prompt, "diagram", code);
  }
  /**
   * 流式修复图表代码
   */
  async fixDiagramStreaming(code, error, callbacks) {
    if (!await this._ensureChatService()) {
      callbacks.onError(new Error("\u8BF7\u5148\u914D\u7F6E API Key"));
      return;
    }
    const prompt = this._buildDiagramFixPrompt(code, error);
    await this._executeStreamingFix(prompt, "diagram", callbacks);
  }
  /**
   * 流式修复测试代码
   */
  async fixTestStreaming(code, error, framework, language, callbacks) {
    if (!await this._ensureChatService()) {
      callbacks.onError(new Error("\u8BF7\u5148\u914D\u7F6E API Key"));
      return;
    }
    const prompt = this._buildTestFixPrompt(code, error, framework, language);
    await this._executeStreamingFix(prompt, "test", callbacks);
  }
  /**
   * 流式修复通用代码
   */
  async fixCodeStreaming(code, error, language, context, callbacks) {
    if (!await this._ensureChatService()) {
      callbacks.onError(new Error("\u8BF7\u5148\u914D\u7F6E API Key"));
      return;
    }
    const prompt = this._buildCodeFixPrompt(code, error, language, context);
    await this._executeStreamingFix(prompt, "code", callbacks);
  }
  /**
   * 执行流式修复
   */
  async _executeStreamingFix(prompt, type, callbacks) {
    let fullResponse = "";
    let lastSafePoint = 0;
    try {
      await this._chatService.sendMessage(
        [{ id: "0", role: "user", content: prompt, timestamp: Date.now() }],
        {
          onToken: (token) => {
            fullResponse += token;
            const safePoint = this._findSafeMarkdownBreak(fullResponse);
            if (safePoint > lastSafePoint + 20) {
              callbacks.onChunk(fullResponse.slice(lastSafePoint, safePoint), fullResponse);
              lastSafePoint = safePoint;
            }
          },
          onComplete: () => {
            if (lastSafePoint < fullResponse.length) {
              callbacks.onChunk(fullResponse.slice(lastSafePoint), fullResponse);
            }
            const fixedCode = this._extractFixedCode(fullResponse, type);
            const explanation = this._extractExplanation(fullResponse);
            if (fixedCode) {
              callbacks.onComplete({
                success: true,
                fixedCode,
                explanation
              });
            } else {
              callbacks.onComplete({
                success: false,
                error: "\u65E0\u6CD5\u4ECE\u54CD\u5E94\u4E2D\u63D0\u53D6\u4FEE\u590D\u540E\u7684\u4EE3\u7801"
              });
            }
          },
          onError: (error) => {
            if (fullResponse.length > 0) {
              const fixedCode = this._extractFixedCode(fullResponse, type);
              if (fixedCode) {
                callbacks.onComplete({
                  success: true,
                  fixedCode,
                  explanation: "\uFF08\u54CD\u5E94\u88AB\u4E2D\u65AD\uFF0C\u4F46\u5DF2\u63D0\u53D6\u5230\u4EE3\u7801\uFF09"
                });
                return;
              }
            }
            callbacks.onError(error);
          }
        }
      );
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  /**
   * 找到安全的 Markdown 截断点
   */
  _findSafeMarkdownBreak(content) {
    const codeBlockStarts = (content.match(/```/g) || []).length;
    const isInCodeBlock = codeBlockStarts % 2 === 1;
    if (isInCodeBlock) {
      const lastNewline2 = content.lastIndexOf("\n");
      return lastNewline2 > 0 ? lastNewline2 : 0;
    }
    const lastCodeBlockEnd = content.lastIndexOf("```\n");
    if (lastCodeBlockEnd > 0) {
      const afterBlock = content.indexOf("\n", lastCodeBlockEnd + 4);
      if (afterBlock > lastCodeBlockEnd)
        return afterBlock;
      return lastCodeBlockEnd + 4;
    }
    const lastParagraph = content.lastIndexOf("\n\n");
    if (lastParagraph > 0)
      return lastParagraph + 2;
    const lastNewline = content.lastIndexOf("\n");
    if (lastNewline > 0)
      return lastNewline + 1;
    return content.length;
  }
  /**
   * 自动修复测试代码
   */
  async fixTest(code, error, framework, language) {
    if (!await this._ensureChatService()) {
      return { success: false, error: "\u8BF7\u5148\u914D\u7F6E API Key" };
    }
    const prompt = this._buildTestFixPrompt(code, error, framework, language);
    return await this._executeFixWithRetry(prompt, "test", code);
  }
  /**
   * 自动修复通用代码
   */
  async fixCode(code, error, language, context) {
    if (!await this._ensureChatService()) {
      return { success: false, error: "\u8BF7\u5148\u914D\u7F6E API Key" };
    }
    const prompt = this._buildCodeFixPrompt(code, error, language, context);
    return await this._executeFixWithRetry(prompt, "code", code);
  }
  /**
   * 智能诊断错误
   */
  async diagnoseError(error, codeContext) {
    if (!await this._ensureChatService()) {
      return {
        diagnosis: "\u65E0\u6CD5\u8BCA\u65AD",
        possibleCauses: ["\u8BF7\u5148\u914D\u7F6E API Key"],
        suggestedFixes: []
      };
    }
    const prompt = `\u4F5C\u4E3A\u4EE3\u7801\u8BCA\u65AD\u4E13\u5BB6\uFF0C\u5206\u6790\u4EE5\u4E0B\u9519\u8BEF\uFF1A

**\u9519\u8BEF\u4FE1\u606F\uFF1A**
\`\`\`
${error}
\`\`\`

${codeContext ? `**\u76F8\u5173\u4EE3\u7801\u4E0A\u4E0B\u6587\uFF1A**
\`\`\`
${codeContext}
\`\`\`
` : ""}

\u8BF7\u63D0\u4F9B\uFF1A
1. \u9519\u8BEF\u8BCA\u65AD\uFF08\u7B80\u6D01\u8BF4\u660E\u95EE\u9898\u672C\u8D28\uFF09
2. \u53EF\u80FD\u539F\u56E0\uFF08\u5217\u51FA2-3\u4E2A\u53EF\u80FD\u7684\u539F\u56E0\uFF09
3. \u4FEE\u590D\u5EFA\u8BAE\uFF08\u5177\u4F53\u7684\u4FEE\u590D\u6B65\u9AA4\uFF09

\u8BF7\u7528\u4EE5\u4E0BJSON\u683C\u5F0F\u8FD4\u56DE\uFF1A
\`\`\`json
{
  "diagnosis": "\u8BCA\u65AD\u7ED3\u679C",
  "possibleCauses": ["\u539F\u56E01", "\u539F\u56E02"],
  "suggestedFixes": ["\u4FEE\u590D\u6B65\u9AA41", "\u4FEE\u590D\u6B65\u9AA42"]
}
\`\`\``;
    try {
      let response = "";
      await this._chatService.sendMessage(
        [{ id: "0", role: "user", content: prompt, timestamp: Date.now() }],
        {
          onToken: (token) => {
            response += token;
          },
          onComplete: () => {
          },
          onError: () => {
          }
        }
      );
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return {
        diagnosis: "\u65E0\u6CD5\u89E3\u6790\u8BCA\u65AD\u7ED3\u679C",
        possibleCauses: [],
        suggestedFixes: []
      };
    } catch {
      return {
        diagnosis: "\u8BCA\u65AD\u8FC7\u7A0B\u51FA\u9519",
        possibleCauses: [],
        suggestedFixes: []
      };
    }
  }
  /**
   * 获取修复历史
   */
  getFixHistory() {
    return this._fixHistory.slice(-20);
  }
  /**
   * 清除修复历史
   */
  clearFixHistory() {
    this._fixHistory = [];
  }
  // ==================== 私有方法 ====================
  /**
   * 构建图表修复提示
   */
  _buildDiagramFixPrompt(code, error) {
    const diagramType = this._detectDiagramType(code);
    const syntaxDoc = this._getMermaidSyntaxDoc(diagramType);
    return `\u4F60\u662F\u4E00\u4E2A Mermaid \u56FE\u8868\u4E13\u5BB6\u3002\u4EE5\u4E0B Mermaid \u4EE3\u7801\u5B58\u5728\u8BED\u6CD5\u9519\u8BEF\uFF0C\u8BF7\u4FEE\u590D\u5B83\u3002

**\u9519\u8BEF\u4EE3\u7801\uFF1A**
\`\`\`mermaid
${code}
\`\`\`

**\u9519\u8BEF\u4FE1\u606F\uFF1A**
${error}

**Mermaid \u8BED\u6CD5\u8981\u70B9 (${diagramType})\uFF1A**
${syntaxDoc}

**\u5B98\u65B9\u8BED\u6CD5\u53C2\u8003\uFF1A** https://mermaid.js.org/syntax/${this._getDiagramSyntaxPath(diagramType)}.html

**\u4FEE\u590D\u8981\u6C42\uFF1A**
1. \u5206\u6790\u9519\u8BEF\u539F\u56E0
2. \u4E25\u683C\u9075\u5FAA Mermaid \u5B98\u65B9\u8BED\u6CD5\u89C4\u8303
3. \u4FEE\u590D\u8BED\u6CD5\u95EE\u9898\uFF0C\u4FDD\u6301\u539F\u6709\u56FE\u8868\u7ED3\u6784\u548C\u610F\u56FE
4. \u786E\u4FDD\u4FEE\u590D\u540E\u7684\u4EE3\u7801\u53EF\u4EE5\u6B63\u786E\u6E32\u67D3
5. \u8282\u70B9\u6587\u672C\u4E2D\u907F\u514D\u4F7F\u7528\u7279\u6B8A\u5B57\u7B26 [ ] { } ( ) < > | # ; \u7B49
6. \u5982\u679C\u8282\u70B9\u6587\u672C\u9700\u8981\u5305\u542B\u7279\u6B8A\u5B57\u7B26\uFF0C\u8BF7\u7528\u5F15\u53F7\u5305\u88F9

\u8BF7\u6309\u4EE5\u4E0B\u683C\u5F0F\u8FD4\u56DE\uFF1A

**\u9519\u8BEF\u5206\u6790\uFF1A**
[\u7B80\u8981\u8BF4\u660E\u9519\u8BEF\u539F\u56E0]

**\u4FEE\u590D\u540E\u4EE3\u7801\uFF1A**
\`\`\`mermaid
[\u4FEE\u590D\u540E\u7684\u5B8C\u6574\u4EE3\u7801]
\`\`\`

**\u4FEE\u6539\u8BF4\u660E\uFF1A**
[\u8BF4\u660E\u505A\u4E86\u54EA\u4E9B\u4FEE\u6539]`;
  }
  /**
   * 检测 Mermaid 图表类型
   */
  _detectDiagramType(code) {
    const trimmed = code.trim().toLowerCase();
    if (trimmed.startsWith("flowchart") || trimmed.startsWith("graph"))
      return "flowchart";
    if (trimmed.startsWith("sequencediagram"))
      return "sequence";
    if (trimmed.startsWith("classdiagram"))
      return "class";
    if (trimmed.startsWith("statediagram"))
      return "state";
    if (trimmed.startsWith("erdiagram"))
      return "er";
    if (trimmed.startsWith("gantt"))
      return "gantt";
    if (trimmed.startsWith("pie"))
      return "pie";
    if (trimmed.startsWith("mindmap"))
      return "mindmap";
    return "flowchart";
  }
  /**
   * 获取 Mermaid 语法文档路径
   */
  _getDiagramSyntaxPath(type) {
    const paths = {
      flowchart: "flowchart",
      sequence: "sequenceDiagram",
      class: "classDiagram",
      state: "stateDiagram",
      er: "entityRelationshipDiagram",
      gantt: "gantt",
      pie: "pie",
      mindmap: "mindmap"
    };
    return paths[type] || "flowchart";
  }
  /**
   * 获取 Mermaid 语法说明
   */
  _getMermaidSyntaxDoc(type) {
    const docs = {
      flowchart: `- \u4F7F\u7528 flowchart TB/LR/BT/RL \u58F0\u660E\u65B9\u5411 (TB=\u4E0A\u5230\u4E0B, LR=\u5DE6\u5230\u53F3)
- \u8282\u70B9\u5F62\u72B6: A[\u65B9\u5F62] B(\u5706\u89D2) C{\u83F1\u5F62} D((\u5706\u5F62)) E>\u65D7\u5E1C\u5F62] F([\u4F53\u80B2\u573A\u5F62])
- \u8FDE\u63A5\u7EBF: A --> B (\u7BAD\u5934) A --- B (\u5B9E\u7EBF) A -.-> B (\u865A\u7EBF) A ==> B (\u7C97\u7BAD\u5934)
- \u8FDE\u63A5\u6587\u5B57: A -->|\u6587\u5B57| B \u6216 A -- \u6587\u5B57 --> B
- \u5B50\u56FE: subgraph \u6807\u9898 ... end
- \u6CE8\u610F: \u8282\u70B9ID\u53EA\u80FD\u662F\u5B57\u6BCD\u6570\u5B57\u4E0B\u5212\u7EBF\uFF0C\u6587\u672C\u7528[]\u5305\u88F9`,
      sequence: `- \u4F7F\u7528 sequenceDiagram \u58F0\u660E
- \u53C2\u4E0E\u8005: participant A as \u522B\u540D
- \u6D88\u606F\u7C7B\u578B: A->>B (\u5B9E\u7EBF\u7BAD\u5934) A-->>B (\u865A\u7EBF\u7BAD\u5934) A-)B (\u5F02\u6B65)
- \u6FC0\u6D3B: activate A / deactivate A \u6216 A->>+B: / A->>-B:
- \u6CE8\u91CA: Note right of A: \u5185\u5BB9
- \u5FAA\u73AF/\u6761\u4EF6: loop/alt/opt/par ... end`,
      class: `- \u4F7F\u7528 classDiagram \u58F0\u660E
- \u7C7B\u5B9A\u4E49: class \u7C7B\u540D { +\u516C\u6709\u65B9\u6CD5() -\u79C1\u6709\u5C5E\u6027 #\u4FDD\u62A4 ~\u5305 }
- \u5173\u7CFB: A <|-- B (\u7EE7\u627F) A *-- B (\u7EC4\u5408) A o-- B (\u805A\u5408) A --> B (\u5173\u8054)
- \u57FA\u6570: "1" -- "*" \u8868\u793A\u4E00\u5BF9\u591A`,
      state: `- \u4F7F\u7528 stateDiagram-v2 \u58F0\u660E
- \u72B6\u6001\u5B9A\u4E49: state "\u63CF\u8FF0" as s1
- \u8F6C\u6362: s1 --> s2 \u6216 s1 --> s2 : \u4E8B\u4EF6
- \u7279\u6B8A: [*] --> s1 (\u5F00\u59CB) s1 --> [*] (\u7ED3\u675F)
- \u590D\u5408: state \u7236\u72B6\u6001 { ... }`,
      er: `- \u4F7F\u7528 erDiagram \u58F0\u660E
- \u5B9E\u4F53\u548C\u5173\u7CFB: A ||--o{ B : "\u6807\u7B7E"
- \u57FA\u6570\u7B26\u53F7: || (\u6070\u597D\u4E00\u4E2A) |o (\u96F6\u6216\u4E00\u4E2A) }| (\u4E00\u4E2A\u6216\u591A\u4E2A) }o (\u96F6\u6216\u591A\u4E2A)
- \u5C5E\u6027: ENTITY { type name }`,
      gantt: `- \u4F7F\u7528 gantt \u58F0\u660E
- \u5FC5\u987B\u6709 title \u548C dateFormat (\u5982 YYYY-MM-DD)
- \u4EFB\u52A1: \u4EFB\u52A1\u540D :\u72B6\u6001, \u5F00\u59CB, \u7ED3\u675F/\u6301\u7EED
- \u72B6\u6001: done/active/crit \u6216 crit,done
- \u5206\u7EC4: section \u540D\u79F0`,
      pie: `- \u4F7F\u7528 pie \u6216 pie showData \u58F0\u660E
- \u53EF\u9009 title "\u6807\u9898"
- \u6570\u636E\u683C\u5F0F: "\u6807\u7B7E" : \u6570\u503C`,
      mindmap: `- \u4F7F\u7528 mindmap \u58F0\u660E
- \u5C42\u7EA7\u7528\u7F29\u8FDB\u8868\u793A\uFF082\u4E2A\u7A7A\u683C\uFF09
- \u6839\u8282\u70B9\u65E0\u7F29\u8FDB
- \u53EF\u7528\u5F62\u72B6: ((\u5706\u5F62)) [\u65B9\u5F62] (\u5706\u89D2)`
    };
    return docs[type] || docs.flowchart;
  }
  /**
   * 构建测试修复提示
   */
  _buildTestFixPrompt(code, error, framework, language) {
    const lang = language || this._detectLanguage(code);
    const fw = framework || this._detectTestFramework(code);
    return `\u4F60\u662F\u4E00\u4E2A\u6D4B\u8BD5\u4EE3\u7801\u4E13\u5BB6\u3002\u4EE5\u4E0B ${fw || "\u5355\u5143\u6D4B\u8BD5"} \u6D4B\u8BD5\u4EE3\u7801\u6267\u884C\u5931\u8D25\uFF0C\u8BF7\u4FEE\u590D\u5B83\u3002

**\u6D4B\u8BD5\u6846\u67B6\uFF1A** ${fw || "\u672A\u77E5"}
**\u7F16\u7A0B\u8BED\u8A00\uFF1A** ${lang || "\u672A\u77E5"}

**\u5931\u8D25\u7684\u6D4B\u8BD5\u4EE3\u7801\uFF1A**
\`\`\`${lang || ""}
${code}
\`\`\`

**\u9519\u8BEF\u4FE1\u606F\uFF1A**
\`\`\`
${error}
\`\`\`

**\u4FEE\u590D\u8981\u6C42\uFF1A**
1. \u5206\u6790\u6D4B\u8BD5\u5931\u8D25\u7684\u539F\u56E0
2. \u4FEE\u590D\u6D4B\u8BD5\u4EE3\u7801\u4E2D\u7684\u95EE\u9898
3. \u786E\u4FDD\u6D4B\u8BD5\u903B\u8F91\u6B63\u786E
4. \u4FDD\u6301\u539F\u6709\u6D4B\u8BD5\u8986\u76D6\u8303\u56F4
5. \u5982\u679C\u662F\u65AD\u8A00\u95EE\u9898\uFF0C\u68C0\u67E5\u671F\u671B\u503C\u662F\u5426\u5408\u7406

\u8BF7\u6309\u4EE5\u4E0B\u683C\u5F0F\u8FD4\u56DE\uFF1A

**\u9519\u8BEF\u5206\u6790\uFF1A**
[\u7B80\u8981\u8BF4\u660E\u6D4B\u8BD5\u5931\u8D25\u7684\u539F\u56E0]

**\u4FEE\u590D\u540E\u4EE3\u7801\uFF1A**
\`\`\`${lang || ""}
[\u4FEE\u590D\u540E\u7684\u5B8C\u6574\u6D4B\u8BD5\u4EE3\u7801]
\`\`\`

**\u4FEE\u6539\u8BF4\u660E\uFF1A**
[\u8BF4\u660E\u505A\u4E86\u54EA\u4E9B\u4FEE\u6539]

**\u6CE8\u610F\u4E8B\u9879\uFF1A**
[\u5982\u679C\u6709\u9700\u8981\u6CE8\u610F\u7684\u5730\u65B9\uFF0C\u8BF7\u8BF4\u660E]`;
  }
  /**
   * 构建通用代码修复提示
   */
  _buildCodeFixPrompt(code, error, language, context) {
    const lang = language || this._detectLanguage(code);
    return `\u4F60\u662F\u4E00\u4E2A\u4EE3\u7801\u4FEE\u590D\u4E13\u5BB6\u3002\u4EE5\u4E0B\u4EE3\u7801\u5B58\u5728\u9519\u8BEF\uFF0C\u8BF7\u4FEE\u590D\u5B83\u3002

**\u7F16\u7A0B\u8BED\u8A00\uFF1A** ${lang || "\u672A\u77E5"}

**\u6709\u95EE\u9898\u7684\u4EE3\u7801\uFF1A**
\`\`\`${lang || ""}
${code}
\`\`\`

**\u9519\u8BEF\u4FE1\u606F\uFF1A**
\`\`\`
${error}
\`\`\`

${context ? `**\u4E0A\u4E0B\u6587\u4FE1\u606F\uFF1A**
${context}
` : ""}

**\u4FEE\u590D\u8981\u6C42\uFF1A**
1. \u5206\u6790\u9519\u8BEF\u539F\u56E0
2. \u4FEE\u590D\u4EE3\u7801\u95EE\u9898
3. \u4FDD\u6301\u4EE3\u7801\u98CE\u683C\u4E00\u81F4
4. \u4E0D\u8981\u6539\u53D8\u4EE3\u7801\u7684\u4E3B\u8981\u903B\u8F91

\u8BF7\u6309\u4EE5\u4E0B\u683C\u5F0F\u8FD4\u56DE\uFF1A

**\u9519\u8BEF\u5206\u6790\uFF1A**
[\u7B80\u8981\u8BF4\u660E\u9519\u8BEF\u539F\u56E0]

**\u4FEE\u590D\u540E\u4EE3\u7801\uFF1A**
\`\`\`${lang || ""}
[\u4FEE\u590D\u540E\u7684\u5B8C\u6574\u4EE3\u7801]
\`\`\`

**\u4FEE\u6539\u8BF4\u660E\uFF1A**
[\u8BF4\u660E\u505A\u4E86\u54EA\u4E9B\u4FEE\u6539]`;
  }
  /**
   * 执行带重试的修复
   */
  async _executeFixWithRetry(prompt, type, originalCode) {
    let lastError = "";
    for (let attempt = 0; attempt < this._maxRetries; attempt++) {
      try {
        const result = await this._executeFix(prompt, type);
        if (result.success && result.fixedCode) {
          const isValid = await this._validateFix(type, result.fixedCode);
          if (isValid) {
            this._fixHistory.push({
              timestamp: Date.now(),
              type,
              originalCode,
              fixedCode: result.fixedCode,
              error: lastError
            });
            return result;
          } else {
            lastError = "\u4FEE\u590D\u540E\u7684\u4EE3\u7801\u4ECD\u6709\u95EE\u9898";
            prompt += `

**\u6CE8\u610F\uFF1A** \u4E0A\u4E00\u6B21\u4FEE\u590D\u5C1D\u8BD5\u672A\u6210\u529F\uFF0C\u4FEE\u590D\u540E\u7684\u4EE3\u7801\u4ECD\u6709\u95EE\u9898\u3002\u8BF7\u91CD\u65B0\u5206\u6790\u5E76\u4FEE\u590D\u3002`;
          }
        } else {
          lastError = result.error || "\u4FEE\u590D\u5931\u8D25";
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "\u672A\u77E5\u9519\u8BEF";
      }
    }
    return {
      success: false,
      error: `\u4FEE\u590D\u5931\u8D25\uFF08\u5C1D\u8BD5 ${this._maxRetries} \u6B21\u540E\uFF09: ${lastError}`,
      suggestions: [
        "\u8BF7\u624B\u52A8\u68C0\u67E5\u4EE3\u7801",
        "\u5C1D\u8BD5\u7B80\u5316\u4EE3\u7801\u540E\u91CD\u8BD5",
        "\u68C0\u67E5\u662F\u5426\u6709\u8BED\u6CD5\u9519\u8BEF"
      ]
    };
  }
  /**
   * 执行单次修复
   */
  async _executeFix(prompt, type) {
    return new Promise((resolve2) => {
      let response = "";
      this._chatService.sendMessage(
        [{ id: "0", role: "user", content: prompt, timestamp: Date.now() }],
        {
          onToken: (token) => {
            response += token;
          },
          onComplete: () => {
            const fixedCode = this._extractFixedCode(response, type);
            const explanation = this._extractExplanation(response);
            if (fixedCode) {
              resolve2({
                success: true,
                fixedCode,
                explanation
              });
            } else {
              resolve2({
                success: false,
                error: "\u65E0\u6CD5\u4ECE\u54CD\u5E94\u4E2D\u63D0\u53D6\u4FEE\u590D\u540E\u7684\u4EE3\u7801"
              });
            }
          },
          onError: (error) => {
            resolve2({
              success: false,
              error: error.message
            });
          }
        }
      );
    });
  }
  /**
   * 提取修复后的代码
   */
  _extractFixedCode(response, type) {
    let codeBlock;
    if (type === "diagram") {
      codeBlock = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
    } else {
      codeBlock = response.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
    }
    if (codeBlock && codeBlock[1]) {
      return codeBlock[1].trim();
    }
    const lines = response.split("\n");
    const codeLines = [];
    let inCode = false;
    for (const line of lines) {
      if (line.startsWith("    ") || line.startsWith("	")) {
        inCode = true;
        codeLines.push(line);
      } else if (inCode && line.trim() === "") {
        codeLines.push(line);
      } else {
        inCode = false;
      }
    }
    if (codeLines.length > 3) {
      return codeLines.join("\n").trim();
    }
    return null;
  }
  /**
   * 提取解释说明
   */
  _extractExplanation(response) {
    const sections = [
      /\*\*错误分析[：:]\*\*\s*([\s\S]*?)(?=\*\*修复后代码|```|$)/,
      /\*\*修改说明[：:]\*\*\s*([\s\S]*?)(?=\*\*注意|$)/
    ];
    const explanations = [];
    for (const pattern of sections) {
      const match = response.match(pattern);
      if (match && match[1]) {
        let content = match[1].trim();
        content = content.split("\n").filter((line) => {
          const trimmed = line.trim();
          if (!trimmed)
            return false;
          if (/^(\d+\.|[-*])\s*$/.test(trimmed))
            return false;
          if (/[:：]\s*$/.test(trimmed) && trimmed.length < 30)
            return false;
          return true;
        }).join("\n");
        if (content && content.length > 5) {
          explanations.push(content);
        }
      }
    }
    if (explanations.length === 0) {
      return "\u5DF2\u81EA\u52A8\u4FEE\u590D\u4EE3\u7801\u4E2D\u7684\u8BED\u6CD5\u95EE\u9898";
    }
    return explanations.join("\n\n");
  }
  /**
   * 验证修复结果
   */
  async _validateFix(type, code) {
    if (type === "diagram") {
      return this._validateMermaid(code);
    }
    return code.trim().length > 10;
  }
  /**
   * 验证 Mermaid 代码
   */
  _validateMermaid(code) {
    const validStartPatterns = [
      /^flowchart\s+/m,
      /^graph\s+/m,
      /^sequenceDiagram/m,
      /^classDiagram/m,
      /^stateDiagram/m,
      /^erDiagram/m,
      /^gantt/m,
      /^pie/m,
      /^mindmap/m
    ];
    return validStartPatterns.some((pattern) => pattern.test(code.trim()));
  }
  /**
   * 检测编程语言
   */
  _detectLanguage(code) {
    if (code.includes("import React") || code.includes("from 'react'")) {
      return "typescript";
    }
    if (code.includes("def ") || code.includes("import ")) {
      if (code.includes("async def") || code.includes("await ")) {
        return "python";
      }
    }
    if (code.includes("func ") && code.includes("package ")) {
      return "go";
    }
    if (code.includes("fn ") && code.includes("let ")) {
      return "rust";
    }
    if (code.includes("public class") || code.includes("private ")) {
      return "java";
    }
    if (code.includes("const ") || code.includes("let ") || code.includes("function ")) {
      return "typescript";
    }
    return "";
  }
  /**
   * 检测测试框架
   */
  _detectTestFramework(code) {
    if (code.includes("describe(") && code.includes("it(")) {
      if (code.includes("vitest"))
        return "Vitest";
      if (code.includes("@jest"))
        return "Jest";
      return "Jest/Mocha";
    }
    if (code.includes("pytest") || code.includes("def test_")) {
      return "pytest";
    }
    if (code.includes("@Test") || code.includes("junit")) {
      return "JUnit";
    }
    if (code.includes("func Test")) {
      return "Go testing";
    }
    return "";
  }
};

// src/extension/analyzer/EnhancedProjectAnalyzer.ts
var path3 = __toESM(require("path"));
var fs2 = __toESM(require("fs"));
var EnhancedProjectAnalyzer = class {
  constructor() {
    this._ignoreDirs = [
      "node_modules",
      ".git",
      "dist",
      "build",
      "__pycache__",
      "venv",
      ".venv",
      "target",
      "coverage",
      ".next",
      ".nuxt",
      "vendor",
      "bin",
      "obj",
      ".idea",
      ".vscode"
    ];
    this._ignoreFiles = [
      ".DS_Store",
      "Thumbs.db",
      ".gitignore",
      ".npmrc",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml"
    ];
  }
  /**
   * 执行完整的项目分析
   */
  async analyzeProject(workspaceRoot) {
    const name = path3.basename(workspaceRoot);
    const [
      projectType,
      structure,
      codeStats,
      modules,
      qualityIndicators
    ] = await Promise.all([
      this._detectProjectType(workspaceRoot),
      this._buildStructure(workspaceRoot, 3),
      this._analyzeCodeStats(workspaceRoot),
      this._analyzeModules(workspaceRoot),
      this._analyzeQuality(workspaceRoot)
    ]);
    const dependencies = await this._analyzeDependencies(workspaceRoot, projectType.type);
    const architecture = this._inferArchitecture(structure, projectType);
    const entryPoints = this._findEntryPoints(workspaceRoot, projectType);
    const configFiles = this._findConfigFiles(workspaceRoot);
    const scripts = this._extractScripts(workspaceRoot, projectType.type);
    const projectPurpose = await this._analyzeProjectPurpose(workspaceRoot, projectType, dependencies);
    const executionFlow = await this._analyzeExecutionFlow(workspaceRoot, projectType, entryPoints, modules);
    const markdownDocs = await this._scanMarkdownDocs(workspaceRoot);
    const contextSummary = this._generateContextSummary({
      name,
      type: projectType.type,
      framework: projectType.framework,
      language: projectType.language,
      codeStats,
      modules,
      architecture,
      projectPurpose,
      executionFlow,
      markdownDocs
    });
    return {
      name,
      root: workspaceRoot,
      type: projectType.type,
      framework: projectType.framework,
      language: projectType.language,
      projectPurpose,
      executionFlow,
      structure,
      entryPoints,
      configFiles,
      codeStats,
      dependencies,
      modules,
      architecture,
      qualityIndicators,
      scripts,
      contextSummary,
      markdownDocs
    };
  }
  /**
   * 生成简洁的项目报告（用于显示）
   * 优化版：移除冗余信息，聚焦于真正有价值的内容
   */
  generateReport(analysis) {
    var _a;
    const sections = [];
    sections.push(`## \u{1F916} \u9879\u76EE\u5206\u6790: ${analysis.name}
`);
    if (analysis.projectPurpose) {
      const desc = analysis.projectPurpose.description;
      const category = this._getCategoryLabel(analysis.projectPurpose.category);
      if (desc && desc !== "\u672A\u68C0\u6D4B\u5230\u9879\u76EE\u63CF\u8FF0") {
        sections.push(`> ${desc}
`);
      }
      const techStack = analysis.projectPurpose.techStack.slice(0, 4).join(", ");
      sections.push(`**${category}** | ${analysis.language}${techStack ? ` | ${techStack}` : ""}
`);
    } else {
      sections.push(`**${analysis.type}** | ${analysis.language}
`);
    }
    if ((_a = analysis.executionFlow) == null ? void 0 : _a.mainEntry) {
      sections.push(`\u{1F4CD} **\u5165\u53E3**: \`${analysis.executionFlow.mainEntry.file}\``);
      if (analysis.executionFlow.startCommand) {
        sections.push(`\u25B6\uFE0F **\u542F\u52A8**: \`${analysis.executionFlow.startCommand}\``);
      }
      sections.push("");
    }
    const totalLines = analysis.codeStats.totalLines;
    const totalFiles = analysis.codeStats.totalFiles;
    const sizeDesc = totalLines > 1e4 ? "\u5927\u578B" : totalLines > 3e3 ? "\u4E2D\u578B" : "\u5C0F\u578B";
    sections.push(`\u{1F4CA} **\u89C4\u6A21**: ${sizeDesc}\u9879\u76EE (${totalFiles} \u6587\u4EF6, ${totalLines.toLocaleString()} \u884C)
`);
    if (analysis.modules.length > 0) {
      const coreModules = analysis.modules.filter((m) => m.description || ["src", "app", "lib", "core"].includes(m.name.toLowerCase())).slice(0, 5);
      if (coreModules.length > 0) {
        sections.push(`\u{1F4E6} **\u6838\u5FC3\u6A21\u5757**`);
        for (const mod of coreModules) {
          sections.push(`- \`${mod.name}/\` ${mod.description || ""}`);
        }
        sections.push("");
      }
    }
    if (analysis.dependencies.runtime.length > 0) {
      const keyDeps = analysis.dependencies.runtime.slice(0, 6);
      sections.push(`\u{1F4DA} **\u5173\u952E\u4F9D\u8D56**: ${keyDeps.join(", ")}${analysis.dependencies.runtime.length > 6 ? "..." : ""}
`);
    }
    if (analysis.scripts.length > 0) {
      const importantScripts = analysis.scripts.filter((s) => ["dev", "start", "build", "test"].includes(s.name.toLowerCase())).slice(0, 4);
      if (importantScripts.length > 0) {
        const scriptStr = importantScripts.map((s) => `\`${s.name}\``).join(" | ");
        sections.push(`\u{1F527} **\u547D\u4EE4**: ${scriptStr}
`);
      }
    }
    sections.push(`---`);
    sections.push(`\u{1F4AC} **\u73B0\u5728\u53EF\u4EE5\u95EE\u6211**\uFF1A`);
    sections.push(`- \u8FD9\u4E2A\u9879\u76EE\u662F\u505A\u4EC0\u4E48\u7684\uFF1F\u67B6\u6784\u662F\u600E\u6837\u7684\uFF1F`);
    sections.push(`- \u5E2E\u6211\u7406\u89E3 [\u67D0\u4E2A\u6587\u4EF6/\u6A21\u5757] \u7684\u903B\u8F91`);
    sections.push(`- \u6211\u60F3\u6DFB\u52A0 [\u67D0\u4E2A\u529F\u80FD]\uFF0C\u5E94\u8BE5\u600E\u4E48\u505A\uFF1F`);
    return sections.join("\n");
  }
  /**
   * 获取项目类别的中文标签
   */
  _getCategoryLabel(category) {
    const labels = {
      "web-frontend": "\u{1F310} \u524D\u7AEF\u5E94\u7528",
      "web-backend": "\u2699\uFE0F \u540E\u7AEF\u670D\u52A1",
      "fullstack": "\u{1F504} \u5168\u6808\u5E94\u7528",
      "cli-tool": "\u{1F4BB} \u547D\u4EE4\u884C\u5DE5\u5177",
      "library": "\u{1F4DA} \u5E93/SDK",
      "vscode-extension": "\u{1F9E9} VSCode \u63D2\u4EF6",
      "mobile-app": "\u{1F4F1} \u79FB\u52A8\u5E94\u7528",
      "desktop-app": "\u{1F5A5}\uFE0F \u684C\u9762\u5E94\u7528",
      "api-service": "\u{1F50C} API \u670D\u52A1",
      "data-processing": "\u{1F4CA} \u6570\u636E\u5904\u7406",
      "ml-ai": "\u{1F916} \u673A\u5668\u5B66\u4E60/AI",
      "unknown": "\u2753 \u672A\u77E5\u7C7B\u578B"
    };
    return labels[category] || category;
  }
  /**
   * 获取文档类型的中文标签
   */
  _getDocTypeLabel(docType) {
    const labels = {
      "readme": "\u8BF4\u660E\u6587\u6863",
      "changelog": "\u66F4\u65B0\u65E5\u5FD7",
      "contributing": "\u8D21\u732E\u6307\u5357",
      "api": "API\u6587\u6863",
      "guide": "\u4F7F\u7528\u6307\u5357",
      "architecture": "\u67B6\u6784\u6587\u6863",
      "other": "\u5176\u4ED6"
    };
    return labels[docType] || "\u6587\u6863";
  }
  /**
   * 渲染树形结构（使用ASCII树形符号）
   */
  _renderTreeStructure(node, prefix = "", isLast = true) {
    let result = "";
    const nodePrefix = prefix + (isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ");
    const childPrefix = prefix + (isLast ? "    " : "\u2502   ");
    if (prefix === "") {
      result = `${node.name}/
`;
    } else {
      const icon = node.type === "directory" ? "\u{1F4C1}" : "\u{1F4C4}";
      const name = node.type === "directory" ? `${node.name}/` : node.name;
      result = `${nodePrefix}${icon} ${name}
`;
    }
    if (node.children && node.children.length > 0) {
      const sortedChildren = [...node.children].sort((a, b) => {
        if (a.type === b.type)
          return a.name.localeCompare(b.name);
        return a.type === "directory" ? -1 : 1;
      });
      const displayLimit = 12;
      const childrenToShow = sortedChildren.slice(0, displayLimit);
      const hasMore = sortedChildren.length > displayLimit;
      childrenToShow.forEach((child, index) => {
        const isChildLast = index === childrenToShow.length - 1 && !hasMore;
        result += this._renderTreeStructure(child, prefix === "" ? "" : childPrefix, isChildLast);
      });
      if (hasMore) {
        result += `${childPrefix}\u2514\u2500\u2500 ... (\u8FD8\u6709 ${sortedChildren.length - displayLimit} \u4E2A\u9879\u76EE)
`;
      }
    }
    return result;
  }
  /**
   * 生成 AI 上下文摘要 - 增强版
   * 包含项目描述、README摘要等更有价值的信息
   */
  generateContextForAI(analysis) {
    var _a, _b, _c, _d, _e, _f;
    const sections = [];
    sections.push(`## \u9879\u76EE\u4E0A\u4E0B\u6587`);
    sections.push(`**\u9879\u76EE**: ${analysis.name}`);
    sections.push(`**\u7C7B\u578B**: ${analysis.type}${analysis.framework ? ` (${analysis.framework})` : ""}`);
    sections.push(`**\u8BED\u8A00**: ${analysis.language}`);
    sections.push(`**\u89C4\u6A21**: ${analysis.codeStats.totalFiles} \u6587\u4EF6, ${analysis.codeStats.totalLines.toLocaleString()} \u884C`);
    if ((_a = analysis.projectPurpose) == null ? void 0 : _a.description) {
      sections.push(`
**\u9879\u76EE\u63CF\u8FF0**: ${analysis.projectPurpose.description}`);
    }
    if (((_c = (_b = analysis.projectPurpose) == null ? void 0 : _b.techStack) == null ? void 0 : _c.length) > 0) {
      sections.push(`**\u6280\u672F\u6808**: ${analysis.projectPurpose.techStack.join(", ")}`);
    }
    if ((_d = analysis.executionFlow) == null ? void 0 : _d.mainEntry) {
      sections.push(`
**\u4E3B\u5165\u53E3**: ${analysis.executionFlow.mainEntry.file}`);
    }
    if ((_e = analysis.executionFlow) == null ? void 0 : _e.startCommand) {
      sections.push(`**\u542F\u52A8\u547D\u4EE4**: ${analysis.executionFlow.startCommand}`);
    }
    if (analysis.modules.length > 0) {
      sections.push(`
**\u76EE\u5F55\u7ED3\u6784**:`);
      for (const m of analysis.modules.slice(0, 10)) {
        sections.push(`- ${m.name}/: ${m.description || m.type}`);
      }
    }
    if (analysis.architecture.pattern) {
      sections.push(`
**\u67B6\u6784\u6A21\u5F0F**: ${analysis.architecture.pattern}`);
    }
    if (analysis.architecture.keyComponents.length > 0) {
      sections.push(`**\u6838\u5FC3\u6A21\u5757**: ${analysis.architecture.keyComponents.join(", ")}`);
    }
    if (analysis.dependencies.runtime.length > 0) {
      sections.push(`
**\u4E3B\u8981\u4F9D\u8D56**: ${analysis.dependencies.runtime.slice(0, 12).join(", ")}`);
    }
    if (((_f = analysis.markdownDocs) == null ? void 0 : _f.length) > 0) {
      const readme = analysis.markdownDocs.find((d) => d.docType === "readme");
      if (readme == null ? void 0 : readme.summary) {
        sections.push(`
**README \u6458\u8981**:`);
        sections.push(readme.summary.slice(0, 800));
      }
    }
    sections.push(`
---`);
    sections.push(`\u8BF7\u57FA\u4E8E\u4EE5\u4E0A\u9879\u76EE\u4E0A\u4E0B\u6587\u6765\u56DE\u7B54\u7528\u6237\u7684\u95EE\u9898\u3002`);
    return sections.join("\n");
  }
  // ==================== 私有方法 ====================
  async _detectProjectType(root) {
    const files = fs2.readdirSync(root);
    let type = "";
    let framework;
    let language = "";
    const detectedLanguages = /* @__PURE__ */ new Map();
    if (files.includes("package.json")) {
      type = "Node.js";
      language = "JavaScript";
      try {
        const pkg = JSON.parse(fs2.readFileSync(path3.join(root, "package.json"), "utf-8"));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps["react"] && deps["next"])
          framework = "Next.js";
        else if (deps["react"])
          framework = "React";
        else if (deps["vue"] && deps["nuxt"])
          framework = "Nuxt.js";
        else if (deps["vue"])
          framework = "Vue.js";
        else if (deps["@angular/core"])
          framework = "Angular";
        else if (deps["svelte"])
          framework = "Svelte";
        else if (deps["express"])
          framework = "Express";
        else if (deps["fastify"])
          framework = "Fastify";
        else if (deps["nestjs"] || deps["@nestjs/core"])
          framework = "NestJS";
        else if (deps["koa"])
          framework = "Koa";
        else if (deps["vscode"])
          framework = "VS Code Extension";
        else if (deps["electron"])
          framework = "Electron";
        if (deps["typescript"] || files.includes("tsconfig.json")) {
          language = "TypeScript";
        }
      } catch {
      }
    } else if (files.includes("requirements.txt") || files.includes("setup.py") || files.includes("pyproject.toml")) {
      type = "Python";
      language = "Python";
      if (files.includes("manage.py"))
        framework = "Django";
      else {
        const checkFiles = ["app.py", "main.py", "run.py"];
        for (const f of checkFiles) {
          if (files.includes(f)) {
            try {
              const content = fs2.readFileSync(path3.join(root, f), "utf-8");
              if (content.includes("Flask"))
                framework = "Flask";
              else if (content.includes("FastAPI"))
                framework = "FastAPI";
              else if (content.includes("Django"))
                framework = "Django";
            } catch {
            }
          }
        }
      }
    } else if (files.includes("go.mod")) {
      type = "Go";
      language = "Go";
      try {
        const modContent = fs2.readFileSync(path3.join(root, "go.mod"), "utf-8");
        if (modContent.includes("gin-gonic"))
          framework = "Gin";
        else if (modContent.includes("echo"))
          framework = "Echo";
        else if (modContent.includes("fiber"))
          framework = "Fiber";
      } catch {
      }
    } else if (files.includes("Cargo.toml")) {
      type = "Rust";
      language = "Rust";
    } else if (files.includes("pom.xml")) {
      type = "Java (Maven)";
      language = "Java";
      framework = "Maven";
    } else if (files.includes("build.gradle") || files.includes("build.gradle.kts")) {
      type = "Java (Gradle)";
      language = "Java";
      framework = "Gradle";
    }
    if (!type || !language) {
      const languageCounts = await this._scanProjectLanguages(root);
      let maxCount = 0;
      let primaryLang = "";
      for (const [lang, count] of Object.entries(languageCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryLang = lang;
        }
      }
      if (primaryLang) {
        language = primaryLang;
        const langToType = {
          "TypeScript": "TypeScript \u9879\u76EE",
          "JavaScript": "JavaScript \u9879\u76EE",
          "Python": "Python \u9879\u76EE",
          "Java": "Java \u9879\u76EE",
          "Go": "Go \u9879\u76EE",
          "Rust": "Rust \u9879\u76EE",
          "C": "C/C++ \u9879\u76EE",
          "C++": "C/C++ \u9879\u76EE",
          "Ruby": "Ruby \u9879\u76EE",
          "PHP": "PHP \u9879\u76EE",
          "Swift": "Swift \u9879\u76EE",
          "Kotlin": "Kotlin \u9879\u76EE",
          "Vue": "Vue.js \u9879\u76EE",
          "HTML": "Web \u9879\u76EE",
          "CSS": "Web \u9879\u76EE"
        };
        type = langToType[primaryLang] || `${primaryLang} \u9879\u76EE`;
      }
    }
    if (!type)
      type = "\u901A\u7528\u9879\u76EE";
    if (!language)
      language = "\u6DF7\u5408\u8BED\u8A00";
    return { type, framework, language };
  }
  /**
   * 扫描项目目录统计各语言文件数量
   */
  async _scanProjectLanguages(root) {
    const counts = {};
    const walk = (dir, depth = 0) => {
      if (depth > 3)
        return;
      try {
        const entries = fs2.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith(".") || this._ignoreDirs.includes(entry.name)) {
            continue;
          }
          const fullPath = path3.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath, depth + 1);
          } else {
            const lang = this._getLanguage(entry.name);
            if (lang !== "Unknown") {
              counts[lang] = (counts[lang] || 0) + 1;
            }
          }
        }
      } catch {
      }
    };
    walk(root);
    return counts;
  }
  async _buildStructure(dir, maxDepth, currentDepth = 0) {
    var _a, _b;
    const name = path3.basename(dir);
    const node = {
      name,
      type: "directory",
      path: dir,
      children: []
    };
    if (currentDepth >= maxDepth) {
      return node;
    }
    try {
      const entries = fs2.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".") || this._ignoreDirs.includes(entry.name) || this._ignoreFiles.includes(entry.name)) {
          continue;
        }
        const fullPath = path3.join(dir, entry.name);
        if (entry.isDirectory()) {
          const childNode = await this._buildStructure(fullPath, maxDepth, currentDepth + 1);
          (_a = node.children) == null ? void 0 : _a.push(childNode);
        } else {
          (_b = node.children) == null ? void 0 : _b.push({
            name: entry.name,
            type: "file",
            path: fullPath,
            language: this._getLanguage(entry.name)
          });
        }
      }
    } catch {
    }
    return node;
  }
  async _analyzeCodeStats(root) {
    const stats = {
      totalFiles: 0,
      totalLines: 0,
      byLanguage: {},
      byDirectory: {}
    };
    const walk = (dir, relDir = "") => {
      try {
        const entries = fs2.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith(".") || this._ignoreDirs.includes(entry.name)) {
            continue;
          }
          const fullPath = path3.join(dir, entry.name);
          const relPath = path3.join(relDir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath, relPath);
          } else {
            const ext = path3.extname(entry.name).toLowerCase();
            const lang = this._getLanguage(entry.name);
            if (lang !== "Unknown") {
              const lines = this._countLines(fullPath);
              stats.totalFiles++;
              stats.totalLines += lines;
              if (!stats.byLanguage[lang]) {
                stats.byLanguage[lang] = { files: 0, lines: 0 };
              }
              stats.byLanguage[lang].files++;
              stats.byLanguage[lang].lines += lines;
              const topDir = relDir.split(path3.sep)[0] || "/";
              if (!stats.byDirectory[topDir]) {
                stats.byDirectory[topDir] = { files: 0, lines: 0 };
              }
              stats.byDirectory[topDir].files++;
              stats.byDirectory[topDir].lines += lines;
            }
          }
        }
      } catch {
      }
    };
    walk(root);
    return stats;
  }
  async _analyzeModules(root) {
    const modules = [];
    const srcDirs = [
      "src",
      "app",
      "lib",
      "components",
      "pages",
      "api",
      "services",
      "utils",
      "hooks",
      "store",
      "models",
      "controllers",
      "views",
      "routes",
      "middleware",
      "config",
      "types",
      "interfaces"
    ];
    for (const dir of srcDirs) {
      const dirPath = path3.join(root, dir);
      if (fs2.existsSync(dirPath) && fs2.statSync(dirPath).isDirectory()) {
        const mod = {
          name: dir,
          path: dirPath,
          type: this._inferModuleType(dir),
          description: this._getModuleDescription(dir)
        };
        try {
          const subDirs = fs2.readdirSync(dirPath, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name);
          if (subDirs.length > 0) {
            mod.exports = subDirs.slice(0, 10);
          }
        } catch {
        }
        modules.push(mod);
      }
    }
    return modules;
  }
  async _analyzeDependencies(root, projectType) {
    const deps = {
      runtime: [],
      development: [],
      total: 0
    };
    if (projectType.includes("Node")) {
      try {
        const pkg = JSON.parse(fs2.readFileSync(path3.join(root, "package.json"), "utf-8"));
        deps.runtime = Object.keys(pkg.dependencies || {});
        deps.development = Object.keys(pkg.devDependencies || {});
        deps.total = deps.runtime.length + deps.development.length;
      } catch {
      }
    } else if (projectType === "Python") {
      try {
        if (fs2.existsSync(path3.join(root, "requirements.txt"))) {
          const content = fs2.readFileSync(path3.join(root, "requirements.txt"), "utf-8");
          deps.runtime = content.split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.split("==")[0].split(">=")[0].trim());
          deps.total = deps.runtime.length;
        }
      } catch {
      }
    }
    return deps;
  }
  async _analyzeQuality(root) {
    const files = fs2.readdirSync(root);
    return {
      hasTests: files.some((f) => ["test", "tests", "__tests__", "spec"].includes(f)) || files.some((f) => f.includes(".test.") || f.includes(".spec.")),
      hasLinting: files.includes(".eslintrc.js") || files.includes(".eslintrc.json") || files.includes(".prettierrc") || files.includes("pylint.cfg"),
      hasTypeScript: files.includes("tsconfig.json"),
      hasCI: files.includes(".github") || files.includes(".gitlab-ci.yml") || files.includes("Jenkinsfile") || files.includes(".circleci"),
      hasDocumentation: files.includes("README.md") || files.includes("docs") || files.includes("CHANGELOG.md")
    };
  }
  _inferArchitecture(structure, projectType) {
    var _a;
    const dirs = ((_a = structure.children) == null ? void 0 : _a.map((c) => c.name)) || [];
    const layers = [];
    const keyComponents = [];
    let pattern;
    if (dirs.includes("controllers") && dirs.includes("models") && dirs.includes("views")) {
      pattern = "MVC";
      layers.push("Views", "Controllers", "Models");
    } else if (dirs.includes("components") && dirs.includes("store")) {
      pattern = "Flux/Redux";
      layers.push("Components", "Actions", "Store");
    } else if (dirs.includes("pages") && dirs.includes("components")) {
      pattern = "Component-Based";
      layers.push("Pages", "Components", "Utils");
    } else if (dirs.includes("domain") && dirs.includes("infrastructure")) {
      pattern = "Clean Architecture";
      layers.push("Presentation", "Domain", "Infrastructure");
    } else if (dirs.includes("services") && dirs.includes("api")) {
      pattern = "Service-Oriented";
      layers.push("API", "Services", "Data");
    }
    const importantDirs = ["src", "app", "lib", "core", "api", "services"];
    for (const dir of importantDirs) {
      if (dirs.includes(dir)) {
        keyComponents.push(dir);
      }
    }
    return {
      pattern,
      layers,
      keyComponents
    };
  }
  /**
   * 🆕 分析项目功能和用途
   */
  async _analyzeProjectPurpose(root, projectType, dependencies) {
    let description = "";
    let category = "unknown";
    const features = [];
    const techStack = [];
    let targetAudience;
    try {
      const pkgPath = path3.join(root, "package.json");
      if (fs2.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs2.readFileSync(pkgPath, "utf-8"));
        if (pkg.description) {
          description = pkg.description;
        }
        if (pkg.keywords && Array.isArray(pkg.keywords)) {
          features.push(...pkg.keywords.slice(0, 5));
        }
      }
    } catch {
    }
    try {
      const readmePath = path3.join(root, "README.md");
      if (fs2.existsSync(readmePath)) {
        const readme = fs2.readFileSync(readmePath, "utf-8");
        if (!description) {
          const firstParagraph = readme.match(/^#[^#].*\n\n([^#\n][^\n]+)/m);
          if (firstParagraph) {
            description = firstParagraph[1].trim().slice(0, 200);
          }
        }
        const featuresMatch = readme.match(/##\s*(Features|功能|特性)[^\n]*\n([\s\S]*?)(?=\n##|$)/i);
        if (featuresMatch) {
          const featureList = featuresMatch[2].match(/[-*]\s+(.+)/g);
          if (featureList) {
            features.push(...featureList.slice(0, 8).map((f) => f.replace(/^[-*]\s+/, "").trim()));
          }
        }
      }
    } catch {
    }
    category = this._detectProjectCategory(projectType, dependencies, root);
    if (projectType.framework) {
      techStack.push(projectType.framework);
    }
    techStack.push(projectType.language);
    const techDeps = this._extractTechStackFromDeps(dependencies.runtime);
    techStack.push(...techDeps);
    targetAudience = this._inferTargetAudience(category, features);
    return {
      description: description || `${projectType.type} \u9879\u76EE`,
      category,
      features: [...new Set(features)].slice(0, 10),
      targetAudience,
      techStack: [...new Set(techStack)].slice(0, 8)
    };
  }
  /**
   * 检测项目类别
   */
  _detectProjectCategory(projectType, dependencies, root) {
    var _a;
    const deps = dependencies.runtime.join(" ").toLowerCase();
    const devDeps = dependencies.development.join(" ").toLowerCase();
    const framework = ((_a = projectType.framework) == null ? void 0 : _a.toLowerCase()) || "";
    const files = fs2.readdirSync(root);
    if (deps.includes("vscode") || files.includes(".vscodeignore")) {
      return "vscode-extension";
    }
    if (deps.includes("commander") || deps.includes("yargs") || deps.includes("inquirer") || deps.includes("chalk") || deps.includes("ora") || deps.includes("argparse")) {
      return "cli-tool";
    }
    if (framework.includes("react") || framework.includes("vue") || framework.includes("angular") || framework.includes("svelte") || framework.includes("next") || framework.includes("nuxt")) {
      if (deps.includes("express") || deps.includes("fastify") || deps.includes("koa")) {
        return "fullstack";
      }
      return "web-frontend";
    }
    if (deps.includes("express") || deps.includes("fastify") || deps.includes("koa") || deps.includes("nestjs") || deps.includes("hapi") || deps.includes("flask") || deps.includes("django") || deps.includes("fastapi")) {
      return "web-backend";
    }
    if (deps.includes("graphql") || deps.includes("apollo") || deps.includes("trpc") || files.includes("swagger.json") || files.includes("openapi.yaml")) {
      return "api-service";
    }
    if (files.includes("rollup.config.js") || files.includes("tsup.config.ts") || devDeps.includes("rollup") || devDeps.includes("tsup") || projectType.type.toLowerCase().includes("library")) {
      return "library";
    }
    if (deps.includes("react-native") || deps.includes("expo") || files.includes("android") || files.includes("ios")) {
      return "mobile-app";
    }
    if (deps.includes("electron") || deps.includes("tauri")) {
      return "desktop-app";
    }
    if (deps.includes("pandas") || deps.includes("numpy") || deps.includes("dask") || deps.includes("apache-spark")) {
      return "data-processing";
    }
    if (deps.includes("tensorflow") || deps.includes("pytorch") || deps.includes("torch") || deps.includes("transformers") || deps.includes("langchain") || deps.includes("openai")) {
      return "ml-ai";
    }
    return "unknown";
  }
  /**
   * 从依赖提取技术栈
   */
  _extractTechStackFromDeps(deps) {
    const techStack = [];
    const techMap = {
      "react": "React",
      "vue": "Vue.js",
      "angular": "Angular",
      "svelte": "Svelte",
      "express": "Express.js",
      "fastify": "Fastify",
      "nestjs": "NestJS",
      "next": "Next.js",
      "nuxt": "Nuxt.js",
      "prisma": "Prisma",
      "typeorm": "TypeORM",
      "mongoose": "MongoDB",
      "redis": "Redis",
      "graphql": "GraphQL",
      "socket.io": "WebSocket",
      "tailwindcss": "Tailwind CSS",
      "electron": "Electron",
      "vscode": "VSCode API"
    };
    for (const dep of deps) {
      const depLower = dep.toLowerCase();
      for (const [key, value] of Object.entries(techMap)) {
        if (depLower.includes(key)) {
          techStack.push(value);
        }
      }
    }
    return [...new Set(techStack)];
  }
  /**
   * 推断目标用户
   */
  _inferTargetAudience(category, features) {
    const audienceMap = {
      "web-frontend": "\u524D\u7AEF\u5F00\u53D1\u8005\u548C\u7EC8\u7AEF\u7528\u6237",
      "web-backend": "\u540E\u7AEF\u5F00\u53D1\u8005",
      "fullstack": "\u5168\u6808\u5F00\u53D1\u8005",
      "cli-tool": "\u5F00\u53D1\u8005\u548C\u7CFB\u7EDF\u7BA1\u7406\u5458",
      "library": "\u5F00\u53D1\u8005\uFF08\u4F5C\u4E3A\u4F9D\u8D56\u4F7F\u7528\uFF09",
      "vscode-extension": "VSCode \u7528\u6237\u548C\u5F00\u53D1\u8005",
      "mobile-app": "\u79FB\u52A8\u7AEF\u7528\u6237",
      "desktop-app": "\u684C\u9762\u7AEF\u7528\u6237",
      "api-service": "API \u6D88\u8D39\u8005\u548C\u5F00\u53D1\u8005",
      "data-processing": "\u6570\u636E\u5206\u6790\u5E08\u548C\u6570\u636E\u5DE5\u7A0B\u5E08",
      "ml-ai": "AI/ML \u5DE5\u7A0B\u5E08\u548C\u7814\u7A76\u4EBA\u5458",
      "unknown": ""
    };
    return audienceMap[category] || "";
  }
  /**
   * 🆕 分析执行流程
   */
  async _analyzeExecutionFlow(root, projectType, entryPoints, modules) {
    let mainEntry = null;
    let startCommand = null;
    const flowSteps = [];
    const moduleDependencies = [];
    mainEntry = await this._findMainEntry(root, projectType, entryPoints);
    startCommand = this._findStartCommand(root, projectType);
    if (mainEntry) {
      const steps = await this._analyzeFlowSteps(root, mainEntry, projectType);
      flowSteps.push(...steps);
    }
    const deps = await this._analyzeModuleDependencies(root, mainEntry == null ? void 0 : mainEntry.file);
    moduleDependencies.push(...deps);
    const dataFlow = this._generateDataFlowDescription(projectType, flowSteps);
    return {
      mainEntry,
      startCommand,
      flowSteps,
      moduleDependencies,
      dataFlow
    };
  }
  /**
   * 查找主入口文件
   */
  async _findMainEntry(root, projectType, entryPoints) {
    var _a, _b;
    try {
      const pkgPath = path3.join(root, "package.json");
      if (fs2.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs2.readFileSync(pkgPath, "utf-8"));
        if (pkg.main && ((_a = pkg.engines) == null ? void 0 : _a.vscode)) {
          return {
            file: pkg.main,
            type: "extension",
            description: "VSCode \u63D2\u4EF6\u5165\u53E3\uFF0C\u5B9A\u4E49 activate/deactivate \u51FD\u6570",
            exports: ["activate", "deactivate"]
          };
        }
        if (pkg.main) {
          return {
            file: pkg.main,
            type: "main",
            description: "Node.js \u6A21\u5757\u4E3B\u5165\u53E3"
          };
        }
      }
    } catch {
    }
    const framework = ((_b = projectType.framework) == null ? void 0 : _b.toLowerCase()) || "";
    if (framework.includes("next")) {
      return {
        file: "pages/_app.tsx \u6216 app/layout.tsx",
        type: "app",
        description: "Next.js \u5E94\u7528\u5165\u53E3\uFF0C\u5904\u7406\u9875\u9762\u521D\u59CB\u5316\u548C\u8DEF\u7531"
      };
    }
    if (framework.includes("react")) {
      for (const entry of ["src/index.tsx", "src/index.js", "src/main.tsx", "src/main.js"]) {
        if (fs2.existsSync(path3.join(root, entry))) {
          return {
            file: entry,
            type: "index",
            description: "React \u5E94\u7528\u5165\u53E3\uFF0C\u6E32\u67D3\u6839\u7EC4\u4EF6\u5230 DOM"
          };
        }
      }
    }
    if (framework.includes("vue")) {
      for (const entry of ["src/main.ts", "src/main.js"]) {
        if (fs2.existsSync(path3.join(root, entry))) {
          return {
            file: entry,
            type: "main",
            description: "Vue \u5E94\u7528\u5165\u53E3\uFF0C\u521B\u5EFA\u548C\u6302\u8F7D Vue \u5B9E\u4F8B"
          };
        }
      }
    }
    for (const entry of ["src/index.ts", "src/app.ts", "src/server.ts", "src/main.ts"]) {
      if (fs2.existsSync(path3.join(root, entry))) {
        return {
          file: entry,
          type: "server",
          description: "\u670D\u52A1\u7AEF\u5165\u53E3\uFF0C\u521D\u59CB\u5316\u914D\u7F6E\u5E76\u542F\u52A8\u670D\u52A1"
        };
      }
    }
    if (entryPoints.length > 0) {
      return {
        file: entryPoints[0],
        type: "index",
        description: "\u9879\u76EE\u4E3B\u5165\u53E3\u6587\u4EF6"
      };
    }
    return null;
  }
  /**
   * 查找启动命令
   */
  _findStartCommand(root, projectType) {
    var _a, _b, _c, _d;
    try {
      const pkgPath = path3.join(root, "package.json");
      if (fs2.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs2.readFileSync(pkgPath, "utf-8"));
        if ((_a = pkg.engines) == null ? void 0 : _a.vscode) {
          return "F5 (\u5728 VSCode \u4E2D\u6309 F5 \u542F\u52A8\u8C03\u8BD5)";
        }
        if ((_b = pkg.scripts) == null ? void 0 : _b.dev)
          return "npm run dev";
        if ((_c = pkg.scripts) == null ? void 0 : _c.start)
          return "npm start";
        if ((_d = pkg.scripts) == null ? void 0 : _d.serve)
          return "npm run serve";
      }
    } catch {
    }
    if (projectType.type === "Python") {
      if (fs2.existsSync(path3.join(root, "main.py")))
        return "python main.py";
      if (fs2.existsSync(path3.join(root, "app.py")))
        return "python app.py";
    }
    if (projectType.type === "Go") {
      return "go run .";
    }
    return null;
  }
  /**
   * 分析执行流程步骤
   */
  async _analyzeFlowSteps(root, mainEntry, projectType) {
    var _a;
    const steps = [];
    const framework = ((_a = projectType.framework) == null ? void 0 : _a.toLowerCase()) || "";
    if (mainEntry.type === "extension") {
      steps.push(
        { order: 1, description: "VSCode \u52A0\u8F7D\u63D2\u4EF6\uFF0C\u8BFB\u53D6 package.json \u914D\u7F6E", type: "init" },
        { order: 2, description: "\u89E6\u53D1\u6FC0\u6D3B\u6761\u4EF6\u65F6\u8C03\u7528 activate() \u51FD\u6570", file: mainEntry.file, type: "init" },
        { order: 3, description: "\u6CE8\u518C\u547D\u4EE4\u3001\u89C6\u56FE\u3001Provider \u7B49", type: "config" },
        { order: 4, description: "\u76D1\u542C\u7528\u6237\u64CD\u4F5C\u548C\u4E8B\u4EF6", type: "handler" },
        { order: 5, description: "\u63D2\u4EF6\u505C\u7528\u65F6\u8C03\u7528 deactivate() \u6E05\u7406\u8D44\u6E90", type: "handler" }
      );
    } else if (framework.includes("next")) {
      steps.push(
        { order: 1, description: "\u52A0\u8F7D next.config.js \u914D\u7F6E", type: "config" },
        { order: 2, description: "\u521D\u59CB\u5316 _app.tsx \u5305\u88C5\u7EC4\u4EF6", type: "init" },
        { order: 3, description: "\u6839\u636E URL \u5339\u914D pages/ \u6216 app/ \u4E0B\u7684\u8DEF\u7531", type: "route" },
        { order: 4, description: "\u6267\u884C getServerSideProps/getStaticProps \u83B7\u53D6\u6570\u636E", type: "handler" },
        { order: 5, description: "\u6E32\u67D3\u9875\u9762\u7EC4\u4EF6\u5E76\u8FD4\u56DE HTML", type: "render" }
      );
    } else if (framework.includes("react")) {
      steps.push(
        { order: 1, description: "\u52A0\u8F7D\u5165\u53E3\u6587\u4EF6\u548C\u6839\u7EC4\u4EF6", file: mainEntry.file, type: "init" },
        { order: 2, description: "ReactDOM.render() \u6302\u8F7D\u5230 DOM", type: "init" },
        { order: 3, description: "\u8DEF\u7531\u89E3\u6790\uFF0C\u5339\u914D\u5BF9\u5E94\u9875\u9762\u7EC4\u4EF6", type: "route" },
        { order: 4, description: "\u7EC4\u4EF6\u751F\u547D\u5468\u671F\u6267\u884C\uFF0C\u83B7\u53D6\u6570\u636E", type: "handler" },
        { order: 5, description: "\u6E32\u67D3\u865A\u62DF DOM \u5E76\u66F4\u65B0\u771F\u5B9E DOM", type: "render" }
      );
    } else if (framework.includes("express") || framework.includes("fastify") || framework.includes("koa")) {
      steps.push(
        { order: 1, description: "\u52A0\u8F7D\u73AF\u5883\u53D8\u91CF\u548C\u914D\u7F6E", type: "config" },
        { order: 2, description: "\u521D\u59CB\u5316\u6570\u636E\u5E93\u8FDE\u63A5", type: "init" },
        { order: 3, description: "\u6CE8\u518C\u4E2D\u95F4\u4EF6\uFF08\u65E5\u5FD7\u3001\u8BA4\u8BC1\u3001CORS\u7B49\uFF09", type: "middleware" },
        { order: 4, description: "\u6CE8\u518C\u8DEF\u7531\u548C\u63A7\u5236\u5668", type: "route" },
        { order: 5, description: "\u542F\u52A8 HTTP \u670D\u52A1\u5668\u76D1\u542C\u7AEF\u53E3", file: mainEntry.file, type: "init" },
        { order: 6, description: "\u63A5\u6536\u8BF7\u6C42 \u2192 \u4E2D\u95F4\u4EF6\u5904\u7406 \u2192 \u8DEF\u7531\u5206\u53D1 \u2192 \u8FD4\u56DE\u54CD\u5E94", type: "handler" }
      );
    } else {
      steps.push(
        { order: 1, description: "\u7A0B\u5E8F\u542F\u52A8\uFF0C\u52A0\u8F7D\u5165\u53E3\u6587\u4EF6", file: mainEntry.file, type: "init" },
        { order: 2, description: "\u521D\u59CB\u5316\u914D\u7F6E\u548C\u4F9D\u8D56", type: "config" },
        { order: 3, description: "\u6267\u884C\u4E3B\u8981\u4E1A\u52A1\u903B\u8F91", type: "handler" }
      );
    }
    return steps;
  }
  /**
   * 分析模块依赖关系
   */
  async _analyzeModuleDependencies(root, mainEntryFile) {
    const dependencies = [];
    if (!mainEntryFile)
      return dependencies;
    try {
      const entryPath = path3.join(root, mainEntryFile);
      if (!fs2.existsSync(entryPath))
        return dependencies;
      const content = fs2.readFileSync(entryPath, "utf-8");
      const importMatches = content.matchAll(/import\s+(?:.*\s+from\s+)?['"](\.\/[^'"]+|\.\.\/[^'"]+)['"]/g);
      for (const match of importMatches) {
        dependencies.push({
          from: mainEntryFile,
          to: match[1],
          type: "import"
        });
      }
      const requireMatches = content.matchAll(/require\(['"](\.\/[^'"]+|\.\.\/[^'"]+)['"]\)/g);
      for (const match of requireMatches) {
        dependencies.push({
          from: mainEntryFile,
          to: match[1],
          type: "require"
        });
      }
    } catch {
    }
    return dependencies.slice(0, 20);
  }
  /**
   * 生成数据流描述
   */
  _generateDataFlowDescription(projectType, flowSteps) {
    var _a;
    const framework = ((_a = projectType.framework) == null ? void 0 : _a.toLowerCase()) || "";
    if (framework.includes("react") || framework.includes("vue")) {
      return "\u7528\u6237\u4EA4\u4E92 \u2192 \u4E8B\u4EF6\u5904\u7406 \u2192 \u72B6\u6001\u66F4\u65B0 \u2192 \u7EC4\u4EF6\u91CD\u6E32\u67D3 \u2192 DOM \u66F4\u65B0";
    }
    if (framework.includes("next") || framework.includes("nuxt")) {
      return "\u8BF7\u6C42 \u2192 \u670D\u52A1\u7AEF\u6E32\u67D3/\u6570\u636E\u83B7\u53D6 \u2192 \u9875\u9762\u7EC4\u4EF6 \u2192 \u5BA2\u6237\u7AEF Hydration \u2192 \u4EA4\u4E92";
    }
    if (framework.includes("express") || framework.includes("fastify")) {
      return "\u5BA2\u6237\u7AEF\u8BF7\u6C42 \u2192 \u4E2D\u95F4\u4EF6\u94FE \u2192 \u8DEF\u7531\u5339\u914D \u2192 \u63A7\u5236\u5668\u5904\u7406 \u2192 \u6570\u636E\u5E93\u64CD\u4F5C \u2192 \u54CD\u5E94\u8FD4\u56DE";
    }
    if (projectType.type.includes("extension")) {
      return "VSCode \u4E8B\u4EF6 \u2192 \u547D\u4EE4/Provider \u2192 \u4E1A\u52A1\u5904\u7406 \u2192 Webview/\u7F16\u8F91\u5668\u66F4\u65B0";
    }
    return "\u8F93\u5165 \u2192 \u5904\u7406 \u2192 \u8F93\u51FA";
  }
  /**
   * 查找项目入口点
   */
  _findEntryPoints(root, projectType) {
    const entryPoints = [];
    const files = fs2.readdirSync(root);
    const commonEntries = [
      "index.ts",
      "index.js",
      "main.ts",
      "main.js",
      "app.ts",
      "app.js",
      "main.py",
      "app.py",
      "run.py",
      "main.go",
      "cmd/main.go"
    ];
    for (const entry of commonEntries) {
      if (fs2.existsSync(path3.join(root, entry))) {
        entryPoints.push(entry);
      }
    }
    if (fs2.existsSync(path3.join(root, "src"))) {
      for (const entry of commonEntries) {
        if (fs2.existsSync(path3.join(root, "src", entry))) {
          entryPoints.push(`src/${entry}`);
        }
      }
    }
    return entryPoints.slice(0, 5);
  }
  _findConfigFiles(root) {
    const configPatterns = [
      "package.json",
      "tsconfig.json",
      ".eslintrc.js",
      ".prettierrc",
      "vite.config.ts",
      "webpack.config.js",
      "rollup.config.js",
      "requirements.txt",
      "pyproject.toml",
      "setup.py",
      "go.mod",
      "Cargo.toml",
      "pom.xml",
      "build.gradle",
      "docker-compose.yml",
      "Dockerfile",
      ".env.example"
    ];
    const files = fs2.readdirSync(root);
    return files.filter((f) => configPatterns.includes(f));
  }
  _extractScripts(root, projectType) {
    const scripts = [];
    if (projectType.includes("Node")) {
      try {
        const pkg = JSON.parse(fs2.readFileSync(path3.join(root, "package.json"), "utf-8"));
        if (pkg.scripts) {
          for (const [name, cmd] of Object.entries(pkg.scripts)) {
            scripts.push({
              name: `npm run ${name}`,
              command: String(cmd),
              description: this._getScriptDescription(name)
            });
          }
        }
      } catch {
      }
    }
    return scripts.slice(0, 10);
  }
  _generateContextSummary(info) {
    var _a, _b, _c, _d, _e, _f;
    const parts = [];
    parts.push(`${info.name} \u662F\u4E00\u4E2A ${info.type} \u9879\u76EE${info.framework ? `\uFF08${info.framework}\uFF09` : ""}\uFF0C\u4E3B\u8981\u4F7F\u7528 ${info.language} \u5F00\u53D1\u3002`);
    if ((_a = info.projectPurpose) == null ? void 0 : _a.description) {
      parts.push(`\u9879\u76EE\u529F\u80FD: ${info.projectPurpose.description}`);
    }
    parts.push(`\u9879\u76EE\u5305\u542B ${info.codeStats.totalFiles} \u4E2A\u4EE3\u7801\u6587\u4EF6\uFF0C\u7EA6 ${info.codeStats.totalLines.toLocaleString()} \u884C\u4EE3\u7801\u3002`);
    if ((_b = info.executionFlow) == null ? void 0 : _b.mainEntry) {
      parts.push(`\u4E3B\u5165\u53E3\u6587\u4EF6: ${info.executionFlow.mainEntry.file}\u3002`);
    }
    if ((_c = info.executionFlow) == null ? void 0 : _c.startCommand) {
      parts.push(`\u542F\u52A8\u547D\u4EE4: ${info.executionFlow.startCommand}\u3002`);
    }
    if (((_d = info.modules) == null ? void 0 : _d.length) > 0) {
      parts.push(`\u4E3B\u8981\u6A21\u5757\u5305\u62EC: ${info.modules.slice(0, 5).map((m) => m.name).join(", ")}\u3002`);
    }
    if (((_f = (_e = info.projectPurpose) == null ? void 0 : _e.techStack) == null ? void 0 : _f.length) > 0) {
      parts.push(`\u6280\u672F\u6808: ${info.projectPurpose.techStack.join(", ")}\u3002`);
    }
    return parts.join(" ");
  }
  _renderStructure(node, indent, maxDepth) {
    if (indent >= maxDepth)
      return "";
    const prefix = "  ".repeat(indent);
    let result = "";
    if (node.type === "directory") {
      result += `${prefix}\u{1F4C1} ${node.name}/
`;
      if (node.children) {
        for (const child of node.children.slice(0, 15)) {
          result += this._renderStructure(child, indent + 1, maxDepth);
        }
        if (node.children.length > 15) {
          result += `${prefix}  ... (${node.children.length - 15} more)
`;
        }
      }
    } else {
      result += `${prefix}\u{1F4C4} ${node.name}
`;
    }
    return result;
  }
  _getLanguage(filename) {
    const ext = path3.extname(filename).toLowerCase();
    const langMap = {
      ".ts": "TypeScript",
      ".tsx": "TypeScript",
      ".js": "JavaScript",
      ".jsx": "JavaScript",
      ".py": "Python",
      ".go": "Go",
      ".java": "Java",
      ".rs": "Rust",
      ".vue": "Vue",
      ".svelte": "Svelte",
      ".css": "CSS",
      ".scss": "SCSS",
      ".less": "Less",
      ".html": "HTML",
      ".json": "JSON",
      ".yaml": "YAML",
      ".yml": "YAML",
      ".md": "Markdown",
      ".sql": "SQL",
      ".sh": "Shell",
      ".bash": "Shell"
    };
    return langMap[ext] || "Unknown";
  }
  _countLines(filePath) {
    try {
      const content = fs2.readFileSync(filePath, "utf-8");
      return content.split("\n").length;
    } catch {
      return 0;
    }
  }
  _inferModuleType(dirName) {
    const typeMap = {
      "src": "\u6E90\u4EE3\u7801",
      "app": "\u5E94\u7528\u7A0B\u5E8F",
      "lib": "\u5E93",
      "components": "UI\u7EC4\u4EF6",
      "pages": "\u9875\u9762",
      "api": "API\u63A5\u53E3",
      "services": "\u670D\u52A1\u5C42",
      "utils": "\u5DE5\u5177\u51FD\u6570",
      "hooks": "React Hooks",
      "store": "\u72B6\u6001\u7BA1\u7406",
      "models": "\u6570\u636E\u6A21\u578B",
      "controllers": "\u63A7\u5236\u5668",
      "views": "\u89C6\u56FE",
      "routes": "\u8DEF\u7531",
      "middleware": "\u4E2D\u95F4\u4EF6",
      "config": "\u914D\u7F6E",
      "types": "\u7C7B\u578B\u5B9A\u4E49",
      "interfaces": "\u63A5\u53E3\u5B9A\u4E49"
    };
    return typeMap[dirName] || "\u6A21\u5757";
  }
  _getModuleDescription(dirName) {
    const descMap = {
      "src": "\u4E3B\u8981\u6E90\u4EE3\u7801\u76EE\u5F55",
      "app": "\u5E94\u7528\u7A0B\u5E8F\u5165\u53E3",
      "lib": "\u53EF\u590D\u7528\u5E93\u4EE3\u7801",
      "components": "UI \u7EC4\u4EF6\u5E93",
      "pages": "\u9875\u9762\u7EC4\u4EF6",
      "api": "API \u63A5\u53E3\u5B9A\u4E49",
      "services": "\u4E1A\u52A1\u903B\u8F91\u670D\u52A1",
      "utils": "\u901A\u7528\u5DE5\u5177\u51FD\u6570",
      "hooks": "React Hooks",
      "store": "\u5168\u5C40\u72B6\u6001\u7BA1\u7406",
      "models": "\u6570\u636E\u6A21\u578B\u5B9A\u4E49",
      "controllers": "\u8BF7\u6C42\u63A7\u5236\u5668",
      "views": "\u89C6\u56FE\u6A21\u677F",
      "routes": "\u8DEF\u7531\u914D\u7F6E",
      "middleware": "\u4E2D\u95F4\u4EF6",
      "config": "\u914D\u7F6E\u6587\u4EF6",
      "types": "TypeScript \u7C7B\u578B"
    };
    return descMap[dirName] || "";
  }
  _getScriptDescription(name) {
    const descMap = {
      "dev": "\u5F00\u53D1\u6A21\u5F0F",
      "start": "\u542F\u52A8\u5E94\u7528",
      "build": "\u6784\u5EFA\u9879\u76EE",
      "test": "\u8FD0\u884C\u6D4B\u8BD5",
      "lint": "\u4EE3\u7801\u68C0\u67E5",
      "format": "\u683C\u5F0F\u5316\u4EE3\u7801",
      "deploy": "\u90E8\u7F72",
      "watch": "\u76D1\u542C\u6A21\u5F0F"
    };
    return descMap[name] || "";
  }
  /**
   * 🆕 扫描项目中的 Markdown 文档
   */
  async _scanMarkdownDocs(root) {
    const docs = [];
    const maxDocs = 20;
    const maxDepth = 3;
    const scanDir = (dir, depth) => {
      if (depth > maxDepth || docs.length >= maxDocs)
        return;
      try {
        const items = fs2.readdirSync(dir);
        for (const item of items) {
          if (docs.length >= maxDocs)
            break;
          if (this._ignoreDirs.includes(item))
            continue;
          const fullPath = path3.join(dir, item);
          try {
            const stat = fs2.statSync(fullPath);
            if (stat.isDirectory()) {
              scanDir(fullPath, depth + 1);
            } else if (item.toLowerCase().endsWith(".md")) {
              const docInfo = this._parseMarkdownDoc(fullPath, root);
              if (docInfo) {
                docs.push(docInfo);
              }
            }
          } catch {
          }
        }
      } catch {
      }
    };
    scanDir(root, 0);
    docs.sort((a, b) => {
      if (a.docType === "readme" && b.docType !== "readme")
        return -1;
      if (b.docType === "readme" && a.docType !== "readme")
        return 1;
      return b.size - a.size;
    });
    return docs;
  }
  /**
   * 解析单个 Markdown 文档
   */
  _parseMarkdownDoc(filePath, root) {
    try {
      const stat = fs2.statSync(filePath);
      const content = fs2.readFileSync(filePath, "utf-8");
      const filename = path3.basename(filePath);
      const relativePath = path3.relative(root, filePath);
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : filename.replace(".md", "");
      const docType = this._detectDocType(filename, relativePath);
      const sectionMatches = content.matchAll(/^##\s+(.+)$/gm);
      const sections = [];
      for (const match of sectionMatches) {
        sections.push(match[1].trim());
        if (sections.length >= 10)
          break;
      }
      const summary = this._generateDocSummary(content);
      return {
        filename,
        relativePath,
        title,
        summary,
        docType,
        sections,
        size: stat.size
      };
    } catch {
      return null;
    }
  }
  /**
   * 检测文档类型
   */
  _detectDocType(filename, relativePath) {
    const lowerName = filename.toLowerCase();
    const lowerPath = relativePath.toLowerCase();
    if (lowerName === "readme.md")
      return "readme";
    if (lowerName.includes("changelog"))
      return "changelog";
    if (lowerName.includes("contributing"))
      return "contributing";
    if (lowerName.includes("api") || lowerPath.includes("api"))
      return "api";
    if (lowerName.includes("guide") || lowerName.includes("tutorial"))
      return "guide";
    if (lowerName.includes("architecture") || lowerName.includes("design"))
      return "architecture";
    return "other";
  }
  /**
   * 生成文档摘要
   */
  _generateDocSummary(content) {
    let summary = content;
    summary = summary.replace(/```[\s\S]*?```/g, "");
    summary = summary.replace(/`[^`]+`/g, "");
    summary = summary.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    summary = summary.replace(/!\[.*?\]\(.*?\)/g, "");
    summary = summary.replace(/^#+\s*/gm, "");
    summary = summary.replace(/\*\*([^*]+)\*\*/g, "$1");
    summary = summary.replace(/\*([^*]+)\*/g, "$1");
    summary = summary.replace(/__([^_]+)__/g, "$1");
    summary = summary.replace(/_([^_]+)_/g, "$1");
    summary = summary.replace(/^[\s]*[-*+]\s*/gm, "");
    summary = summary.replace(/^[\s]*\d+\.\s*/gm, "");
    summary = summary.replace(/\n{3,}/g, "\n\n");
    summary = summary.trim();
    if (summary.length > 2e3) {
      summary = summary.slice(0, 2e3) + "...";
    }
    return summary;
  }
};
var projectAnalyzer = new EnhancedProjectAnalyzer();

// src/extension/commands/SmartInputParser.ts
var QUESTION_PATTERNS = [
  // 中文疑问词
  /^(什么|怎么|如何|为什么|哪个|哪里|谁|多少|是否|能否|可以吗|是不是)/,
  /[？?]$/,
  /(吗|呢|吧)[？?]?$/,
  // 英文疑问词
  /^(what|how|why|where|when|who|which|can|could|would|should|is|are|do|does)/i,
  /\?$/
];
var REQUEST_PATTERNS = [
  // 中文请求词
  /^(请|帮我|帮忙|能不能|可以|麻烦|给我|我想|我要|我需要|创建|生成|写|编写|修改|优化|重构|解释|分析)/,
  /(一下|一个|帮我)$/,
  // 英文请求词
  /^(please|help|create|generate|write|modify|fix|explain|analyze|refactor|optimize|make)/i
];
var CODE_PATTERNS = [
  // 代码相关关键词
  /代码|函数|方法|类|接口|变量|bug|报错|错误|异常|测试|单元测试/,
  /code|function|method|class|interface|variable|bug|error|exception|test|unit test/i,
  // 代码块标识
  /```[\s\S]*```/,
  // 文件扩展名
  /\.(ts|tsx|js|jsx|py|go|java|rs|vue|css|html|json|md)(\s|$)/i
];
var NATURAL_TO_COMMAND_MAP = {
  // 项目相关 - 需要明确的项目分析意图
  "\u5206\u6790\u9879\u76EE": { pattern: /^(分析|了解|查看|初始化)(一下|下)?项目/, command: "/init" },
  "\u9879\u76EE\u7ED3\u6784": { pattern: /^(查看|显示|看下)?项目(结构|信息|概览)/, command: "/init" },
  // 文件相关 - 需要明确的文件操作意图
  "\u8BFB\u53D6\u6587\u4EF6": { pattern: /^(读取|打开|查看)(一下)?文件\s*[:：]?\s*\S+/, command: "/file" },
  "\u641C\u7D22\u4EE3\u7801": { pattern: /^(搜索|查找|找)(一下)?(代码|文件)\s*[:：]?\s*\S+/, command: "/search" },
  // Git相关 - 需要明确的git操作意图
  "\u67E5\u770B\u72B6\u6001": { pattern: /^(查看|显示)git?状态/, command: "/git status" },
  "\u63D0\u4EA4\u4EE3\u7801": { pattern: /^(git\s+)?commit|^提交(代码|更改)/, command: "/git commit" },
  "\u63A8\u9001\u4EE3\u7801": { pattern: /^(git\s+)?push|^推送(代码)?/, command: "/git push" },
  "\u62C9\u53D6\u4EE3\u7801": { pattern: /^(git\s+)?pull|^拉取(代码)?/, command: "/git pull" },
  // 图表相关 - 需要明确的图表类型
  "\u751F\u6210\u6D41\u7A0B\u56FE": { pattern: /^(生成|画|创建)(一个|一张)?流程图/, command: "/diagram flowchart" },
  "\u751F\u6210\u65F6\u5E8F\u56FE": { pattern: /^(生成|画|创建)(一个|一张)?时序图/, command: "/diagram sequence" },
  "\u751F\u6210\u7C7B\u56FE": { pattern: /^(生成|画|创建)(一个|一张)?类图/, command: "/diagram class" },
  "\u751F\u6210\u67B6\u6784\u56FE": { pattern: /^(生成|画|创建)(一个|一张)?架构图/, command: "/diagram architecture" },
  // 测试相关 - 需要明确的测试生成意图
  "\u751F\u6210\u6D4B\u8BD5": { pattern: /^(生成|写|创建)(一下)?(单元)?测试/, command: "/gentest" },
  "\u8FD0\u884C\u6D4B\u8BD5": { pattern: /^(运行|执行)(一下)?测试/, command: "/test" },
  // 构建相关
  "\u6784\u5EFA\u9879\u76EE": { pattern: /^(构建|编译)(一下)?项目/, command: "/build" },
  // 帮助 - 只在明确要求帮助时匹配，排除"帮我"、"帮忙"等
  "\u5E2E\u52A9": { pattern: /^(查看)?帮助$|^命令列表$|^怎么用$|^\/help$/, command: "/help" }
};
var SmartInputParser = class {
  /**
   * 解析用户输入
   */
  parse(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        type: "question" /* NATURAL_QUESTION */,
        originalInput: input,
        cleanInput: "",
        confidence: 1
      };
    }
    if (trimmed.startsWith("/")) {
      return this._parseCommand(trimmed);
    }
    if (trimmed.startsWith("!")) {
      return this._parseShellCommand(trimmed);
    }
    return this._parseNaturalLanguage(trimmed);
  }
  /**
   * 解析斜杠命令
   */
  _parseCommand(input) {
    return {
      type: "command" /* COMMAND */,
      originalInput: input,
      cleanInput: input,
      confidence: 1,
      detectedIntent: "execute_command"
    };
  }
  /**
   * 解析 Shell 命令
   */
  _parseShellCommand(input) {
    const command = input.substring(1).trim();
    return {
      type: "shell" /* SHELL_COMMAND */,
      originalInput: input,
      cleanInput: command,
      confidence: 1,
      detectedIntent: "run_shell",
      possibleCommand: `/run ${command}`
    };
  }
  /**
   * 解析自然语言
   */
  _parseNaturalLanguage(input) {
    const lowerInput = input.toLowerCase();
    let confidence = 0.5;
    let type = "question" /* NATURAL_QUESTION */;
    let detectedIntent;
    let possibleCommand;
    let suggestion;
    for (const [name, info] of Object.entries(NATURAL_TO_COMMAND_MAP)) {
      if (info.pattern.test(input)) {
        possibleCommand = info.command;
        suggestion = `\u{1F4A1} \u68C0\u6D4B\u5230\u53EF\u80FD\u60F3\u6267\u884C: ${info.command}\uFF0C\u76F4\u63A5\u8F93\u5165\u547D\u4EE4\u4F1A\u66F4\u5FEB\u54E6`;
        confidence = 0.7;
        type = "mixed" /* MIXED */;
        detectedIntent = "command_hint";
        break;
      }
    }
    const isQuestion = QUESTION_PATTERNS.some((p) => p.test(input));
    if (isQuestion) {
      type = "question" /* NATURAL_QUESTION */;
      confidence = Math.max(confidence, 0.8);
      detectedIntent = "asking_question";
    }
    const isRequest = REQUEST_PATTERNS.some((p) => p.test(input));
    if (isRequest) {
      type = "request" /* NATURAL_REQUEST */;
      confidence = Math.max(confidence, 0.8);
      detectedIntent = "making_request";
    }
    const isCodeRelated = CODE_PATTERNS.some((p) => p.test(input));
    if (isCodeRelated) {
      type = "code" /* CODE_REQUEST */;
      confidence = Math.max(confidence, 0.85);
      detectedIntent = "code_related";
    }
    const commandLikePatterns = [
      /^(init|help|clear|search|build|test|git|diagram|gentest)\s*/i
    ];
    for (const pattern of commandLikePatterns) {
      const match = input.match(pattern);
      if (match) {
        possibleCommand = `/${match[1].toLowerCase()}${input.substring(match[0].length).trim() ? " " + input.substring(match[0].length).trim() : ""}`;
        suggestion = `\u{1F4A1} \u4F60\u662F\u5426\u60F3\u6267\u884C\u547D\u4EE4\uFF1F\u8BD5\u8BD5\u8F93\u5165: ${possibleCommand}`;
        break;
      }
    }
    return {
      type,
      originalInput: input,
      cleanInput: input,
      confidence,
      suggestion,
      detectedIntent,
      possibleCommand
    };
  }
  /**
   * 获取输入提示
   */
  getInputHints(input) {
    const hints = [];
    const parsed = this.parse(input);
    if (parsed.suggestion) {
      hints.push(parsed.suggestion);
    }
    if (parsed.type === "question" /* NATURAL_QUESTION */) {
      hints.push("\u{1F4AC} \u8FD9\u770B\u8D77\u6765\u662F\u4E00\u4E2A\u95EE\u9898\uFF0CAI \u5C06\u76F4\u63A5\u56DE\u7B54");
    } else if (parsed.type === "request" /* NATURAL_REQUEST */) {
      hints.push("\u{1F527} \u8FD9\u770B\u8D77\u6765\u662F\u4E00\u4E2A\u8BF7\u6C42\uFF0CAI \u5C06\u5C1D\u8BD5\u5E2E\u4F60\u5B8C\u6210");
    } else if (parsed.type === "code" /* CODE_REQUEST */) {
      hints.push("\u{1F4BB} \u68C0\u6D4B\u5230\u4EE3\u7801\u76F8\u5173\u5185\u5BB9\uFF0CAI \u5C06\u4EE5\u4EE3\u7801\u89C6\u89D2\u5206\u6790");
    }
    return hints;
  }
  /**
   * 建议转换为命令
   */
  suggestCommand(input) {
    const parsed = this.parse(input);
    return parsed.possibleCommand || null;
  }
  /**
   * 判断是否应该直接执行命令
   */
  shouldExecuteAsCommand(input) {
    return input.startsWith("/") || input.startsWith("!");
  }
  /**
   * 智能判断用户意图并给出建议
   */
  analyzeIntent(input) {
    const parsed = this.parse(input);
    const intents = [];
    const actions = [];
    let primaryIntent = "\u5BF9\u8BDD";
    if (parsed.type === "command" /* COMMAND */) {
      primaryIntent = "\u6267\u884C\u547D\u4EE4";
    } else if (parsed.type === "shell" /* SHELL_COMMAND */) {
      primaryIntent = "\u8FD0\u884C\u7EC8\u7AEF\u547D\u4EE4";
    } else if (parsed.type === "code" /* CODE_REQUEST */) {
      primaryIntent = "\u4EE3\u7801\u5904\u7406";
      intents.push("\u53EF\u80FD\u9700\u8981\u751F\u6210\u4EE3\u7801", "\u53EF\u80FD\u9700\u8981\u4FEE\u590D\u4EE3\u7801", "\u53EF\u80FD\u9700\u8981\u89E3\u91CA\u4EE3\u7801");
      actions.push(
        { label: "\u751F\u6210\u6D4B\u8BD5", action: "/gentest" },
        { label: "\u751F\u6210\u56FE\u8868", action: "/diagram" }
      );
    } else if (parsed.type === "request" /* NATURAL_REQUEST */) {
      primaryIntent = "\u8BF7\u6C42\u5E2E\u52A9";
      if (parsed.possibleCommand) {
        actions.push({ label: `\u6267\u884C: ${parsed.possibleCommand}`, action: parsed.possibleCommand });
      }
    }
    return {
      primaryIntent,
      secondaryIntents: intents,
      suggestedActions: actions
    };
  }
};
var smartInputParser = new SmartInputParser();

// src/extension/chatview/utils/TaskStateManager.ts
var TaskStateManager = class {
  constructor(postMessage) {
    this.postMessage = postMessage;
    this.taskStates = {
      chat: { status: "idle", timestamp: 0 },
      diagram: { status: "idle", timestamp: 0 },
      test: { status: "idle", timestamp: 0 },
      command: { status: "idle", timestamp: 0 },
      skill: { status: "idle", timestamp: 0 },
      mcp: { status: "idle", timestamp: 0 }
    };
  }
  /**
   * 获取所有任务状态
   */
  getTaskStates() {
    return this.taskStates;
  }
  /**
   * 获取特定任务的状态
   */
  getTaskState(taskType) {
    return this.taskStates[taskType];
  }
  /**
   * 检查特定任务是否正在运行
   */
  isRunning(taskType) {
    return this.taskStates[taskType].status === "running";
  }
  /**
   * 检查chat任务是否正在处理（向后兼容）
   */
  get isProcessing() {
    return this.taskStates.chat.status === "running";
  }
  /**
   * 更新任务状态
   */
  updateStatus(taskType, status, message) {
    const now = Date.now();
    this.taskStates[taskType] = {
      ...this.taskStates[taskType],
      status,
      message,
      timestamp: now
    };
    if (taskType !== "chat") {
      this.postMessage({
        type: "taskStatus",
        taskType,
        status,
        message,
        timestamp: now
      });
    }
    if (status === "success") {
      setTimeout(() => {
        if (this.taskStates[taskType].status === "success" && this.taskStates[taskType].timestamp === now) {
          this.updateStatus(taskType, "idle");
        }
      }, 3e3);
    }
    if (status === "error") {
      setTimeout(() => {
        if (this.taskStates[taskType].status === "error" && this.taskStates[taskType].timestamp === now) {
          this.updateStatus(taskType, "idle");
        }
      }, 5e3);
    }
  }
  /**
   * 取消特定任务
   */
  cancelTask(taskType) {
    const taskState = this.taskStates[taskType];
    if (taskState.abortController) {
      taskState.abortController.abort();
    }
    this.updateStatus(taskType, "idle", "\u5DF2\u53D6\u6D88");
  }
  /**
   * 设置任务的AbortController
   */
  setAbortController(taskType, controller) {
    this.taskStates[taskType].abortController = controller;
  }
  /**
   * 重置所有任务状态
   */
  resetAll() {
    for (const taskType of Object.keys(this.taskStates)) {
      this.taskStates[taskType] = { status: "idle", timestamp: 0 };
    }
  }
};

// src/extension/chatview/handlers/SessionHandler.ts
var vscode5 = __toESM(require("vscode"));
var SessionHandler = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async handle(data) {
    switch (data.type) {
      case "newChat":
        await this.createNewChat();
        return true;
      case "clearChat":
        await this.clearChat();
        return true;
      case "renameSession":
        this.renameSession(data.sessionId, data.newTitle);
        return true;
      case "deleteSession":
        this.deleteSession(data.sessionId);
        return true;
      case "getSessionList":
        this.sendSessionList();
        return true;
      case "loadSession":
        await this.loadSession(data.sessionId);
        return true;
      case "verifySessionState":
        await this.verifySessionState(data.sessionId);
        return true;
      default:
        return false;
    }
  }
  /**
   * 创建新会话
   */
  async createNewChat() {
    const newSession = this.ctx.sessionManager.createSession();
    console.log("[SessionHandler] Created new chat session:", newSession.id);
    this.ctx.postMessage({
      type: "chatCleared",
      sessionId: newSession.id
    });
  }
  /**
   * 清空当前会话
   */
  async clearChat() {
    await this.createNewChat();
  }
  /**
   * 重命名会话
   */
  renameSession(sessionId, newTitle) {
    const success = this.ctx.sessionManager.renameSession(sessionId, newTitle);
    if (success) {
      this.sendSessionList();
      vscode5.window.showInformationMessage(`\u4F1A\u8BDD\u5DF2\u91CD\u547D\u540D\u4E3A: ${newTitle}`);
    } else {
      vscode5.window.showErrorMessage("\u91CD\u547D\u540D\u5931\u8D25");
    }
  }
  /**
   * 删除会话
   */
  deleteSession(sessionId) {
    this.ctx.sessionManager.deleteSession(sessionId);
    this.sendSessionList();
    vscode5.window.showInformationMessage("\u4F1A\u8BDD\u5DF2\u5220\u9664");
  }
  /**
   * 发送会话列表
   */
  sendSessionList() {
    const sessions = this.ctx.sessionManager.getSessionList();
    this.ctx.postMessage({ type: "sessionList", sessions });
  }
  /**
   * 加载会话
   */
  async loadSession(sessionId) {
    const session = await this.ctx.sessionManager.loadSession(sessionId);
    if (session) {
      this.ctx.postMessage({
        type: "sessionLoaded",
        messages: session.messages || [],
        sessionId: session.id,
        sessionTitle: session.title
      });
      vscode5.window.showInformationMessage(`\u5DF2\u5207\u6362\u5230\u4F1A\u8BDD: ${session.title}`);
    } else {
      vscode5.window.showErrorMessage("\u65E0\u6CD5\u52A0\u8F7D\u4F1A\u8BDD");
    }
  }
  /**
   * 验证会话状态
   * 处理前端和后端会话状态同步
   */
  async verifySessionState(requestedSessionId) {
    console.log("[SessionHandler] Verifying session state, requested sessionId:", requestedSessionId);
    if (requestedSessionId) {
      const currentSession = this.ctx.sessionManager.currentSession;
      if (currentSession && currentSession.id === requestedSessionId) {
        console.log("[SessionHandler] Session already matches, no action needed");
        return;
      }
      console.log("[SessionHandler] Loading requested session from storage:", requestedSessionId);
      const loaded = await this.ctx.sessionManager.loadSession(requestedSessionId);
      if (loaded) {
        console.log("[SessionHandler] Session restored successfully:", loaded.id, "messages:", loaded.messages.length);
        this.ctx.postMessage({
          type: "sessionLoaded",
          messages: loaded.messages || [],
          sessionId: loaded.id,
          sessionTitle: loaded.title
        });
        return;
      }
      console.log("[SessionHandler] Requested session not found, trying last session...");
    }
    if (!this.ctx.sessionManager.currentSession) {
      console.log("[SessionHandler] No current session, restoring last session...");
      const restored = await this.ctx.sessionManager.continueLastSession();
      if (restored) {
        console.log("[SessionHandler] Last session restored:", restored.id);
        this.ctx.postMessage({
          type: "sessionLoaded",
          messages: restored.messages || [],
          sessionId: restored.id,
          sessionTitle: restored.title
        });
        return;
      }
      console.log("[SessionHandler] No sessions available, creating new session");
      const newSession = this.ctx.sessionManager.createSession();
      this.ctx.postMessage({
        type: "chatCleared",
        sessionId: newSession.id
      });
    }
  }
  /**
   * 显示会话选择器
   */
  async showSessionPicker() {
    const sessions = this.ctx.sessionManager.getSessionList();
    if (sessions.length === 0) {
      vscode5.window.showInformationMessage("\u6682\u65E0\u4F1A\u8BDD\u5386\u53F2");
      return;
    }
    const items = sessions.map((s) => ({
      label: s.title,
      description: `${s.messageCount} \u6761\u6D88\u606F`,
      detail: new Date(s.updatedAt).toLocaleString(),
      id: s.id
    }));
    const selected = await vscode5.window.showQuickPick(items, {
      placeHolder: "\u9009\u62E9\u4E00\u4E2A\u4F1A\u8BDD\u6062\u590D",
      matchOnDescription: true
    });
    if (selected) {
      await this.loadSession(selected.id);
    }
  }
  /**
   * 继续上一个会话
   */
  async continueLastSession() {
    await this.ctx.sessionManager.continueLastSession();
    this.sendCurrentState();
  }
  /**
   * 发送当前状态
   */
  sendCurrentState() {
    const session = this.ctx.sessionManager.currentSession;
    const modelConfig = this.ctx.configManager.getModelConfig();
    this.ctx.postMessage({
      type: "init",
      messages: (session == null ? void 0 : session.messages) || [],
      modelConfig,
      allModels: this.ctx.configManager.getAllModels(),
      sessionId: (session == null ? void 0 : session.id) || null
    });
  }
  /**
   * 发送当前状态（包括流式消息）
   */
  sendCurrentStateWithStreaming() {
    const session = this.ctx.sessionManager.currentSession;
    const modelConfig = this.ctx.configManager.getModelConfig();
    let messages = [...(session == null ? void 0 : session.messages) || []];
    if (this.ctx.currentStreamingMessage) {
      const streamingMsgId = this.ctx.currentStreamingMessage.id;
      const savedMsgIndex = messages.findIndex((m) => m.id === streamingMsgId);
      if (savedMsgIndex !== -1) {
        messages[savedMsgIndex] = { ...this.ctx.currentStreamingMessage };
        console.log("[SessionHandler] Using latest streaming message content:", streamingMsgId);
      }
    }
    this.ctx.postMessage({
      type: "init",
      messages,
      modelConfig,
      allModels: this.ctx.configManager.getAllModels(),
      sessionId: (session == null ? void 0 : session.id) || null,
      isStreaming: this.ctx.isTaskRunning("chat") && !!this.ctx.currentStreamingMessage
    });
    if (this.ctx.isTaskRunning("chat") && this.ctx.currentStreamingMessage) {
      this.ctx.postMessage({
        type: "resumeStreaming",
        messageId: this.ctx.currentStreamingMessage.id,
        content: this.ctx.currentStreamingMessage.content
      });
    }
  }
  /**
   * 清空所有数据并重置状态
   */
  clearAllDataAndReset() {
    const newSession = this.ctx.sessionManager.createSession();
    this.ctx.postMessage({
      type: "chatCleared",
      sessionId: newSession.id
    });
    console.log("[SessionHandler] All data cleared, new session created:", newSession.id);
  }
};

// src/extension/chatview/handlers/ChatMessageHandler.ts
var vscode7 = __toESM(require("vscode"));
init_shared();

// src/extension/i18n/I18nManager.ts
var vscode6 = __toESM(require("vscode"));
var SUPPORTED_LANGUAGES = [
  {
    code: "zh-CN",
    name: "Chinese (Simplified)",
    nativeName: "\u7B80\u4F53\u4E2D\u6587",
    aiPromptSuffix: "\u8BF7\u4F7F\u7528\u4E2D\u6587\u56DE\u590D\u3002"
  },
  {
    code: "en-US",
    name: "English (US)",
    nativeName: "English",
    aiPromptSuffix: "Please respond in English."
  }
];
var ZH_CN = {
  common: {
    confirm: "\u786E\u8BA4",
    cancel: "\u53D6\u6D88",
    save: "\u4FDD\u5B58",
    delete: "\u5220\u9664",
    edit: "\u7F16\u8F91",
    copy: "\u590D\u5236",
    close: "\u5173\u95ED",
    loading: "\u52A0\u8F7D\u4E2D...",
    error: "\u9519\u8BEF",
    success: "\u6210\u529F",
    warning: "\u8B66\u544A",
    info: "\u4FE1\u606F",
    yes: "\u662F",
    no: "\u5426",
    ok: "\u786E\u5B9A",
    retry: "\u91CD\u8BD5",
    refresh: "\u5237\u65B0",
    search: "\u641C\u7D22",
    clear: "\u6E05\u9664",
    reset: "\u91CD\u7F6E"
  },
  chat: {
    newConversation: "\u65B0\u5EFA\u5BF9\u8BDD",
    clearContext: "\u6E05\u9664\u4E0A\u4E0B\u6587",
    compactContext: "\u538B\u7F29\u4E0A\u4E0B\u6587",
    sendMessage: "\u53D1\u9001\u6D88\u606F",
    stopGeneration: "\u505C\u6B62\u751F\u6210",
    regenerate: "\u91CD\u65B0\u751F\u6210",
    inputPlaceholder: "\u8F93\u5165\u6D88\u606F... \u6309 Enter \u53D1\u9001\uFF0CShift+Enter \u6362\u884C",
    thinking: "\u601D\u8003\u4E2D...",
    generating: "\u751F\u6210\u4E2D...",
    completed: "\u5DF2\u5B8C\u6210",
    error: "\u51FA\u9519\u4E86",
    noApiKey: "\u8BF7\u5148\u8BBE\u7F6E API Key",
    selectProvider: "\u9009\u62E9\u63D0\u4F9B\u5546",
    selectModel: "\u9009\u62E9\u6A21\u578B",
    temperature: "\u6E29\u5EA6",
    maxTokens: "\u6700\u5927 Token \u6570"
  },
  task: {
    idle: "\u7A7A\u95F2",
    running: "\u8FD0\u884C\u4E2D",
    success: "\u6210\u529F",
    failed: "\u5931\u8D25",
    cancelled: "\u5DF2\u53D6\u6D88",
    pending: "\u7B49\u5F85\u4E2D",
    generatingDiagram: "\u6B63\u5728\u751F\u6210\u6D41\u7A0B\u56FE...",
    diagramCompleted: "\u6D41\u7A0B\u56FE\u751F\u6210\u5B8C\u6210",
    generatingTest: "\u6B63\u5728\u751F\u6210\u6D4B\u8BD5\u4EE3\u7801...",
    testCompleted: "\u6D4B\u8BD5\u751F\u6210\u5B8C\u6210",
    executingCommand: "\u6B63\u5728\u6267\u884C\u547D\u4EE4...",
    commandCompleted: "\u547D\u4EE4\u6267\u884C\u5B8C\u6210",
    executingSkill: "\u6B63\u5728\u6267\u884C\u6280\u80FD...",
    skillCompleted: "\u6280\u80FD\u6267\u884C\u5B8C\u6210",
    parallelTasksRunning: "\u6B63\u5728\u5E76\u884C\u6267\u884C {count} \u4E2A\u4EFB\u52A1...",
    parallelTasksCompleted: "\u5DF2\u5B8C\u6210 {completed}/{total} \u4E2A\u4EFB\u52A1",
    taskProgress: "\u4EFB\u52A1\u8FDB\u5EA6: {progress}%"
  },
  diagram: {
    title: "\u6D41\u7A0B\u56FE",
    flowchart: "\u6D41\u7A0B\u56FE",
    sequence: "\u65F6\u5E8F\u56FE",
    class: "\u7C7B\u56FE",
    state: "\u72B6\u6001\u56FE",
    er: "ER\u56FE",
    gantt: "\u7518\u7279\u56FE",
    pie: "\u997C\u56FE",
    mindmap: "\u601D\u7EF4\u5BFC\u56FE",
    architecture: "\u67B6\u6784\u56FE",
    generate: "\u751F\u6210\u56FE\u8868",
    export: "\u5BFC\u51FA\u56FE\u8868",
    edit: "\u7F16\u8F91\u56FE\u8868",
    preview: "\u9884\u89C8",
    save: "\u4FDD\u5B58\u56FE\u8868",
    history: "\u5386\u53F2\u8BB0\u5F55",
    invalidCode: "\u56FE\u8868\u4EE3\u7801\u65E0\u6548"
  },
  test: {
    title: "\u6D4B\u8BD5",
    generate: "\u751F\u6210\u6D4B\u8BD5",
    run: "\u8FD0\u884C\u6D4B\u8BD5",
    save: "\u4FDD\u5B58\u6D4B\u8BD5",
    fix: "\u4FEE\u590D\u6D4B\u8BD5",
    refine: "\u4F18\u5316\u6D4B\u8BD5",
    framework: "\u6D4B\u8BD5\u6846\u67B6",
    coverage: "\u8986\u76D6\u7387",
    passed: "\u901A\u8FC7",
    failed: "\u5931\u8D25",
    skipped: "\u8DF3\u8FC7",
    history: "\u6D4B\u8BD5\u5386\u53F2"
  },
  mcp: {
    title: "MCP \u670D\u52A1\u5668",
    serverManagement: "\u670D\u52A1\u5668\u7BA1\u7406",
    addServer: "\u6DFB\u52A0\u670D\u52A1\u5668",
    removeServer: "\u79FB\u9664\u670D\u52A1\u5668",
    connectServer: "\u8FDE\u63A5\u670D\u52A1\u5668",
    disconnectServer: "\u65AD\u5F00\u8FDE\u63A5",
    serverStatus: "\u670D\u52A1\u5668\u72B6\u6001",
    connected: "\u5DF2\u8FDE\u63A5",
    disconnected: "\u672A\u8FDE\u63A5",
    connecting: "\u8FDE\u63A5\u4E2D...",
    error: "\u8FDE\u63A5\u9519\u8BEF",
    tools: "\u53EF\u7528\u5DE5\u5177",
    resources: "\u53EF\u7528\u8D44\u6E90",
    prompts: "\u53EF\u7528\u63D0\u793A",
    demoConfigs: "Demo \u914D\u7F6E",
    importConfig: "\u5BFC\u5165\u914D\u7F6E",
    exportConfig: "\u5BFC\u51FA\u914D\u7F6E"
  },
  skill: {
    title: "AI \u6280\u80FD",
    dependencyCheck: "\u4F9D\u8D56\u5B89\u5168\u68C0\u67E5",
    testArchitect: "\u6D4B\u8BD5\u67B6\u6784\u5E08",
    codeReviewer: "\u4EE3\u7801\u5BA1\u67E5",
    excelProcessor: "Excel \u5904\u7406",
    wordProcessor: "Word \u5904\u7406",
    pptProcessor: "PPT \u5904\u7406",
    toolMaker: "\u5DE5\u5177\u5236\u4F5C",
    executing: "\u6B63\u5728\u6267\u884C...",
    completed: "\u6267\u884C\u5B8C\u6210",
    failed: "\u6267\u884C\u5931\u8D25"
  },
  errors: {
    networkError: "\u7F51\u7EDC\u8FDE\u63A5\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8BBE\u7F6E",
    apiKeyMissing: "API Key \u672A\u8BBE\u7F6E\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E",
    apiKeyInvalid: "API Key \u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E",
    modelNotFound: "\u6A21\u578B\u4E0D\u5B58\u5728\u6216\u4E0D\u53EF\u7528",
    rateLimited: "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5",
    serverError: "\u670D\u52A1\u5668\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
    timeout: "\u8BF7\u6C42\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5",
    unknown: "\u672A\u77E5\u9519\u8BEF",
    noWorkspace: "\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u9879\u76EE\u6587\u4EF6\u5939",
    fileNotFound: "\u6587\u4EF6\u4E0D\u5B58\u5728",
    permissionDenied: "\u6743\u9650\u4E0D\u8DB3"
  },
  ai: {
    systemPrompt: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u7F16\u7A0B\u52A9\u624B\uFF0C\u64C5\u957F\u4EE3\u7801\u5206\u6790\u3001\u95EE\u9898\u89E3\u7B54\u548C\u6280\u672F\u6307\u5BFC\u3002\u8BF7\u4F7F\u7528\u4E2D\u6587\u56DE\u590D\u7528\u6237\u7684\u95EE\u9898\uFF0C\u4FDD\u6301\u4E13\u4E1A\u3001\u6E05\u6670\u3001\u6709\u5E2E\u52A9\u7684\u6001\u5EA6\u3002",
    codeAssistantPrompt: "\u4F60\u662F\u4E00\u4E2A\u4EE3\u7801\u4E13\u5BB6\u3002\u8BF7\u5206\u6790\u4EE3\u7801\u5E76\u63D0\u4F9B\u4E13\u4E1A\u7684\u5EFA\u8BAE\u3002\u4F7F\u7528\u4E2D\u6587\u56DE\u590D\u3002",
    diagramAssistantPrompt: "\u4F60\u662F\u4E00\u4E2A\u56FE\u8868\u751F\u6210\u4E13\u5BB6\u3002\u8BF7\u6839\u636E\u9700\u6C42\u751F\u6210\u6E05\u6670\u3001\u4E13\u4E1A\u7684\u56FE\u8868\u4EE3\u7801\u3002\u4F7F\u7528\u4E2D\u6587\u6807\u7B7E\u3002",
    testAssistantPrompt: "\u4F60\u662F\u4E00\u4E2A\u6D4B\u8BD5\u4E13\u5BB6\u3002\u8BF7\u751F\u6210\u5168\u9762\u3001\u53EF\u9760\u7684\u6D4B\u8BD5\u4EE3\u7801\u3002\u4F7F\u7528\u4E2D\u6587\u6CE8\u91CA\u3002"
  }
};
var EN_US = {
  common: {
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    copy: "Copy",
    close: "Close",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    yes: "Yes",
    no: "No",
    ok: "OK",
    retry: "Retry",
    refresh: "Refresh",
    search: "Search",
    clear: "Clear",
    reset: "Reset"
  },
  chat: {
    newConversation: "New Conversation",
    clearContext: "Clear Context",
    compactContext: "Compact Context",
    sendMessage: "Send Message",
    stopGeneration: "Stop Generation",
    regenerate: "Regenerate",
    inputPlaceholder: "Type a message... Press Enter to send, Shift+Enter for new line",
    thinking: "Thinking...",
    generating: "Generating...",
    completed: "Completed",
    error: "Error occurred",
    noApiKey: "Please set up your API Key first",
    selectProvider: "Select Provider",
    selectModel: "Select Model",
    temperature: "Temperature",
    maxTokens: "Max Tokens"
  },
  task: {
    idle: "Idle",
    running: "Running",
    success: "Success",
    failed: "Failed",
    cancelled: "Cancelled",
    pending: "Pending",
    generatingDiagram: "Generating diagram...",
    diagramCompleted: "Diagram generation completed",
    generatingTest: "Generating test code...",
    testCompleted: "Test generation completed",
    executingCommand: "Executing command...",
    commandCompleted: "Command execution completed",
    executingSkill: "Executing skill...",
    skillCompleted: "Skill execution completed",
    parallelTasksRunning: "Running {count} tasks in parallel...",
    parallelTasksCompleted: "Completed {completed}/{total} tasks",
    taskProgress: "Task progress: {progress}%"
  },
  diagram: {
    title: "Diagram",
    flowchart: "Flowchart",
    sequence: "Sequence Diagram",
    class: "Class Diagram",
    state: "State Diagram",
    er: "ER Diagram",
    gantt: "Gantt Chart",
    pie: "Pie Chart",
    mindmap: "Mind Map",
    architecture: "Architecture Diagram",
    generate: "Generate Diagram",
    export: "Export Diagram",
    edit: "Edit Diagram",
    preview: "Preview",
    save: "Save Diagram",
    history: "History",
    invalidCode: "Invalid diagram code"
  },
  test: {
    title: "Test",
    generate: "Generate Test",
    run: "Run Test",
    save: "Save Test",
    fix: "Fix Test",
    refine: "Refine Test",
    framework: "Test Framework",
    coverage: "Coverage",
    passed: "Passed",
    failed: "Failed",
    skipped: "Skipped",
    history: "Test History"
  },
  mcp: {
    title: "MCP Server",
    serverManagement: "Server Management",
    addServer: "Add Server",
    removeServer: "Remove Server",
    connectServer: "Connect Server",
    disconnectServer: "Disconnect",
    serverStatus: "Server Status",
    connected: "Connected",
    disconnected: "Disconnected",
    connecting: "Connecting...",
    error: "Connection Error",
    tools: "Available Tools",
    resources: "Available Resources",
    prompts: "Available Prompts",
    demoConfigs: "Demo Configs",
    importConfig: "Import Config",
    exportConfig: "Export Config"
  },
  skill: {
    title: "AI Skills",
    dependencyCheck: "Dependency Security Check",
    testArchitect: "Test Architect",
    codeReviewer: "Code Reviewer",
    excelProcessor: "Excel Processor",
    wordProcessor: "Word Processor",
    pptProcessor: "PPT Processor",
    toolMaker: "Tool Maker",
    executing: "Executing...",
    completed: "Execution completed",
    failed: "Execution failed"
  },
  errors: {
    networkError: "Network connection error, please check your network",
    apiKeyMissing: "API Key not set, please configure in settings",
    apiKeyInvalid: "Invalid API Key, please check configuration",
    modelNotFound: "Model not found or unavailable",
    rateLimited: "Rate limited, please try again later",
    serverError: "Server error, please try again later",
    timeout: "Request timeout, please retry",
    unknown: "Unknown error",
    noWorkspace: "Please open a project folder first",
    fileNotFound: "File not found",
    permissionDenied: "Permission denied"
  },
  ai: {
    systemPrompt: "You are a professional programming assistant skilled in code analysis, problem solving, and technical guidance. Please respond in English and maintain a professional, clear, and helpful attitude.",
    codeAssistantPrompt: "You are a code expert. Please analyze the code and provide professional advice. Respond in English.",
    diagramAssistantPrompt: "You are a diagram generation expert. Please generate clear and professional diagram code based on requirements. Use English labels.",
    testAssistantPrompt: "You are a testing expert. Please generate comprehensive and reliable test code. Use English comments."
  }
};
var TRANSLATIONS = {
  "zh-CN": ZH_CN,
  "en-US": EN_US
};
var _I18nManager = class _I18nManager {
  constructor() {
    this.currentLanguage = "zh-CN";
    this.context = null;
  }
  static getInstance() {
    if (!_I18nManager.instance) {
      _I18nManager.instance = new _I18nManager();
    }
    return _I18nManager.instance;
  }
  /**
   * 初始化
   */
  initialize(context) {
    this.context = context;
    const config = vscode6.workspace.getConfiguration("aiAssistant");
    const savedLanguage = config.get("language");
    if (savedLanguage && TRANSLATIONS[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    } else {
      const vscodeLanguage = vscode6.env.language;
      if (vscodeLanguage.startsWith("zh")) {
        this.currentLanguage = "zh-CN";
      } else {
        this.currentLanguage = "en-US";
      }
    }
  }
  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  /**
   * 获取语言信息
   */
  getLanguageInfo() {
    return SUPPORTED_LANGUAGES.find((l) => l.code === this.currentLanguage);
  }
  /**
   * 设置语言
   */
  async setLanguage(language) {
    if (!TRANSLATIONS[language]) {
      throw new Error(`Unsupported language: ${language}`);
    }
    this.currentLanguage = language;
    const config = vscode6.workspace.getConfiguration("aiAssistant");
    await config.update("language", language, vscode6.ConfigurationTarget.Global);
  }
  /**
   * 获取翻译文本
   */
  t(category, key) {
    const translations = TRANSLATIONS[this.currentLanguage];
    const categoryTranslations = translations[category];
    return categoryTranslations[key] || `[${String(category)}.${String(key)}]`;
  }
  /**
   * 获取带参数的翻译文本
   */
  tf(category, key, params) {
    let text = this.t(category, key);
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{${param}}`, String(value));
    }
    return text;
  }
  /**
   * 获取 AI 系统提示
   */
  getAISystemPrompt(type = "general") {
    const translations = TRANSLATIONS[this.currentLanguage];
    switch (type) {
      case "code":
        return translations.ai.codeAssistantPrompt;
      case "diagram":
        return translations.ai.diagramAssistantPrompt;
      case "test":
        return translations.ai.testAssistantPrompt;
      default:
        return translations.ai.systemPrompt;
    }
  }
  /**
   * 获取 AI 回复语言提示后缀
   */
  getAILanguageSuffix() {
    return this.getLanguageInfo().aiPromptSuffix;
  }
  /**
   * 获取完整的 AI 系统提示（包含语言指示）
   */
  getFullAIPrompt(type = "general") {
    return `${this.getAISystemPrompt(type)}

${this.getAILanguageSuffix()}`;
  }
  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }
  /**
   * 检查是否为中文
   */
  isChinese() {
    return this.currentLanguage === "zh-CN";
  }
  /**
   * 检查是否为英文
   */
  isEnglish() {
    return this.currentLanguage === "en-US";
  }
};
_I18nManager.instance = null;
var I18nManager = _I18nManager;
var i18n = I18nManager.getInstance();
function t(category, key) {
  return i18n.t(category, key);
}

// src/extension/memory/MemoryManager.ts
init_shared();
var STORAGE_KEY = "aiAssistant.memory.v2";
var SHORT_TERM_TTL = 2 * 60 * 60 * 1e3;
var SHORT_TERM_MAX = 40;
var LONG_TERM_MAX = 100;
var PROMOTE_ACCESS = 3;
var PROMOTE_IMPORTANCE = 0.7;
var COMPRESS_INTERVAL = 30 * 60 * 1e3;
var CLEANUP_INTERVAL = 10 * 60 * 1e3;
var SAVE_DEBOUNCE = 3e3;
var STOP_WORDS = /* @__PURE__ */ new Set([
  "\u7684",
  "\u4E86",
  "\u662F",
  "\u5728",
  "\u6211",
  "\u6709",
  "\u548C",
  "\u5C31",
  "\u4E0D",
  "\u4EBA",
  "\u90FD",
  "\u4E00",
  "\u4E00\u4E2A",
  "\u8FD9",
  "\u90A3",
  "\u4F60",
  "\u5B83",
  "\u4E5F",
  "\u5F88",
  "\u5230",
  "\u8BF4",
  "\u8981",
  "\u4F1A",
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "be",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "this",
  "that",
  "it",
  "he",
  "she",
  "we",
  "they",
  "i",
  "me",
  "my",
  "do",
  "does",
  "did",
  "has",
  "have",
  "had",
  "can",
  "will",
  "would",
  "should",
  "could",
  "may"
]);
var _MemoryManager = class _MemoryManager {
  constructor(context) {
    this.shortTerm = [];
    this.longTerm = [];
    this.dirty = false;
    // 关键词缓存
    this.keywordCache = /* @__PURE__ */ new Map();
    this.CACHE_MAX = 200;
    this.context = context;
    this.load();
    this.startTimers();
  }
  static getInstance(context) {
    if (!_MemoryManager.instance) {
      _MemoryManager.instance = new _MemoryManager(context);
    }
    return _MemoryManager.instance;
  }
  // ============================================
  // 写入
  // ============================================
  addShortTerm(entry) {
    const existing = this.shortTerm.find(
      (e) => e.type === entry.type && this.similarity(e.content, entry.content) > 0.8
    );
    if (existing) {
      existing.lastAccessed = Date.now();
      existing.accessCount++;
      existing.importance = Math.max(existing.importance, entry.importance);
      this.markDirty();
      return;
    }
    this.shortTerm.push({
      id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...entry,
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      expiresAt: Date.now() + SHORT_TERM_TTL
    });
    if (this.shortTerm.length > SHORT_TERM_MAX) {
      this.evictShortTerm();
    }
    this.markDirty();
  }
  addLongTerm(entry) {
    const existing = this.longTerm.find(
      (e) => e.type === entry.type && this.similarity(e.content, entry.content) > 0.8
    );
    if (existing) {
      existing.lastAccessed = Date.now();
      existing.accessCount++;
      existing.importance = Math.max(existing.importance, entry.importance);
      this.markDirty();
      return;
    }
    this.longTerm.push({
      id: `lt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...entry,
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    });
    if (this.longTerm.length > LONG_TERM_MAX) {
      this.compressLongTerm();
    }
    this.markDirty();
  }
  // ============================================
  // 从消息中提取记忆
  // ============================================
  extractFromMessage(message) {
    if (message.role !== "user")
      return;
    const text = message.content;
    if (!text || text.length < 5)
      return;
    const prefPatterns = [
      /我(喜欢|偏好|习惯|想要|需要|通常|一般)(.{4,60})/g,
      /请(使用|采用|遵循|用)(.{4,40})/g
    ];
    for (const p of prefPatterns) {
      let m2;
      while ((m2 = p.exec(text)) !== null) {
        this.addShortTerm({
          type: "preference",
          content: m2[0].trim(),
          keywords: this.extractKeywords(m2[0]),
          importance: 0.65
        });
      }
    }
    const techPattern = /(?:使用|采用|基于)\s*(React|Vue|Angular|Next\.?js|TypeScript|JavaScript|Python|Go|Rust|Java|Spring|Django|Flask|Express)/gi;
    let m;
    while ((m = techPattern.exec(text)) !== null) {
      this.addShortTerm({
        type: "project",
        content: `\u9879\u76EE\u6280\u672F: ${m[0].trim()}`,
        keywords: this.extractKeywords(m[0]),
        importance: 0.75
      });
    }
  }
  compressSession(sessionId, messages) {
    if (messages.length < 6)
      return;
    const topics = /* @__PURE__ */ new Set();
    messages.filter((m) => m.role === "user").forEach((m) => this.extractKeywords(m.content).slice(0, 3).forEach((k) => topics.add(k)));
    const topicStr = [...topics].slice(0, 8).join(", ");
    this.addLongTerm({
      type: "summary",
      content: `\u4F1A\u8BDD(${messages.length}\u6761)\u8BA8\u8BBA\u4E86: ${topicStr}`,
      keywords: [...topics].slice(0, 10),
      importance: 0.5
    });
  }
  // ============================================
  // 检索
  // ============================================
  retrieve(query, limit = 5) {
    const qKeywords = this.extractKeywords(query);
    if (qKeywords.length === 0) {
      return { memories: [], relevanceScore: 0, tokenCount: 0 };
    }
    const scored = [];
    const allEntries = [...this.shortTerm, ...this.longTerm];
    for (const entry of allEntries) {
      const score = this.relevanceScore(qKeywords, entry);
      if (score > 0.1) {
        scored.push({ ...entry, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);
    for (const item of top) {
      const original = allEntries.find((e) => e.id === item.id);
      if (original) {
        original.accessCount++;
        original.lastAccessed = Date.now();
      }
    }
    if (top.length > 0)
      this.markDirty();
    return {
      memories: top,
      relevanceScore: top.length > 0 ? top[0].score : 0,
      tokenCount: top.reduce((s, e) => s + estimateTokens(e.content), 0)
    };
  }
  buildContextString(query, maxTokens = 800) {
    const result = this.retrieve(query, 6);
    if (result.memories.length === 0)
      return "";
    const typeLabels = {
      preference: "\u504F\u597D",
      project: "\u9879\u76EE",
      summary: "\u5386\u53F2",
      fact: "\u4FE1\u606F"
    };
    let context = "\n\n=== \u76F8\u5173\u8BB0\u5FC6 ===\n";
    let tokens = 0;
    for (const mem of result.memories) {
      const entryTokens = estimateTokens(mem.content);
      if (tokens + entryTokens > maxTokens)
        break;
      context += `- [${typeLabels[mem.type] || "\u4FE1\u606F"}] ${mem.content}
`;
      tokens += entryTokens;
    }
    context += "\u8BF7\u5728\u56DE\u590D\u65F6\u9002\u5F53\u8003\u8651\u4E0A\u8FF0\u4FE1\u606F\u3002\n";
    return context;
  }
  // ============================================
  // 清洗 & 压缩
  // ============================================
  cleanup() {
    const now = Date.now();
    const toPromote = [];
    const kept = [];
    for (const entry of this.shortTerm) {
      const expired = entry.expiresAt && entry.expiresAt < now;
      if (entry.accessCount >= PROMOTE_ACCESS || entry.importance >= PROMOTE_IMPORTANCE) {
        toPromote.push(entry);
        continue;
      }
      if (!expired) {
        kept.push(entry);
      }
    }
    const changed = kept.length !== this.shortTerm.length || toPromote.length > 0;
    this.shortTerm = kept;
    for (const entry of toPromote) {
      this.addLongTerm({
        type: entry.type,
        content: entry.content,
        keywords: entry.keywords,
        importance: Math.min(entry.importance + 0.1, 1)
      });
    }
    if (changed)
      this.markDirty();
  }
  compressLongTerm() {
    if (this.longTerm.length <= LONG_TERM_MAX * 0.8)
      return;
    const merged = [];
    const used = /* @__PURE__ */ new Set();
    for (let i = 0; i < this.longTerm.length; i++) {
      if (used.has(this.longTerm[i].id))
        continue;
      const current = { ...this.longTerm[i] };
      for (let j = i + 1; j < this.longTerm.length; j++) {
        if (used.has(this.longTerm[j].id))
          continue;
        if (this.similarity(current.content, this.longTerm[j].content) > 0.6) {
          used.add(this.longTerm[j].id);
          current.accessCount += this.longTerm[j].accessCount;
          current.importance = Math.max(current.importance, this.longTerm[j].importance);
          current.lastAccessed = Math.max(current.lastAccessed, this.longTerm[j].lastAccessed);
          const kw = /* @__PURE__ */ new Set([...current.keywords, ...this.longTerm[j].keywords]);
          current.keywords = [...kw].slice(0, 15);
        }
      }
      merged.push(current);
    }
    if (merged.length > LONG_TERM_MAX) {
      merged.sort((a, b) => {
        const scoreA = a.importance * 0.5 + Math.min(a.accessCount * 0.1, 0.3) + (a.type === "preference" ? 0.2 : 0);
        const scoreB = b.importance * 0.5 + Math.min(b.accessCount * 0.1, 0.3) + (b.type === "preference" ? 0.2 : 0);
        return scoreB - scoreA;
      });
      this.longTerm = merged.slice(0, LONG_TERM_MAX);
    } else {
      this.longTerm = merged;
    }
    this.markDirty();
  }
  evictShortTerm() {
    this.shortTerm.sort((a, b) => {
      const now = Date.now();
      const scoreA = a.importance * 0.6 + Math.min(a.accessCount * 0.1, 0.2) + (a.expiresAt ? Math.max(0, (a.expiresAt - now) / SHORT_TERM_TTL * 0.2) : 0);
      const scoreB = b.importance * 0.6 + Math.min(b.accessCount * 0.1, 0.2) + (b.expiresAt ? Math.max(0, (b.expiresAt - now) / SHORT_TERM_TTL * 0.2) : 0);
      return scoreB - scoreA;
    });
    this.shortTerm = this.shortTerm.slice(0, SHORT_TERM_MAX);
  }
  // ============================================
  // 统计 & 管理
  // ============================================
  getStats() {
    const allEntries = [...this.shortTerm, ...this.longTerm];
    return {
      shortTermCount: this.shortTerm.length,
      longTermCount: this.longTerm.length,
      totalTokens: allEntries.reduce((s, e) => s + estimateTokens(e.content), 0)
    };
  }
  clearAll() {
    this.shortTerm = [];
    this.longTerm = [];
    this.keywordCache.clear();
    this.save();
  }
  // ============================================
  // 持久化（带防抖）
  // ============================================
  markDirty() {
    this.dirty = true;
    if (this.saveTimer)
      clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      if (this.dirty)
        this.save();
    }, SAVE_DEBOUNCE);
  }
  save() {
    this.context.globalState.update(STORAGE_KEY, {
      shortTerm: this.shortTerm,
      longTerm: this.longTerm,
      savedAt: Date.now()
    });
    this.dirty = false;
  }
  load() {
    const data = this.context.globalState.get(STORAGE_KEY);
    if (data) {
      this.shortTerm = data.shortTerm || [];
      this.longTerm = data.longTerm || [];
    }
    this.cleanup();
  }
  startTimers() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);
    this.compressTimer = setInterval(() => {
      this.compressLongTerm();
    }, COMPRESS_INTERVAL);
  }
  dispose() {
    if (this.cleanupTimer)
      clearInterval(this.cleanupTimer);
    if (this.compressTimer)
      clearInterval(this.compressTimer);
    if (this.saveTimer)
      clearTimeout(this.saveTimer);
    if (this.dirty)
      this.save();
  }
  // ============================================
  // 工具方法（带缓存）
  // ============================================
  extractKeywords(text) {
    const cacheKey = text.substring(0, 100);
    const cached = this.keywordCache.get(cacheKey);
    if (cached)
      return cached;
    const words = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
    const result = [...new Set(words)].slice(0, 15);
    if (this.keywordCache.size > this.CACHE_MAX) {
      const firstKey = this.keywordCache.keys().next().value;
      if (firstKey !== void 0)
        this.keywordCache.delete(firstKey);
    }
    this.keywordCache.set(cacheKey, result);
    return result;
  }
  relevanceScore(queryKeywords, entry) {
    if (queryKeywords.length === 0 || entry.keywords.length === 0)
      return 0;
    let matches = 0;
    const contentLower = entry.content.toLowerCase();
    for (const qk of queryKeywords) {
      if (entry.keywords.includes(qk) || contentLower.includes(qk)) {
        matches++;
      }
    }
    const keywordScore = matches / queryKeywords.length;
    const importanceBonus = entry.importance * 0.15;
    const accessBonus = Math.min(entry.accessCount * 0.03, 0.15);
    const recencyBonus = entry.lastAccessed > Date.now() - 36e5 ? 0.1 : 0;
    return keywordScore + importanceBonus + accessBonus + recencyBonus;
  }
  similarity(a, b) {
    const wordsA = new Set(this.extractKeywords(a));
    const wordsB = new Set(this.extractKeywords(b));
    if (wordsA.size === 0 && wordsB.size === 0)
      return 1;
    if (wordsA.size === 0 || wordsB.size === 0)
      return 0;
    let intersection = 0;
    for (const w of wordsA) {
      if (wordsB.has(w))
        intersection++;
    }
    return intersection / (wordsA.size + wordsB.size - intersection);
  }
};
_MemoryManager.instance = null;
var MemoryManager = _MemoryManager;

// src/extension/agent/IntentClassifier.ts
var IntentClassifier = class {
  constructor() {
    /** 动态注册的skill触发规则 */
    this.dynamicSkillTriggers = [];
    /** 内置skill触发规则 */
    this.builtinSkillTriggers = [
      {
        skillId: "dependency-guardian",
        priority: 10,
        patterns: [
          /npm\s+audit/i,
          /(安全|漏洞)\s*(检查|扫描|审计|检测)/i,
          /依赖\s*(安全|漏洞|检查)/i,
          /security\s+(audit|check|scan)/i
        ]
      },
      {
        skillId: "code-reviewer",
        priority: 10,
        patterns: [
          /(全面|深度|完整)\s*代码\s*审查/i,
          /code\s*review\s*(报告|report)/i,
          /(项目|全局)\s*代码\s*(审查|检查|扫描)/i
        ]
      },
      {
        skillId: "test-architect",
        priority: 10,
        patterns: [
          /测试\s*(架构|方案|策略|规划)/i,
          /(设计|规划)\s*测试\s*(架构|方案|策略)/i,
          /test\s+(architecture|strategy|plan)/i
        ]
      },
      {
        skillId: "tool-maker",
        priority: 5,
        patterns: [
          /写\s*(一个|个)?\s*(脚本|工具|cli)\s*[:：]?\s*\S+/i,
          /创建\s*(一个)?\s*(脚本|工具|cli)\s*[:：]?\s*\S+/i,
          /(批量重命名|日志分析|图片压缩|文件整理).*(工具|脚本)/i,
          /(工具|脚本).*(批量重命名|日志分析|图片压缩|文件整理)/i
        ]
      }
    ];
    /** MCP触发规则 */
    this.mcpTriggers = [
      {
        toolHint: "builtin_read_file",
        patterns: [
          /^(读取|打开|查看)\s*(文件|代码|内容)\s*[:：]?\s*\S+/i,
          /^read\s+(file|content)\s+\S+/i
        ]
      },
      {
        toolHint: "builtin_search_code",
        patterns: [
          /^(搜索|查找|检索|grep)\s*(代码|文件|项目)\s*[:：]?\s*\S+/i,
          /^(search|find|grep)\s+(code|file|project)\s+\S+/i
        ]
      },
      {
        toolHint: "builtin_shell_exec",
        patterns: [
          /^(执行|运行)\s*(命令|shell|终端|脚本)\s*[:：]?\s*\S+/i,
          /^(run|execute)\s+(command|script|shell)\s+\S+/i
        ]
      }
    ];
    /** 代码操作模式 */
    this.codeActionPatterns = [
      { pattern: /^(解释|explain|说明|分析|讲解|这段?代码.*(做什么|干什么|意思|作用)|what does|what is)/i, action: "explain" },
      { pattern: /^(修复|fix|修改错误|修正|debug|解决.*bug)/i, action: "fix" },
      { pattern: /^(优化|optimize|改进|提升性能|performance)/i, action: "optimize" },
      { pattern: /^(添加?注释|加注释|comment|document)/i, action: "comment" },
      { pattern: /^(审查|review|检查代码|检视|code review|cr)/i, action: "review" },
      { pattern: /^(重构|refactor)/i, action: "refactor" }
    ];
    /** 已知命令集合 */
    this.knownCommands = /* @__PURE__ */ new Set([
      "help",
      "clear",
      "init",
      "search",
      "run",
      "new",
      "gst",
      "gpl",
      "gps",
      "gcm",
      "gaa",
      "gco",
      "gentest",
      "diagram",
      "test",
      "report",
      "build",
      "file",
      "skill"
    ]);
    /** 技能命令映射 */
    this.skillCommandMap = {
      "audit": "dependency-guardian",
      "review": "code-reviewer",
      "testplan": "test-architect",
      "tool": "tool-maker"
    };
  }
  // ========== 公开方法 ==========
  /**
   * 注册额外的skill触发规则
   */
  registerSkillTriggers(rules) {
    for (const rule of rules) {
      const idx = this.dynamicSkillTriggers.findIndex((r) => r.skillId === rule.skillId);
      if (idx >= 0) {
        this.dynamicSkillTriggers[idx] = rule;
      } else {
        this.dynamicSkillTriggers.push(rule);
      }
    }
    this.dynamicSkillTriggers.sort((a, b) => b.priority - a.priority);
  }
  /**
   * 移除skill触发规则
   */
  removeSkillTrigger(skillId) {
    this.dynamicSkillTriggers = this.dynamicSkillTriggers.filter((r) => r.skillId !== skillId);
  }
  /**
   * 获取已注册的触发规则
   */
  getRegisteredTriggers() {
    return [...this.builtinSkillTriggers, ...this.dynamicSkillTriggers];
  }
  /**
   * 分类用户输入的意图
   */
  classify(input, context) {
    var _a;
    const trimmed = input.trim();
    if (trimmed.startsWith("/")) {
      return this.parseSlashCommand(trimmed);
    }
    const mcpMatch = trimmed.match(/^@mcp[：:]\s*(\S+)\s*(.*)?$/i);
    if (mcpMatch) {
      return {
        type: "mcp_tool",
        confidence: 1,
        mcpToolHint: mcpMatch[1],
        rawInput: trimmed,
        processedPrompt: mcpMatch[2] || ""
      };
    }
    const skillMatch = trimmed.match(/^@skill[：:]\s*(\S+)\s*(.*)?$/i);
    if (skillMatch) {
      let skillParams;
      const paramsStr = (_a = skillMatch[2]) == null ? void 0 : _a.trim();
      if (paramsStr) {
        try {
          skillParams = JSON.parse(paramsStr);
        } catch {
          skillParams = { userInput: paramsStr };
        }
      }
      return {
        type: "skill",
        confidence: 1,
        skillId: skillMatch[1],
        skillParams,
        rawInput: trimmed
      };
    }
    if (context == null ? void 0 : context.hasSelectedCode) {
      const action = this.detectCodeAction(trimmed);
      if (action && action.confidence >= 0.8)
        return action;
    }
    const skillIntent = this.detectSkillIntent(trimmed);
    if (skillIntent)
      return skillIntent;
    const mcpIntent = this.detectMCPToolIntent(trimmed);
    if (mcpIntent)
      return mcpIntent;
    const codeAction = this.detectCodeAction(trimmed);
    if (codeAction && codeAction.confidence >= 0.7)
      return codeAction;
    return { type: "chat", confidence: 1, rawInput: trimmed, processedPrompt: trimmed };
  }
  // ========== 内部方法 ==========
  detectMCPToolIntent(input) {
    for (const trigger of this.mcpTriggers) {
      for (const pattern of trigger.patterns) {
        if (pattern.test(input)) {
          return {
            type: "mcp_tool",
            confidence: 0.8,
            mcpToolHint: trigger.toolHint,
            rawInput: input,
            processedPrompt: input
          };
        }
      }
    }
    return null;
  }
  detectSkillIntent(input) {
    const allTriggers = [...this.builtinSkillTriggers, ...this.dynamicSkillTriggers].sort((a, b) => b.priority - a.priority);
    for (const trigger of allTriggers) {
      for (const pattern of trigger.patterns) {
        if (pattern.test(input)) {
          return {
            type: "skill",
            confidence: 0.9,
            skillId: trigger.skillId,
            skillParams: { userInput: input },
            rawInput: input
          };
        }
      }
    }
    return null;
  }
  parseSlashCommand(input) {
    const match = input.match(/^\/(\w+)(?:\s+(.*))?$/);
    if (!match) {
      return { type: "chat", confidence: 0.5, rawInput: input };
    }
    const [, command, args] = match;
    const cmd = command.toLowerCase();
    if (this.knownCommands.has(cmd)) {
      return {
        type: "command",
        confidence: 1,
        rawInput: input,
        command: { name: command, args: args || "" }
      };
    }
    if (this.skillCommandMap[cmd]) {
      return {
        type: "skill",
        confidence: 1,
        skillId: this.skillCommandMap[cmd],
        rawInput: input,
        command: { name: command, args: args || "" },
        skillParams: args ? { userInput: args } : void 0
      };
    }
    return { type: "chat", confidence: 0.8, rawInput: input, processedPrompt: input };
  }
  detectCodeAction(input) {
    for (const { pattern, action } of this.codeActionPatterns) {
      if (pattern.test(input)) {
        return {
          type: "code_action",
          confidence: 0.85,
          codeAction: action,
          rawInput: input,
          processedPrompt: this.buildCodeActionPrompt(action, input)
        };
      }
    }
    return null;
  }
  buildCodeActionPrompt(action, input) {
    const map = {
      explain: `\u8BF7\u8BE6\u7EC6\u89E3\u91CA\u4EE5\u4E0B\u4EE3\u7801\u7684\u529F\u80FD\u548C\u5B9E\u73B0\u903B\u8F91\uFF1A

${input}`,
      fix: `\u8BF7\u68C0\u67E5\u5E76\u4FEE\u590D\u4EE5\u4E0B\u4EE3\u7801\u4E2D\u7684\u95EE\u9898\u3002\u4F7F\u7528 SEARCH/REPLACE \u683C\u5F0F\uFF1A

${input}`,
      optimize: `\u8BF7\u4F18\u5316\u4EE5\u4E0B\u4EE3\u7801\u3002\u4F7F\u7528 SEARCH/REPLACE \u683C\u5F0F\uFF1A

${input}`,
      comment: `\u8BF7\u4E3A\u4EE5\u4E0B\u4EE3\u7801\u6DFB\u52A0\u6E05\u6670\u6CE8\u91CA\u3002\u4F7F\u7528 SEARCH/REPLACE \u683C\u5F0F\uFF1A

${input}`,
      review: `\u8BF7\u5BF9\u4EE5\u4E0B\u4EE3\u7801\u8FDB\u884C\u5BA1\u67E5\uFF0C\u6307\u51FA\u95EE\u9898\u548C\u6539\u8FDB\u5EFA\u8BAE\uFF1A

${input}`,
      refactor: `\u8BF7\u91CD\u6784\u4EE5\u4E0B\u4EE3\u7801\u3002\u4F7F\u7528 SEARCH/REPLACE \u683C\u5F0F\uFF1A

${input}`,
      test: `\u8BF7\u4E3A\u4EE5\u4E0B\u4EE3\u7801\u751F\u6210\u5355\u5143\u6D4B\u8BD5\uFF1A

${input}`
    };
    return map[action] || input;
  }
};
var intentClassifier = new IntentClassifier();

// src/extension/chatview/handlers/ChatMessageHandler.ts
var ChatMessageHandler = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.memoryManager = MemoryManager.getInstance(ctx.extensionContext);
    this.intentClassifier = new IntentClassifier();
  }
  async handle(data) {
    switch (data.type) {
      case "sendMessage":
        await this.handleSendMessage(data.message, data.attachments);
        return true;
      case "cancelRequest":
        await this.stopCurrentTask();
        return true;
      case "regenerate":
        await this.handleRegenerate();
        return true;
      default:
        return false;
    }
  }
  /**
   * 处理发送消息 - 入口，做意图识别
   */
  async handleSendMessage(content, attachments) {
    if (!(content == null ? void 0 : content.trim()) && (!attachments || attachments.length === 0)) {
      return;
    }
    if (content == null ? void 0 : content.trim()) {
      this.ctx.messageHistory.push(content);
      if (this.ctx.messageHistory.length > 100) {
        this.ctx.messageHistory.shift();
      }
      this.ctx.historyIndex = -1;
    }
    if (this.ctx.isTaskRunning("chat")) {
      await this.stopChatTask();
      await new Promise((resolve2) => setTimeout(resolve2, 50));
    }
    const parsed = this.ctx.inputParser.parse(content);
    if (parsed.type === "command") {
      const commandParsed = this.ctx.commandParser.parse(content);
      if (commandParsed) {
        return;
      }
    }
    const editor = vscode7.window.activeTextEditor;
    const intentResult = this.intentClassifier.classify(content, {
      hasSelectedCode: editor ? !editor.selection.isEmpty : false,
      currentFile: editor == null ? void 0 : editor.document.fileName
    });
    if (intentResult.type === "skill" && intentResult.skillId) {
      const hint = `\u{1F4A1} \u68C0\u6D4B\u5230\u4F60\u53EF\u80FD\u60F3\u4F7F\u7528\u6280\u80FD \`@skill:${intentResult.skillId}\`\uFF0C\u6B63\u5728\u4E3A\u4F60\u8C03\u7528...`;
      this.ctx.postMessage({
        type: "addMessage",
        message: {
          id: generateId(),
          role: "assistant",
          content: hint,
          timestamp: Date.now(),
          metadata: { type: "intent_hint" }
        }
      });
    }
    await this.sendAIRequest(content, attachments);
  }
  /**
   * 发送AI请求（集成简化记忆）
   */
  async sendAIRequest(content, attachments, options) {
    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: "error",
        message: "Please configure an API key first"
      });
      return;
    }
    this.ctx.updateTaskStatus("chat", "running", "\u6B63\u5728\u601D\u8003...");
    this.ctx.setProcessingContext(true);
    if (!(options == null ? void 0 : options.skipUserMessage)) {
      const userMessage = {
        id: generateId(),
        role: "user",
        content: (options == null ? void 0 : options.displayContent) || content,
        timestamp: Date.now(),
        attachments
      };
      await this.ctx.sessionManager.addMessage(userMessage);
      this.ctx.postMessage({ type: "addMessage", message: userMessage });
      this.memoryManager.extractFromMessage(userMessage);
    }
    const assistantMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true
    };
    this.ctx.currentStreamingMessage = assistantMessage;
    await this.ctx.sessionManager.addMessage(assistantMessage);
    let lastSaveTime = Date.now();
    const SAVE_INTERVAL = 1e3;
    this.ctx.postMessage({ type: "addMessage", message: assistantMessage, streaming: true });
    const messages = this.ctx.sessionManager.getMessages();
    const messagesForAI = messages.map((msg, index) => {
      if (index === messages.length - 1 && msg.role === "user" && (options == null ? void 0 : options.displayContent)) {
        return { ...msg, content };
      }
      return msg;
    });
    const systemPromptBase = i18n.getAISystemPrompt("general");
    const languageInstruction = i18n.isChinese() ? "\n\n=== \u8BED\u8A00\u8BBE\u7F6E\uFF08\u6700\u9AD8\u4F18\u5148\u7EA7\uFF09===\n\u4F60\u5FC5\u987B\u4F7F\u7528\u7B80\u4F53\u4E2D\u6587\u56DE\u590D\u6240\u6709\u5185\u5BB9\u3002\n- \u6240\u6709\u89E3\u91CA\u3001\u8BF4\u660E\u5FC5\u987B\u7528\u4E2D\u6587\n- \u4EE3\u7801\u6CE8\u91CA\u4F7F\u7528\u4E2D\u6587\n- \u4E13\u4E1A\u672F\u8BED\u53EF\u4FDD\u7559\u82F1\u6587\u4F46\u9700\u9644\u5E26\u4E2D\u6587\u89E3\u91CA\n- \u7EDD\u5BF9\u4E0D\u8981\u4F7F\u7528\u82F1\u6587\u56DE\u590D\uFF08\u9664\u975E\u662F\u4EE3\u7801\u672C\u8EAB\uFF09" : "\n\n=== Language Setting (Highest Priority) ===\nYou MUST respond in English for all content.\n- All explanations must be in English\n- Code comments in English\n- Do not respond in Chinese";
    const memoryContext = this.memoryManager.buildContextString(content);
    const systemMessage = {
      id: "system-language",
      role: "system",
      content: systemPromptBase + memoryContext + languageInstruction,
      timestamp: Date.now()
    };
    const messagesWithSystem = [systemMessage, ...messagesForAI];
    try {
      await chatService.sendMessage(messagesWithSystem, {
        onToken: async (token) => {
          assistantMessage.content += token;
          if (this.ctx.currentStreamingMessage) {
            this.ctx.currentStreamingMessage.content = assistantMessage.content;
          }
          this.ctx.postMessage({
            type: "updateMessage",
            messageId: assistantMessage.id,
            content: assistantMessage.content
          });
          const now = Date.now();
          if (now - lastSaveTime > SAVE_INTERVAL && assistantMessage.content.length > 0) {
            lastSaveTime = now;
            await this.ctx.sessionManager.updateLastMessage(assistantMessage.content, false, true);
          }
        },
        onComplete: async (fullResponse) => {
          assistantMessage.content = fullResponse;
          assistantMessage.isStreaming = false;
          this.ctx.currentStreamingMessage = null;
          await this.ctx.sessionManager.updateLastMessage(fullResponse, true);
          this.ctx.postMessage({
            type: "completeMessage",
            messageId: assistantMessage.id,
            content: fullResponse
          });
          this.ctx.setProcessingContext(false);
          this.ctx.updateTaskStatus("chat", "success", "\u56DE\u590D\u5B8C\u6210");
        },
        onError: (error) => {
          this.ctx.currentStreamingMessage = null;
          this.ctx.postMessage({
            type: "error",
            message: error.message,
            messageId: assistantMessage.id
          });
          this.ctx.setProcessingContext(false);
          this.ctx.updateTaskStatus("chat", "error", error.message);
        }
      }, { requestId: "chat" });
    } catch (error) {
      this.ctx.currentStreamingMessage = null;
      this.ctx.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
      this.ctx.setProcessingContext(false);
      this.ctx.updateTaskStatus("chat", "error", error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF");
    }
  }
  /**
   * 处理重新生成
   */
  async handleRegenerate() {
    const messages = this.ctx.sessionManager.getMessages();
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1) {
      this.ctx.postMessage({ type: "error", message: "\u6CA1\u6709\u53EF\u91CD\u65B0\u751F\u6210\u7684\u6D88\u606F" });
      return;
    }
    const lastUserMessage = messages[lastUserMessageIndex];
    for (let i = messages.length - 1; i > lastUserMessageIndex; i--) {
      this.ctx.postMessage({ type: "removeMessage", messageId: messages[i].id });
    }
    while (this.ctx.sessionManager.getMessages().length > lastUserMessageIndex + 1) {
      await this.ctx.sessionManager.removeLastMessage();
    }
    await this.sendAIRequest(lastUserMessage.content, lastUserMessage.attachments, {
      skipUserMessage: true
    });
  }
  /**
   * 停止所有正在运行的任务
   */
  async stopCurrentTask() {
    let hasRunningTask = false;
    if (this.ctx.isTaskRunning("chat")) {
      hasRunningTask = true;
      await this.stopChatTaskInternal();
    }
    const otherTaskTypes = ["diagram", "test", "command", "skill"];
    for (const taskType of otherTaskTypes) {
      if (this.ctx.isTaskRunning(taskType)) {
        hasRunningTask = true;
        this.ctx.updateTaskStatus(taskType, "idle", "\u5DF2\u53D6\u6D88");
      }
    }
    if (hasRunningTask && this.ctx.chatService) {
      this.ctx.chatService.cancel();
    }
    this.ctx.postMessage({ type: "taskStopped" });
  }
  async stopChatTask() {
    if (!this.ctx.isTaskRunning("chat")) {
      return;
    }
    await this.stopChatTaskInternal();
    if (this.ctx.chatService) {
      this.ctx.chatService.cancelRequest("chat");
    }
  }
  async stopChatTaskInternal() {
    if (this.ctx.currentStreamingMessage) {
      const hasContent = this.ctx.currentStreamingMessage.content.trim().length > 0;
      const session = this.ctx.sessionManager.currentSession;
      if (session) {
        const existingMsg = session.messages.find((m) => m.id === this.ctx.currentStreamingMessage.id);
        if (hasContent) {
          if (!existingMsg) {
            await this.ctx.sessionManager.addMessage(this.ctx.currentStreamingMessage);
          } else if (existingMsg.content !== this.ctx.currentStreamingMessage.content) {
            await this.ctx.sessionManager.updateLastMessage(this.ctx.currentStreamingMessage.content, true);
          }
        } else if (existingMsg) {
          const msgIndex = session.messages.findIndex((m) => m.id === this.ctx.currentStreamingMessage.id);
          if (msgIndex !== -1) {
            session.messages.splice(msgIndex, 1);
            await this.ctx.sessionManager.saveCurrentSession();
          }
        }
      }
      this.ctx.postMessage({
        type: "completeMessage",
        messageId: this.ctx.currentStreamingMessage.id,
        content: this.ctx.currentStreamingMessage.content,
        interrupted: true
      });
      this.ctx.currentStreamingMessage = null;
    }
    this.ctx.updateTaskStatus("chat", "idle", "\u5DF2\u505C\u6B62");
    this.ctx.setProcessingContext(false);
  }
  /**
   * 发送带系统上下文的消息（用于代码操作）
   */
  async sendMessageWithContext(displayLabel, systemContext) {
    if (this.ctx.isTaskRunning("chat")) {
      await this.stopChatTask();
      await new Promise((resolve2) => setTimeout(resolve2, 50));
    }
    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: "error",
        message: "\u8BF7\u5148\u914D\u7F6E API Key"
      });
      return;
    }
    this.ctx.updateTaskStatus("chat", "running", `\u6B63\u5728${displayLabel}...`);
    this.ctx.setProcessingContext(true);
    const codePreview = systemContext.code.length > 150 ? systemContext.code.slice(0, 150) + "..." : systemContext.code;
    const displayMessage = `${displayLabel}

\`\`\`${systemContext.language}
${codePreview}
\`\`\``;
    const userMessage = {
      id: generateId(),
      role: "user",
      content: displayMessage,
      timestamp: Date.now()
    };
    await this.ctx.sessionManager.addMessage(userMessage);
    this.ctx.postMessage({ type: "addMessage", message: userMessage });
    const fullPrompt = this.buildCodeActionPrompt(systemContext);
    const messagesForAI = this.ctx.sessionManager.getMessages().map((msg) => {
      if (msg.id === userMessage.id) {
        return { ...msg, content: fullPrompt };
      }
      return msg;
    });
    const assistantMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true
    };
    await this.ctx.sessionManager.addMessage(assistantMessage);
    this.ctx.currentStreamingMessage = assistantMessage;
    let lastSaveTime = Date.now();
    const SAVE_INTERVAL = 1e3;
    this.ctx.postMessage({ type: "addMessage", message: assistantMessage, streaming: true });
    const systemPromptBase = i18n.getAISystemPrompt("code");
    const languageInstruction = i18n.isChinese() ? "\n\n=== \u8BED\u8A00\u8BBE\u7F6E\uFF08\u6700\u9AD8\u4F18\u5148\u7EA7\uFF09===\n\u4F60\u5FC5\u987B\u4F7F\u7528\u7B80\u4F53\u4E2D\u6587\u56DE\u590D\u6240\u6709\u5185\u5BB9\u3002" : "\n\n=== Language Setting (Highest Priority) ===\nYou MUST respond in English.";
    const memoryContext = this.memoryManager.buildContextString(displayLabel + " " + systemContext.code);
    const systemMessage = {
      id: "system-language",
      role: "system",
      content: systemPromptBase + memoryContext + languageInstruction,
      timestamp: Date.now()
    };
    const messagesWithSystem = [systemMessage, ...messagesForAI];
    try {
      await chatService.sendMessage(messagesWithSystem, {
        onToken: (token) => {
          assistantMessage.content += token;
          if (this.ctx.currentStreamingMessage) {
            this.ctx.currentStreamingMessage.content = assistantMessage.content;
          }
          this.ctx.postMessage({
            type: "updateMessage",
            messageId: assistantMessage.id,
            content: assistantMessage.content
          });
          const now = Date.now();
          if (now - lastSaveTime > SAVE_INTERVAL && assistantMessage.content.length > 0) {
            lastSaveTime = now;
            this.ctx.sessionManager.updateLastMessage(assistantMessage.content, false, true);
          }
        },
        onComplete: async (fullResponse) => {
          assistantMessage.content = fullResponse;
          assistantMessage.isStreaming = false;
          this.ctx.currentStreamingMessage = null;
          this.ctx.sessionManager.updateLastMessage(fullResponse, true);
          this.ctx.postMessage({
            type: "completeMessage",
            messageId: assistantMessage.id,
            content: fullResponse
          });
          this.ctx.setProcessingContext(false);
          this.ctx.updateTaskStatus("chat", "success", `${displayLabel}\u5B8C\u6210`);
        },
        onError: (error) => {
          this.ctx.currentStreamingMessage = null;
          this.ctx.postMessage({
            type: "error",
            message: error.message
          });
          this.ctx.setProcessingContext(false);
          this.ctx.updateTaskStatus("chat", "error", error.message);
        }
      }, { requestId: "chat" });
    } catch (error) {
      this.ctx.currentStreamingMessage = null;
      const errorMsg = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
      this.ctx.postMessage({
        type: "error",
        message: errorMsg
      });
      this.ctx.setProcessingContext(false);
      this.ctx.updateTaskStatus("chat", "error", errorMsg);
    }
  }
  buildCodeActionPrompt(ctx) {
    const isChinese = i18n.isChinese();
    let prompt = `${ctx.prompt}

**${isChinese ? "\u6587\u4EF6" : "File"}:** \`${ctx.fileName}\`
**${isChinese ? "\u8BED\u8A00" : "Language"}:** ${ctx.language}

\`\`\`${ctx.language}
${ctx.code}
\`\`\``;
    if (ctx.useSearchReplace) {
      if (isChinese) {
        prompt += `

**\u56DE\u590D\u8981\u6C42\uFF1A**
1. \u9996\u5148\uFF0C\u7B80\u8981\u5206\u6790\u4EE3\u7801\u5B58\u5728\u7684\u95EE\u9898\u6216\u53EF\u4EE5\u6539\u8FDB\u7684\u5730\u65B9\uFF082-4\u70B9\uFF09
2. \u7136\u540E\uFF0C\u8BF4\u660E\u4F60\u7684\u4FEE\u6539\u601D\u8DEF
3. \u6700\u540E\uFF0C\u4F7F\u7528\u4EE5\u4E0B\u683C\u5F0F\u8FD4\u56DE\u4EE3\u7801\u4FEE\u6539\uFF1A

\`\`\`
<<<<<<< SEARCH
[\u8981\u67E5\u627E\u7684\u539F\u59CB\u4EE3\u7801]
=======
[\u66FF\u6362\u540E\u7684\u65B0\u4EE3\u7801]
>>>>>>> REPLACE
\`\`\`

4. \u5728\u4EE3\u7801\u4FEE\u6539\u540E\uFF0C\u7B80\u8981\u603B\u7ED3\u4E3B\u8981\u4FEE\u6539\u5185\u5BB9`;
      } else {
        prompt += `

**Response Requirements:**
1. First, briefly analyze the issues or improvements in the code
2. Then, explain your modification approach
3. Finally, use the SEARCH/REPLACE format to return code changes
4. After the code changes, briefly summarize the modifications`;
      }
    }
    return prompt;
  }
  getMemoryManager() {
    return this.memoryManager;
  }
  getIntentClassifier() {
    return this.intentClassifier;
  }
};

// src/extension/chatview/handlers/DiagramHandler.ts
var vscode8 = __toESM(require("vscode"));
var path4 = __toESM(require("path"));
var fs3 = __toESM(require("fs"));
init_shared();
var DiagramHandler = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async handle(data) {
    switch (data.type) {
      case "generateDiagram":
        await this.generateDiagram(data.diagramType, data.description);
        return true;
      case "updateDiagram":
        await this.updateDiagram(data.diagramId, data.code);
        return true;
      case "exportDiagram":
        await this.exportDiagram(data.diagramId, data.format);
        return true;
      case "getDiagramHistory":
        this.sendDiagramHistory();
        return true;
      case "loadDiagram":
        this.loadDiagram(data.diagramId);
        return true;
      case "autoFixDiagram":
        await this.autoFixDiagram(data.code, data.error);
        return true;
      case "renameDiagram":
        this.renameDiagram(data.diagramId, data.newTitle);
        return true;
      default:
        return false;
    }
  }
  /**
   * 生成图表
   */
  async generateDiagram(diagramType, description) {
    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: "error",
        message: "Please configure an API key first"
      });
      return;
    }
    const prompt = this.ctx.diagramGenerator.generatePrompt(diagramType, description);
    let response = "";
    this.ctx.updateTaskStatus("diagram", "running", "\u6B63\u5728\u751F\u6210\u56FE\u8868...");
    const diagramRequestId = `diagram-${Date.now()}`;
    await chatService.sendMessage(
      [{ id: "0", role: "user", content: prompt, timestamp: Date.now() }],
      {
        onToken: (token) => {
          response += token;
        },
        onComplete: async () => {
          const code = this.ctx.diagramGenerator.extractDiagramCode(response);
          if (code) {
            const typeLabels = {
              flowchart: "\u6D41\u7A0B\u56FE",
              sequence: "\u65F6\u5E8F\u56FE",
              class: "\u7C7B\u56FE",
              state: "\u72B6\u6001\u56FE",
              er: "ER\u56FE",
              gantt: "\u7518\u7279\u56FE",
              pie: "\u997C\u56FE",
              mindmap: "\u601D\u7EF4\u5BFC\u56FE",
              architecture: "\u67B6\u6784\u56FE"
            };
            const shortDesc = description.length > 20 ? description.slice(0, 20) + "..." : description;
            const title = `${typeLabels[diagramType] || diagramType} - ${shortDesc}`;
            const diagram = this.ctx.diagramGenerator.createDiagram(
              diagramType,
              code,
              title
            );
            await this.saveDiagramToHistory(diagram);
            this.ctx.lastGeneratedDiagram = {
              type: diagramType,
              code,
              description,
              timestamp: Date.now()
            };
            this.ctx.postMessage({ type: "diagramGenerated", diagram });
            this.ctx.updateTaskStatus("diagram", "success", "\u56FE\u8868\u751F\u6210\u5B8C\u6210");
          } else {
            this.ctx.postMessage({ type: "error", message: "\u65E0\u6CD5\u4ECE\u54CD\u5E94\u4E2D\u63D0\u53D6\u56FE\u8868\u4EE3\u7801" });
            this.ctx.updateTaskStatus("diagram", "error", "\u63D0\u53D6\u4EE3\u7801\u5931\u8D25");
          }
        },
        onError: (error) => {
          this.ctx.postMessage({ type: "error", message: error.message });
          this.ctx.updateTaskStatus("diagram", "error", error.message);
        }
      },
      { maxTokens: 8192, requestId: diagramRequestId }
    );
  }
  /**
   * 从选中代码生成图表
   */
  async generateFromSelection(diagramType) {
    const editor = vscode8.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      this.ctx.postMessage({ type: "error", message: "\u8BF7\u5148\u9009\u4E2D\u4E00\u4E9B\u4EE3\u7801" });
      return;
    }
    const selectedText = editor.document.getText(editor.selection);
    const language = editor.document.languageId;
    const description = `\u6839\u636E\u4EE5\u4E0B${language}\u4EE3\u7801\u751F\u6210${diagramType}\uFF1A
\`\`\`${language}
${selectedText}
\`\`\``;
    await this.generateDiagram(diagramType, description);
  }
  /**
   * 从文件生成图表
   */
  async generateFromFile(filePath, diagramType) {
    const editor = vscode8.window.activeTextEditor;
    const targetPath = filePath || (editor == null ? void 0 : editor.document.uri.fsPath);
    if (!targetPath) {
      this.ctx.postMessage({ type: "error", message: "\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u6587\u4EF6" });
      return;
    }
    let content;
    try {
      content = fs3.readFileSync(targetPath, "utf-8");
    } catch (err) {
      this.ctx.postMessage({ type: "error", message: `\u65E0\u6CD5\u8BFB\u53D6\u6587\u4EF6: ${targetPath}` });
      return;
    }
    const language = path4.extname(targetPath).slice(1);
    const fileName = path4.basename(targetPath);
    const type = diagramType || "flowchart";
    const description = `\u5206\u6790 ${fileName} \u6587\u4EF6\u5E76\u751F\u6210${type}\uFF1A
\`\`\`${language}
${content.slice(0, 5e3)}
\`\`\``;
    await this.generateDiagram(type, description);
  }
  /**
   * 从描述生成图表
   */
  async generateFromDescription(description) {
    let diagramType = "flowchart";
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("\u5E8F\u5217") || lowerDesc.includes("sequence") || lowerDesc.includes("\u65F6\u5E8F")) {
      diagramType = "sequence";
    } else if (lowerDesc.includes("\u7C7B") || lowerDesc.includes("class")) {
      diagramType = "class";
    } else if (lowerDesc.includes("\u72B6\u6001") || lowerDesc.includes("state")) {
      diagramType = "state";
    } else if (lowerDesc.includes("er") || lowerDesc.includes("\u6570\u636E\u5E93") || lowerDesc.includes("\u8868")) {
      diagramType = "er";
    } else if (lowerDesc.includes("\u7518\u7279") || lowerDesc.includes("gantt") || lowerDesc.includes("\u65F6\u95F4\u7EBF")) {
      diagramType = "gantt";
    } else if (lowerDesc.includes("\u601D\u7EF4\u5BFC\u56FE") || lowerDesc.includes("mindmap")) {
      diagramType = "mindmap";
    } else if (lowerDesc.includes("\u67B6\u6784") || lowerDesc.includes("architecture")) {
      diagramType = "architecture";
    }
    await this.generateDiagram(diagramType, description);
  }
  /**
   * 从项目结构生成架构图
   */
  async generateFromProject() {
    var _a, _b;
    const workspaceRoot = (_b = (_a = vscode8.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath;
    if (!workspaceRoot) {
      this.ctx.postMessage({ type: "error", message: "\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u5DE5\u4F5C\u533A" });
      return;
    }
    const structure = this.analyzeProjectStructure(workspaceRoot);
    const description = `\u6839\u636E\u4EE5\u4E0B\u9879\u76EE\u7ED3\u6784\u751F\u6210\u67B6\u6784\u56FE\uFF1A
${structure}`;
    await this.generateDiagram("architecture", description);
  }
  /**
   * 更新图表
   */
  async updateDiagram(diagramId, code) {
    const success = this.ctx.diagramGenerator.updateDiagram(diagramId, code);
    if (success) {
      const diagram = this.ctx.diagramGenerator.getDiagram(diagramId);
      if (diagram) {
        this.ctx.postMessage({ type: "diagramUpdated", diagram });
      }
    } else {
      this.ctx.postMessage({ type: "error", message: "\u66F4\u65B0\u56FE\u8868\u5931\u8D25" });
    }
  }
  /**
   * 导出图表
   */
  async exportDiagram(diagramId, format) {
    try {
      const diagram = this.ctx.diagramGenerator.getDiagram(diagramId);
      if (!diagram) {
        throw new Error("\u56FE\u8868\u4E0D\u5B58\u5728");
      }
      const result = await this.ctx.diagramGenerator.exportDiagram(diagram, format);
      this.ctx.postMessage({ type: "diagramExported", content: result, format });
    } catch (error) {
      this.ctx.postMessage({ type: "error", message: error instanceof Error ? error.message : "Export failed" });
    }
  }
  /**
   * 发送图表历史
   */
  sendDiagramHistory() {
    const diagrams = this.ctx.diagramGenerator.getAllDiagrams();
    this.ctx.postMessage({ type: "diagramHistory", diagrams });
  }
  /**
   * 加载图表
   */
  loadDiagram(diagramId) {
    const diagram = this.ctx.diagramGenerator.getDiagram(diagramId);
    if (diagram) {
      this.ctx.postMessage({ type: "diagramGenerated", diagram });
    }
  }
  /**
   * 自动修复图表
   */
  async autoFixDiagram(code, error) {
    this.ctx.updateTaskStatus("diagram", "running", "\u6B63\u5728\u4FEE\u590D\u56FE\u8868...");
    const streamingMessageId = generateId();
    let messageAdded = false;
    try {
      const errorMsg = error || "\u56FE\u8868\u6E32\u67D3\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 Mermaid \u8BED\u6CD5";
      await this.ctx.autoFixService.fixDiagramStreaming(code, errorMsg, {
        onChunk: (chunk, fullContent) => {
          if (!messageAdded) {
            messageAdded = true;
            this.ctx.postMessage({
              type: "addMessage",
              message: {
                id: streamingMessageId,
                role: "assistant",
                content: fullContent,
                timestamp: Date.now()
              },
              streaming: true
            });
          } else {
            this.ctx.postMessage({
              type: "updateMessage",
              messageId: streamingMessageId,
              content: fullContent
            });
          }
        },
        onComplete: (result) => {
          if (result.success && result.fixedCode) {
            const finalContent = `\u2705 **\u56FE\u8868\u4FEE\u590D\u5B8C\u6210**

${result.explanation || ""}

\`\`\`mermaid
${result.fixedCode}
\`\`\``;
            if (messageAdded) {
              this.ctx.postMessage({
                type: "completeMessage",
                messageId: streamingMessageId,
                content: finalContent
              });
            }
            this.ctx.postMessage({ type: "diagramAutoFixed", code: result.fixedCode });
            this.ctx.updateTaskStatus("diagram", "success", "\u56FE\u8868\u4FEE\u590D\u5B8C\u6210");
          } else {
            if (messageAdded) {
              this.ctx.postMessage({
                type: "completeMessage",
                messageId: streamingMessageId,
                content: `\u274C **\u81EA\u52A8\u4FEE\u590D\u5931\u8D25**

${result.error || "\u65E0\u6CD5\u89E3\u6790\u4FEE\u590D\u7ED3\u679C"}`
              });
            }
            this.ctx.updateTaskStatus("diagram", "error", "\u4FEE\u590D\u5931\u8D25");
          }
        },
        onError: (err) => {
          const errorMessage = err instanceof Error ? err.message : "\u672A\u77E5\u9519\u8BEF";
          if (messageAdded) {
            this.ctx.postMessage({
              type: "completeMessage",
              messageId: streamingMessageId,
              content: `\u274C **\u81EA\u52A8\u4FEE\u590D\u5931\u8D25**

${errorMessage}`
            });
          }
          this.ctx.updateTaskStatus("diagram", "error", errorMessage);
        }
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "\u672A\u77E5\u9519\u8BEF";
      this.ctx.updateTaskStatus("diagram", "error", errorMsg);
    }
  }
  /**
   * 重命名图表
   */
  renameDiagram(diagramId, newTitle) {
    const success = this.ctx.diagramGenerator.renameDiagram(diagramId, newTitle);
    if (success) {
      vscode8.window.showInformationMessage(`\u56FE\u8868\u5DF2\u91CD\u547D\u540D\u4E3A: ${newTitle}`);
    } else {
      vscode8.window.showErrorMessage("\u91CD\u547D\u540D\u5931\u8D25");
    }
  }
  /**
   * 保存图表到历史记录
   */
  async saveDiagramToHistory(diagram) {
    try {
      const key = "diagramHistory";
      const existing = this.ctx.extensionContext.globalState.get(key, []);
      const updated = [diagram, ...existing.filter((d) => d.id !== diagram.id)].slice(0, 20);
      await this.ctx.extensionContext.globalState.update(key, updated);
    } catch (e) {
      console.error("Failed to save diagram history:", e);
    }
  }
  /**
   * 分析项目结构
   */
  analyzeProjectStructure(root, depth = 0, maxDepth = 2) {
    if (depth > maxDepth)
      return "";
    const items = [];
    const prefix = "  ".repeat(depth);
    try {
      const files = fs3.readdirSync(root);
      const filtered = files.filter(
        (f) => !f.startsWith(".") && f !== "node_modules" && f !== "__pycache__" && f !== "dist" && f !== "build"
      ).slice(0, 15);
      for (const file of filtered) {
        const fullPath = path4.join(root, file);
        try {
          const stat = fs3.statSync(fullPath);
          if (stat.isDirectory()) {
            items.push(`${prefix}\u{1F4C1} ${file}/`);
            if (depth < maxDepth) {
              const subItems = this.analyzeProjectStructure(fullPath, depth + 1, maxDepth);
              if (subItems)
                items.push(subItems);
            }
          } else {
            items.push(`${prefix}\u{1F4C4} ${file}`);
          }
        } catch {
        }
      }
    } catch {
    }
    return items.join("\n");
  }
};

// src/extension/chatview/handlers/TestHandler.ts
var vscode9 = __toESM(require("vscode"));
var path5 = __toESM(require("path"));
var fs4 = __toESM(require("fs"));
init_shared();
var TestHandler = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async handle(data) {
    switch (data.type) {
      case "generateTest":
        await this.generateTest(data.filePath);
        return true;
      case "saveTest":
        await this.saveTest(data.code, data.path);
        return true;
      case "runTest":
        await this.runTest(data.path);
        return true;
      case "getTestHistory":
        this.sendTestHistory();
        return true;
      case "loadTest":
        this.loadTest(data.testIndex);
        return true;
      case "autoFixTest":
        await this.autoFixTest(data.code, data.errors, data.framework, data.path);
        return true;
      case "renameTest":
        this.renameTest(data.testIndex, data.newName);
        return true;
      case "deleteTest":
        this.deleteTest(data.testIndex);
        return true;
      case "refineTest":
        await this.refineTest(data.code, data.framework, data.path);
        return true;
      default:
        return false;
    }
  }
  /**
   * 生成测试
   */
  async generateTest(filePath) {
    var _a, _b;
    const editor = vscode9.window.activeTextEditor;
    const targetPath = filePath || (editor == null ? void 0 : editor.document.uri.fsPath);
    if (!targetPath) {
      this.ctx.postMessage({ type: "error", message: "\u8BF7\u5148\u6253\u5F00\u6216\u9009\u62E9\u4E00\u4E2A\u6587\u4EF6" });
      return;
    }
    const taskId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: "error",
        message: "\u8BF7\u5148\u914D\u7F6E API Key"
      });
      return;
    }
    const workspaceRoot = ((_b = (_a = vscode9.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath) || "";
    const { language, framework } = this.ctx.testGenerator.detectLanguageAndFramework(targetPath, workspaceRoot);
    let sourceCode;
    try {
      sourceCode = fs4.readFileSync(targetPath, "utf-8");
    } catch (err) {
      this.ctx.postMessage({ type: "error", message: `\u65E0\u6CD5\u8BFB\u53D6\u6587\u4EF6: ${targetPath}` });
      return;
    }
    const prompt = this.ctx.testGenerator.generatePrompt(sourceCode, targetPath, framework);
    const fileName = path5.basename(targetPath);
    this.ctx.postMessage({
      type: "taskStatus",
      taskType: "test",
      taskId,
      status: "running",
      message: `\u6B63\u5728\u4E3A ${fileName} \u751F\u6210 ${framework} \u6D4B\u8BD5...`,
      timestamp: Date.now()
    });
    let response = "";
    await chatService.sendMessage(
      [{ id: "0", role: "user", content: prompt, timestamp: Date.now() }],
      {
        onToken: (token) => {
          response += token;
        },
        onComplete: async () => {
          const testCode = this.ctx.testGenerator.extractTestCode(response, language);
          const testPath = this.ctx.testGenerator.generateTestFilePath(targetPath, framework);
          await this.saveTestToHistory({
            code: testCode,
            path: testPath,
            framework,
            sourceFile: fileName
          });
          this.ctx.lastGeneratedTest = {
            code: testCode,
            framework,
            sourceFile: targetPath,
            timestamp: Date.now()
          };
          this.ctx.postMessage({
            type: "testGenerated",
            code: testCode,
            suggestedPath: testPath,
            framework,
            taskId
          });
          this.ctx.postMessage({
            type: "taskStatus",
            taskType: "test",
            taskId,
            status: "success",
            message: `${fileName} \u6D4B\u8BD5\u751F\u6210\u5B8C\u6210`,
            timestamp: Date.now()
          });
        },
        onError: (error) => {
          this.ctx.postMessage({ type: "error", message: error.message });
          this.ctx.postMessage({
            type: "taskStatus",
            taskType: "test",
            taskId,
            status: "error",
            message: error.message,
            timestamp: Date.now()
          });
        }
      },
      { maxTokens: 8192, requestId: `test-${taskId}` }
    );
  }
  /**
   * 从内联代码生成测试
   */
  async generateFromCode(codeContent) {
    var _a, _b;
    const taskId = `test-inline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: "error",
        message: "\u8BF7\u5148\u914D\u7F6E API Key"
      });
      return;
    }
    let sourceCode = codeContent;
    let language = "";
    const codeBlockMatch = codeContent.match(/```(\w+)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      language = codeBlockMatch[1] || "";
      sourceCode = codeBlockMatch[2];
    } else if (codeContent.startsWith("code:")) {
      sourceCode = codeContent.replace(/^code:\s*/, "").trim();
    }
    if (!language) {
      language = this.detectLanguageFromCode(sourceCode);
    }
    if (!language || language === "unknown") {
      const editor = vscode9.window.activeTextEditor;
      if (editor) {
        language = this.normalizeLanguageId(editor.document.languageId);
      }
    }
    if (!language || language === "unknown") {
      language = "javascript";
    }
    const framework = this.detectFrameworkFromLanguage(language);
    const workspaceRoot = ((_b = (_a = vscode9.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath) || "";
    const prompt = this.ctx.testGenerator.generatePrompt(sourceCode, `inline.${language}`, framework);
    this.ctx.postMessage({
      type: "taskStatus",
      taskType: "test",
      taskId,
      status: "running",
      message: `\u6B63\u5728\u4E3A\u9009\u4E2D\u4EE3\u7801 (${language}) \u751F\u6210 ${framework} \u6D4B\u8BD5...`,
      timestamp: Date.now()
    });
    let response = "";
    await chatService.sendMessage(
      [{ id: "0", role: "user", content: prompt, timestamp: Date.now() }],
      {
        onToken: (token) => {
          response += token;
        },
        onComplete: async () => {
          const testCode = this.ctx.testGenerator.extractTestCode(response, language);
          const ext = this.getExtensionForLanguage(language);
          const testPath = path5.join(workspaceRoot, `test_inline${ext}`);
          await this.saveTestToHistory({
            code: testCode,
            path: testPath,
            framework,
            sourceFile: "inline code"
          });
          this.ctx.lastGeneratedTest = {
            code: testCode,
            framework,
            sourceFile: "inline code",
            timestamp: Date.now()
          };
          this.ctx.postMessage({
            type: "testGenerated",
            code: testCode,
            suggestedPath: testPath,
            framework,
            taskId
          });
          this.ctx.postMessage({
            type: "taskStatus",
            taskType: "test",
            taskId,
            status: "success",
            message: `\u6D4B\u8BD5\u751F\u6210\u5B8C\u6210 (${framework})`,
            timestamp: Date.now()
          });
        },
        onError: (error) => {
          this.ctx.postMessage({ type: "error", message: error.message });
          this.ctx.postMessage({
            type: "taskStatus",
            taskType: "test",
            taskId,
            status: "error",
            message: error.message,
            timestamp: Date.now()
          });
        }
      },
      { maxTokens: 8192, requestId: `test-inline-${taskId}` }
    );
  }
  /**
   * 保存测试文件
   */
  async saveTest(code, testPath) {
    var _a, _b;
    try {
      const workspaceRoot = ((_b = (_a = vscode9.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath) || "";
      const fullPath = path5.isAbsolute(testPath) ? testPath : path5.join(workspaceRoot, testPath);
      const dir = path5.dirname(fullPath);
      if (!fs4.existsSync(dir)) {
        fs4.mkdirSync(dir, { recursive: true });
      }
      fs4.writeFileSync(fullPath, code, "utf-8");
      const document = await vscode9.workspace.openTextDocument(fullPath);
      await vscode9.window.showTextDocument(document);
      vscode9.window.showInformationMessage(`\u6D4B\u8BD5\u6587\u4EF6\u5DF2\u4FDD\u5B58: ${testPath}`);
    } catch (error) {
      vscode9.window.showErrorMessage(`\u4FDD\u5B58\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
    }
  }
  /**
   * 运行测试
   */
  async runTest(testPath) {
    var _a, _b;
    const workspaceRoot = (_b = (_a = vscode9.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath;
    if (!workspaceRoot) {
      vscode9.window.showErrorMessage("\u8BF7\u5148\u6253\u5F00\u5DE5\u4F5C\u533A");
      return;
    }
    const ext = path5.extname(testPath);
    let command = "";
    if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
      const packageJsonPath = path5.join(workspaceRoot, "package.json");
      if (fs4.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs4.readFileSync(packageJsonPath, "utf-8"));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps["vitest"]) {
          command = `npx vitest run ${testPath}`;
        } else if (deps["jest"]) {
          command = `npx jest ${testPath}`;
        } else if (deps["mocha"]) {
          command = `npx mocha ${testPath}`;
        }
      }
    } else if (ext === ".py") {
      command = `python -m pytest ${testPath}`;
    } else if (ext === ".go") {
      command = `go test -v ${testPath}`;
    }
    if (!command) {
      command = `npm test -- ${testPath}`;
    }
    const terminal = vscode9.window.createTerminal("AI Test Runner");
    terminal.show();
    terminal.sendText(`cd "${workspaceRoot}" && ${command}`);
  }
  /**
   * 发送测试历史
   */
  sendTestHistory() {
    const tests = this.getTestHistory();
    this.ctx.postMessage({ type: "testHistory", tests });
  }
  /**
   * 加载测试
   */
  loadTest(testIndex) {
    const tests = this.getTestHistory();
    if (tests[testIndex]) {
      const test = tests[testIndex];
      this.ctx.postMessage({
        type: "testGenerated",
        code: test.code,
        suggestedPath: test.path,
        framework: test.framework
      });
    }
  }
  /**
   * 自动修复测试
   */
  async autoFixTest(code, errors, framework, testPath) {
    this.ctx.updateTaskStatus("test", "running", "\u6B63\u5728\u4FEE\u590D\u6D4B\u8BD5\u4EE3\u7801...");
    const streamingMessageId = generateId();
    const language = this.getLanguageFromFramework(framework);
    let messageAdded = false;
    try {
      const errorString = errors.join("\n");
      await this.ctx.autoFixService.fixTestStreaming(code, errorString, framework, language, {
        onChunk: (chunk, fullContent) => {
          if (!messageAdded) {
            messageAdded = true;
            this.ctx.postMessage({
              type: "addMessage",
              message: {
                id: streamingMessageId,
                role: "assistant",
                content: fullContent,
                timestamp: Date.now()
              },
              streaming: true
            });
          } else {
            this.ctx.postMessage({
              type: "updateMessage",
              messageId: streamingMessageId,
              content: fullContent
            });
          }
        },
        onComplete: (result) => {
          if (result.success && result.fixedCode) {
            const finalContent = `\u2705 **\u6D4B\u8BD5\u4EE3\u7801\u4FEE\u590D\u5B8C\u6210**

${result.explanation || ""}

\`\`\`${language || "typescript"}
${result.fixedCode}
\`\`\``;
            if (messageAdded) {
              this.ctx.postMessage({
                type: "completeMessage",
                messageId: streamingMessageId,
                content: finalContent
              });
            }
            this.ctx.postMessage({ type: "testAutoFixed", code: result.fixedCode });
            this.ctx.updateTaskStatus("test", "success", "\u6D4B\u8BD5\u4FEE\u590D\u5B8C\u6210");
          } else {
            if (messageAdded) {
              this.ctx.postMessage({
                type: "completeMessage",
                messageId: streamingMessageId,
                content: `\u274C **\u81EA\u52A8\u4FEE\u590D\u5931\u8D25**

${result.error || "\u65E0\u6CD5\u89E3\u6790\u4FEE\u590D\u7ED3\u679C"}`
              });
            }
            this.ctx.updateTaskStatus("test", "error", "\u4FEE\u590D\u5931\u8D25");
          }
        },
        onError: (err) => {
          const errorMessage = err instanceof Error ? err.message : "\u672A\u77E5\u9519\u8BEF";
          if (messageAdded) {
            this.ctx.postMessage({
              type: "completeMessage",
              messageId: streamingMessageId,
              content: `\u274C **\u81EA\u52A8\u4FEE\u590D\u5931\u8D25**

${errorMessage}`
            });
          }
          this.ctx.updateTaskStatus("test", "error", errorMessage);
        }
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "\u672A\u77E5\u9519\u8BEF";
      this.ctx.updateTaskStatus("test", "error", errorMsg);
    }
  }
  /**
   * 重命名测试
   */
  renameTest(testIndex, newName) {
    try {
      const key = "testHistory";
      const tests = this.ctx.extensionContext.globalState.get(key, []);
      if (tests[testIndex]) {
        tests[testIndex].customName = newName;
        this.ctx.extensionContext.globalState.update(key, tests);
        vscode9.window.showInformationMessage(`\u6D4B\u8BD5\u5DF2\u91CD\u547D\u540D\u4E3A: ${newName}`);
      }
    } catch (e) {
      vscode9.window.showErrorMessage("\u91CD\u547D\u540D\u5931\u8D25");
    }
  }
  /**
   * 删除测试
   */
  deleteTest(testIndex) {
    try {
      const key = "testHistory";
      const tests = this.ctx.extensionContext.globalState.get(key, []);
      tests.splice(testIndex, 1);
      this.ctx.extensionContext.globalState.update(key, tests);
      vscode9.window.showInformationMessage("\u6D4B\u8BD5\u5386\u53F2\u5DF2\u5220\u9664");
    } catch (e) {
      vscode9.window.showErrorMessage("\u5220\u9664\u5931\u8D25");
    }
  }
  /**
   * 优化测试代码
   */
  async refineTest(code, framework, testPath) {
    this.ctx.updateTaskStatus("test", "running", "\u6B63\u5728\u4F18\u5316\u6D4B\u8BD5\u4EE3\u7801...");
    const streamingMessageId = generateId();
    const language = this.getLanguageFromFramework(framework);
    let messageAdded = false;
    let response = "";
    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.updateTaskStatus("test", "error", "API Key \u672A\u914D\u7F6E");
      return;
    }
    const languageSuffix = i18n.isChinese() ? "\n\n\u3010\u8BED\u8A00\u8981\u6C42\u3011\u8BF7\u4F7F\u7528\u4E2D\u6587\u56DE\u590D\u548C\u6CE8\u91CA\u3002" : "\n\nPlease respond in English.";
    const prompt = `\u4F60\u662F\u4E00\u4E2A\u6D4B\u8BD5\u4EE3\u7801\u4E13\u5BB6\u3002\u8BF7\u4F18\u5316\u548C\u5B8C\u5584\u4EE5\u4E0B\u6D4B\u8BD5\u4EE3\u7801\uFF1A

**\u6D4B\u8BD5\u6846\u67B6:** ${framework}
**\u5F53\u524D\u4EE3\u7801:**
\`\`\`
${code}
\`\`\`

**\u4F18\u5316\u8981\u6C42:**
1. \u8865\u5168\u4E0D\u5B8C\u6574\u7684\u6D4B\u8BD5\u4EE3\u7801
2. \u4FEE\u590D\u53EF\u80FD\u7684\u8BED\u6CD5\u9519\u8BEF
3. \u6539\u8FDB\u6D4B\u8BD5\u8986\u76D6\u8303\u56F4
4. \u4F18\u5316\u6D4B\u8BD5\u547D\u540D\u548C\u7ED3\u6784
5. \u6DFB\u52A0\u5FC5\u8981\u7684 import \u8BED\u53E5
6. \u786E\u4FDD\u4EE3\u7801\u53EF\u4EE5\u6B63\u5E38\u8FD0\u884C

\u8BF7\u76F4\u63A5\u8FD4\u56DE\u4F18\u5316\u540E\u7684\u5B8C\u6574\u4EE3\u7801\uFF0C\u4F7F\u7528\u4EE3\u7801\u5757\u683C\u5F0F\u3002${languageSuffix}`;
    await chatService.sendMessage(
      [{ id: "0", role: "user", content: prompt, timestamp: Date.now() }],
      {
        onToken: (token) => {
          response += token;
          if (!messageAdded && response.length > 30) {
            messageAdded = true;
            this.ctx.postMessage({
              type: "addMessage",
              message: {
                id: streamingMessageId,
                role: "assistant",
                content: response,
                timestamp: Date.now()
              },
              streaming: true
            });
          } else if (messageAdded) {
            this.ctx.postMessage({
              type: "updateMessage",
              messageId: streamingMessageId,
              content: response
            });
          }
        },
        onComplete: async () => {
          const refinedCode = this.ctx.testGenerator.extractTestCode(response, language);
          if (refinedCode && refinedCode.length > 50) {
            const finalContent = `\u2705 **\u6D4B\u8BD5\u4EE3\u7801\u4F18\u5316\u5B8C\u6210**

\`\`\`${language || "typescript"}
${refinedCode}
\`\`\`

\u8BF7\u68C0\u67E5\u5E76\u8FD0\u884C\u6D4B\u8BD5\u9A8C\u8BC1\u3002`;
            if (messageAdded) {
              this.ctx.postMessage({
                type: "completeMessage",
                messageId: streamingMessageId,
                content: finalContent
              });
            }
            this.ctx.postMessage({ type: "testAutoFixed", code: refinedCode });
            this.ctx.updateTaskStatus("test", "success", "\u6D4B\u8BD5\u4EE3\u7801\u4F18\u5316\u5B8C\u6210");
          } else {
            if (messageAdded) {
              this.ctx.postMessage({
                type: "completeMessage",
                messageId: streamingMessageId,
                content: response || "\u274C \u65E0\u6CD5\u4F18\u5316\u6D4B\u8BD5\u4EE3\u7801\uFF0C\u8BF7\u5C1D\u8BD5\u624B\u52A8\u7F16\u8F91\u3002"
              });
            }
            this.ctx.updateTaskStatus("test", "error", "\u4F18\u5316\u7ED3\u679C\u65E0\u6548");
          }
        },
        onError: (error) => {
          if (messageAdded) {
            this.ctx.postMessage({
              type: "completeMessage",
              messageId: streamingMessageId,
              content: `\u274C **\u4F18\u5316\u5931\u8D25**

${error.message}`
            });
          }
          this.ctx.updateTaskStatus("test", "error", error.message);
        }
      },
      { maxTokens: 8192, requestId: `test-refine-${streamingMessageId}` }
    );
  }
  // 辅助方法
  async saveTestToHistory(test) {
    try {
      const key = "testHistory";
      const existing = this.ctx.extensionContext.globalState.get(key, []);
      const updated = [{ ...test, timestamp: Date.now() }, ...existing].slice(0, 20);
      await this.ctx.extensionContext.globalState.update(key, updated);
    } catch (e) {
      console.error("Failed to save test history:", e);
    }
  }
  getTestHistory() {
    return this.ctx.extensionContext.globalState.get("testHistory", []);
  }
  getLanguageFromFramework(framework) {
    const frameworkLanguages = {
      "jest": "typescript",
      "vitest": "typescript",
      "mocha": "javascript",
      "pytest": "python",
      "unittest": "python",
      "go": "go",
      "junit": "java"
    };
    return frameworkLanguages[framework.toLowerCase()] || "typescript";
  }
  detectLanguageFromCode(code) {
    const indicators = {
      "typescript": [/:\s*(?:string|number|boolean)/, /interface\s+\w+/, /type\s+\w+\s*=/],
      "javascript": [/function\s+\w+/, /const\s+\w+\s*=/, /let\s+\w+\s*=/],
      "python": [/def\s+\w+/, /import\s+\w+/, /class\s+\w+:/],
      "go": [/func\s+\w+/, /package\s+\w+/, /import\s+\(/],
      "java": [/public\s+class/, /private\s+\w+/, /void\s+\w+\(/]
    };
    for (const [lang, patterns] of Object.entries(indicators)) {
      if (patterns.some((p) => p.test(code))) {
        return lang;
      }
    }
    return "unknown";
  }
  normalizeLanguageId(langId) {
    const map = {
      "typescriptreact": "typescript",
      "javascriptreact": "javascript"
    };
    return map[langId] || langId;
  }
  detectFrameworkFromLanguage(language) {
    const frameworks = {
      "typescript": "jest",
      "javascript": "jest",
      "python": "pytest",
      "go": "go",
      "java": "junit"
    };
    return frameworks[language] || "jest";
  }
  getExtensionForLanguage(language) {
    const extensions = {
      "typescript": ".test.ts",
      "javascript": ".test.js",
      "python": "_test.py",
      "go": "_test.go",
      "java": "Test.java"
    };
    return extensions[language] || ".test.ts";
  }
};

// src/extension/chatview/handlers/CommandHandler.ts
var vscode17 = __toESM(require("vscode"));
init_shared();
init_mcp();
var CommandHandler = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.registry = MCPRegistry.getInstance(ctx.extensionContext);
    this.executor = MCPExecutor.getInstance(ctx.extensionContext, this.registry);
  }
  async handle(data) {
    return false;
  }
  /**
   * 执行命令 - 大部分命令已迁移到MCP
   */
  async executeCommand(parsed, diagramHandler, testHandler, sessionHandler) {
    const { command, args } = parsed;
    const silentCommands = ["clear", "diagram", "gentest"];
    let userMessageId = null;
    if (!silentCommands.includes(command)) {
      const commandText = `/${command}${args.length > 0 ? " " + args.join(" ") : ""}`;
      const userMessage = {
        id: generateId(),
        role: "user",
        content: commandText,
        timestamp: Date.now()
      };
      userMessageId = userMessage.id;
      await this.ctx.sessionManager.addMessage(userMessage);
      this.ctx.postMessage({ type: "addMessage", message: userMessage });
    }
    const removeUserMessage = async () => {
      if (userMessageId) {
        await this.ctx.sessionManager.removeLastMessage();
        this.ctx.postMessage({ type: "removeMessage", messageId: userMessageId });
      }
    };
    try {
      switch (command) {
        case "clear":
          await sessionHandler.clearChat();
          break;
        case "compact":
          await this.compactContext();
          break;
        case "resume":
          await sessionHandler.showSessionPicker();
          break;
        case "init":
          await this.executeMCPTool("builtin_init_project", {});
          break;
        case "help":
          await this.executeMCPTool("builtin_help", {});
          break;
        case "file":
          if (args[0]) {
            await this.executeMCPTool("builtin_read_file", { filePath: args[0] });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: "error", message: "\u8BF7\u6307\u5B9A\u6587\u4EF6\u8DEF\u5F84" });
          }
          break;
        case "search":
          if (args.length) {
            await this.executeMCPTool("builtin_search_code", { query: args.join(" ") });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: "error", message: "\u8BF7\u8F93\u5165\u641C\u7D22\u5173\u952E\u8BCD" });
          }
          break;
        case "run":
          if (args.length) {
            await this.executeMCPTool("builtin_run_command", { command: args.join(" ") });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: "error", message: "\u8BF7\u8F93\u5165\u8981\u6267\u884C\u7684\u547D\u4EE4" });
          }
          break;
        case "build":
          await this.executeMCPTool("builtin_build", {});
          break;
        case "test":
          await this.executeMCPTool("builtin_run_test", {});
          break;
        case "git":
          if (args.length) {
            await this.executeMCPTool("builtin_run_command", { command: `git ${args.join(" ")}` });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: "error", message: "\u8BF7\u8F93\u5165git\u547D\u4EE4\u53C2\u6570" });
          }
          break;
        case "gst":
          await this.executeMCPTool("builtin_git_status", {});
          break;
        case "gpl":
          await this.executeMCPTool("builtin_git_pull", {});
          break;
        case "gps":
          await this.executeMCPTool("builtin_git_push", {});
          break;
        case "gco":
          if (args[0]) {
            await this.executeMCPTool("builtin_git_checkout", { branch: args[0] });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: "error", message: "\u8BF7\u6307\u5B9A\u5206\u652F\u540D" });
          }
          break;
        case "gcm":
          if (args.length) {
            await this.executeMCPTool("builtin_git_commit", { message: args.join(" ") });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: "error", message: "\u8BF7\u8F93\u5165\u63D0\u4EA4\u4FE1\u606F" });
          }
          break;
        case "gdf":
          await this.executeMCPTool("builtin_git_diff", { file: args[0] || void 0 });
          break;
        case "glg":
          await this.executeMCPTool("builtin_git_log", { count: 15 });
          break;
        case "diagram":
          this.ctx.postMessage({ type: "clearInput" });
          await this.handleDiagramCommand(args, diagramHandler);
          break;
        case "gentest":
          this.ctx.postMessage({ type: "clearInput" });
          const fullArgs = args.join(" ");
          if (fullArgs.startsWith("code:") || fullArgs.includes("```")) {
            await testHandler.generateFromCode(fullArgs);
          } else {
            await testHandler.generateTest(args[0]);
          }
          break;
        default:
          await removeUserMessage();
          this.ctx.postMessage({
            type: "addMessage",
            message: {
              id: generateId(),
              role: "assistant",
              content: `\u274C \u672A\u77E5\u547D\u4EE4: \`/${command}\`

\u8F93\u5165 \`/help\` \u67E5\u770B\u6240\u6709\u53EF\u7528\u547D\u4EE4\uFF0C\u6216\u4F7F\u7528 \`@mcp:list\` \u67E5\u770B\u53EF\u7528MCP\u5DE5\u5177\u3002`,
              timestamp: Date.now()
            }
          });
          break;
      }
    } catch (error) {
      await removeUserMessage();
      this.ctx.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "\u547D\u4EE4\u6267\u884C\u5931\u8D25"
      });
    }
  }
  /**
   * 执行MCP工具
   */
  async executeMCPTool(toolId, params) {
    var _a, _b, _c, _d;
    const registration = this.registry.getTool(toolId);
    if (!registration) {
      this.ctx.postMessage({
        type: "addMessage",
        message: {
          id: generateId(),
          role: "assistant",
          content: `\u26A0\uFE0F MCP\u5DE5\u5177 \`${toolId}\` \u672A\u627E\u5230`,
          timestamp: Date.now()
        }
      });
      return;
    }
    this.ctx.updateTaskStatus("command", "running", `\u6267\u884C: ${registration.tool.name}`);
    try {
      const result = await this.executor.execute({
        toolId,
        arguments: params,
        caller: "user",
        context: {
          workspaceRoot: (_b = (_a = vscode17.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath,
          activeFile: (_c = vscode17.window.activeTextEditor) == null ? void 0 : _c.document.fileName
        }
      });
      let content;
      if (result.success) {
        const data = result.data;
        if (typeof data === "string") {
          content = data;
        } else if (data == null ? void 0 : data.content) {
          content = data.content;
        } else if ((data == null ? void 0 : data.stdout) !== void 0 || (data == null ? void 0 : data.stderr) !== void 0) {
          const success = data.success !== false && data.exitCode !== 1;
          const output = [data.stdout, data.stderr].filter(Boolean).join("\n");
          content = `${success ? "\u2705" : "\u274C"} **${registration.tool.name}**

\`\`\`
${output || "(\u65E0\u8F93\u51FA)"}
\`\`\``;
        } else if ((data == null ? void 0 : data.log) !== void 0) {
          content = `\u{1F4DC} **Git\u65E5\u5FD7**

\`\`\`
${data.log || "(\u65E0\u65E5\u5FD7)"}
\`\`\``;
        } else if ((data == null ? void 0 : data.diff) !== void 0) {
          content = `\u{1F4DD} **Git\u5DEE\u5F02**

\`\`\`diff
${data.diff || "(\u65E0\u5DEE\u5F02)"}
\`\`\``;
        } else if (data == null ? void 0 : data.type) {
          content = `\u2705 **\u9879\u76EE\u5206\u6790\u5B8C\u6210**

`;
          content += `**\u9879\u76EE\u7C7B\u578B:** ${data.type}
`;
          if (data.framework)
            content += `**\u6846\u67B6:** ${data.framework}
`;
          if (data.language)
            content += `**\u8BED\u8A00:** ${data.language}
`;
          if (data.structure) {
            const structureStr = JSON.stringify(data.structure, null, 2).slice(0, 2e3);
            content += `
**\u76EE\u5F55\u7ED3\u6784:**
\`\`\`
${structureStr}
\`\`\``;
          }
        } else {
          const dataStr = JSON.stringify(data, null, 2);
          content = `\u2705 **${registration.tool.name}**

\`\`\`json
${dataStr.slice(0, 5e3)}${dataStr.length > 5e3 ? "\n...(\u5DF2\u622A\u65AD)" : ""}
\`\`\``;
        }
      } else {
        content = `\u274C **${registration.tool.name}** \u6267\u884C\u5931\u8D25

${((_d = result.error) == null ? void 0 : _d.message) || "\u672A\u77E5\u9519\u8BEF"}`;
      }
      this.ctx.postMessage({
        type: "addMessage",
        message: {
          id: generateId(),
          role: "assistant",
          content,
          timestamp: Date.now()
        }
      });
      this.ctx.updateTaskStatus(
        "command",
        result.success ? "success" : "error",
        result.success ? "\u5B8C\u6210" : "\u5931\u8D25"
      );
    } catch (error) {
      this.ctx.postMessage({
        type: "addMessage",
        message: {
          id: generateId(),
          role: "assistant",
          content: `\u274C \u6267\u884C\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`,
          timestamp: Date.now()
        }
      });
      this.ctx.updateTaskStatus("command", "error", "\u6267\u884C\u5931\u8D25");
    }
  }
  /**
   * 处理图表命令
   */
  async handleDiagramCommand(args, diagramHandler) {
    if (args[0]) {
      const diagramType = args[0].toLowerCase();
      if (diagramType === "file") {
        await diagramHandler.generateFromFile(args[1]);
      } else if (diagramType === "project") {
        await diagramHandler.generateFromProject();
      } else if (["flowchart", "sequence", "class", "state", "er", "gantt", "mindmap", "architecture"].includes(diagramType)) {
        const editor = vscode17.window.activeTextEditor;
        if (editor && !editor.selection.isEmpty) {
          await diagramHandler.generateFromSelection(diagramType);
        } else if (editor) {
          await diagramHandler.generateFromFile(void 0, diagramType);
        } else {
          if (["architecture", "mindmap"].includes(diagramType)) {
            await diagramHandler.generateFromProject();
          } else {
            this.ctx.postMessage({
              type: "addMessage",
              message: {
                id: generateId(),
                role: "assistant",
                content: `\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u6587\u4EF6\u6216\u9009\u4E2D\u4E00\u4E9B\u4EE3\u7801\uFF0C\u7136\u540E\u91CD\u8BD5\u3002

\u6216\u8005\u4F60\u53EF\u4EE5\u76F4\u63A5\u544A\u8BC9\u6211\u60F3\u8981\u7684\u56FE\u8868\u5185\u5BB9\uFF0C\u6BD4\u5982\uFF1A"\u5E2E\u6211\u753B\u4E00\u4E2A\u7528\u6237\u767B\u5F55\u7684\u6D41\u7A0B\u56FE"`,
                timestamp: Date.now()
              }
            });
          }
        }
      } else {
        const description = args.join(" ");
        await diagramHandler.generateFromDescription(description);
      }
    } else {
      const editor = vscode17.window.activeTextEditor;
      if (editor && !editor.selection.isEmpty) {
        await diagramHandler.generateFromSelection("flowchart");
      } else if (editor) {
        await diagramHandler.generateFromFile();
      } else {
        await diagramHandler.generateFromProject();
      }
    }
  }
  /**
   * 压缩上下文
   */
  async compactContext() {
    const messages = this.ctx.sessionManager.getMessages();
    if (messages.length < 5) {
      this.ctx.postMessage({
        type: "addMessage",
        message: {
          id: generateId(),
          role: "assistant",
          content: "\u5F53\u524D\u4E0A\u4E0B\u6587\u8F83\u77ED\uFF0C\u65E0\u9700\u538B\u7F29\u3002",
          timestamp: Date.now()
        }
      });
      return;
    }
    const keepCount = Math.min(4, Math.floor(messages.length / 2));
    const removedCount = messages.length - keepCount;
    const summary = `[\u5DF2\u538B\u7F29 ${removedCount} \u6761\u5386\u53F2\u6D88\u606F]`;
    this.ctx.postMessage({
      type: "addMessage",
      message: {
        id: generateId(),
        role: "assistant",
        content: `\u2705 \u4E0A\u4E0B\u6587\u5DF2\u538B\u7F29

${summary}

\u4FDD\u7559\u6700\u8FD1 ${keepCount} \u6761\u6D88\u606F\u3002`,
        timestamp: Date.now()
      }
    });
  }
};

// src/extension/chatview/handlers/ConfigHandler.ts
var vscode18 = __toESM(require("vscode"));
var ConfigHandler = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async handle(data) {
    switch (data.type) {
      case "getConfig":
        this.sendConfig();
        return true;
      case "updateModel":
        await this.updateModel(data.provider, data.model);
        return true;
      case "setApiKey":
        await this.setApiKey(data.provider, data.apiKey);
        return true;
      case "getApiKeyStatus":
        await this.getApiKeyStatus();
        return true;
      case "setLanguage":
        await this.setLanguage(data.language);
        return true;
      case "getLanguage":
        this.sendLanguage();
        return true;
      case "getHistory":
        this.sendMessageHistory(data.direction);
        return true;
      case "getSuggestions":
        this.sendCommandSuggestions(data.input);
        return true;
      case "searchMessages":
        this.searchMessages(data.query);
        return true;
      default:
        return false;
    }
  }
  /**
   * 发送配置
   */
  sendConfig() {
    const modelConfig = this.ctx.configManager.getModelConfig();
    const allModels = this.ctx.configManager.getAllModels();
    this.ctx.postMessage({
      type: "config",
      modelConfig,
      allModels
    });
  }
  /**
   * 更新模型
   */
  async updateModel(provider, model) {
    await this.ctx.configManager.updateModelConfig({ provider, model });
    const config = await this.ctx.configManager.getFullModelConfig();
    if (config.apiKey) {
      const { ChatService: ChatService2 } = await Promise.resolve().then(() => (init_ChatService(), ChatService_exports));
      this.ctx.chatService = new ChatService2(config);
    }
    this.sendConfig();
    vscode18.window.showInformationMessage(`\u5DF2\u5207\u6362\u5230\u6A21\u578B: ${model}`);
  }
  /**
   * 设置API Key
   */
  async setApiKey(provider, apiKey) {
    await this.ctx.configManager.setApiKey(provider, apiKey);
    const config = await this.ctx.configManager.getFullModelConfig();
    if (config.apiKey) {
      const { ChatService: ChatService2 } = await Promise.resolve().then(() => (init_ChatService(), ChatService_exports));
      this.ctx.chatService = new ChatService2(config);
    }
    await this.getApiKeyStatus();
    vscode18.window.showInformationMessage(`${provider} API Key \u5DF2\u4FDD\u5B58`);
  }
  /**
   * 获取API Key状态
   */
  async getApiKeyStatus() {
    const providers = ["deepseek", "openai", "anthropic", "kimi", "openrouter"];
    const status = {};
    for (const provider of providers) {
      const key = await this.ctx.configManager.getApiKey(provider);
      status[provider] = !!key && key.length > 0;
    }
    this.ctx.postMessage({ type: "apiKeyStatus", status });
  }
  /**
   * 设置语言
   */
  async setLanguage(language) {
    const langCode = language === "en" ? "en-US" : language;
    i18n.setLanguage(langCode);
    await this.ctx.extensionContext.globalState.update("aiAssistant.language", langCode);
    this.ctx.postMessage({ type: "languageChanged", language: langCode });
    vscode18.window.showInformationMessage(
      langCode === "zh-CN" ? "\u8BED\u8A00\u5DF2\u5207\u6362\u4E3A\u4E2D\u6587" : "Language switched to English"
    );
  }
  /**
   * 发送语言设置
   */
  sendLanguage() {
    const language = i18n.getCurrentLanguage();
    this.ctx.postMessage({ type: "language", language });
  }
  /**
   * 发送消息历史（用于上下键浏览）
   */
  sendMessageHistory(direction) {
    const history = this.ctx.messageHistory;
    if (history.length === 0) {
      this.ctx.postMessage({ type: "historyItem", content: "" });
      return;
    }
    if (direction === "up") {
      if (this.ctx.historyIndex < history.length - 1) {
        this.ctx.historyIndex++;
      }
    } else {
      if (this.ctx.historyIndex > -1) {
        this.ctx.historyIndex--;
      }
    }
    const content = this.ctx.historyIndex >= 0 ? history[history.length - 1 - this.ctx.historyIndex] : "";
    this.ctx.postMessage({ type: "historyItem", content });
  }
  /**
   * 发送命令建议
   */
  sendCommandSuggestions(input) {
    if (!input.startsWith("/")) {
      this.ctx.postMessage({ type: "suggestions", suggestions: [] });
      return;
    }
    const query = input.slice(1).toLowerCase();
    const commands8 = [
      { command: "/clear", description: "\u6E05\u7A7A\u5F53\u524D\u5BF9\u8BDD" },
      { command: "/init", description: "\u5206\u6790\u9879\u76EE\u7ED3\u6784" },
      { command: "/diagram", description: "\u751F\u6210\u56FE\u8868" },
      { command: "/gentest", description: "\u751F\u6210\u6D4B\u8BD5" },
      { command: "/run", description: "\u6267\u884C\u547D\u4EE4" },
      { command: "/search", description: "\u641C\u7D22\u4EE3\u7801" },
      { command: "/file", description: "\u8BFB\u53D6\u6587\u4EF6" },
      { command: "/help", description: "\u663E\u793A\u5E2E\u52A9" },
      { command: "/gst", description: "git status" },
      { command: "/gpl", description: "git pull" },
      { command: "/gps", description: "git push" },
      { command: "/gcm", description: "git commit -m" }
    ];
    const suggestions = commands8.filter((c) => c.command.toLowerCase().includes(query)).slice(0, 5);
    this.ctx.postMessage({ type: "suggestions", suggestions });
  }
  /**
   * 搜索消息
   */
  searchMessages(query) {
    if (!query || query.trim().length === 0) {
      this.ctx.postMessage({ type: "searchResults", results: [], query: "" });
      return;
    }
    const normalizedQuery = query.trim().toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
    const session = this.ctx.sessionManager.currentSession;
    let results = [];
    if (session) {
      const sessionResults = this.searchInSession(session, queryWords, normalizedQuery);
      results.push(...sessionResults);
    }
    const sessionList = this.ctx.sessionManager.getSessionList();
    for (const sessionInfo of sessionList) {
      if (sessionInfo.id === (session == null ? void 0 : session.id))
        continue;
      const historicalSession = this.ctx.sessionManager.getSessionById(sessionInfo.id);
      if (historicalSession) {
        const sessionResults = this.searchInSession(
          historicalSession,
          queryWords,
          normalizedQuery,
          sessionInfo.id,
          sessionInfo.title
        );
        results.push(...sessionResults);
      }
    }
    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, 50);
    const finalResults = results.map(({ score, ...rest }) => rest);
    this.ctx.postMessage({ type: "searchResults", results: finalResults, query });
  }
  /**
   * 在单个会话中搜索消息
   */
  searchInSession(session, queryWords, normalizedQuery, sessionId, sessionTitle) {
    const results = [];
    for (const m of session.messages) {
      const contentLower = m.content.toLowerCase();
      let score = 0;
      let matchStart = -1;
      const exactMatchIndex = contentLower.indexOf(normalizedQuery);
      if (exactMatchIndex !== -1) {
        score += 10;
        matchStart = exactMatchIndex;
      }
      let wordMatches = 0;
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          wordMatches++;
          if (matchStart === -1) {
            matchStart = contentLower.indexOf(word);
          }
        }
      }
      if (wordMatches > 0) {
        score += wordMatches * 2;
        if (wordMatches === queryWords.length) {
          score += 5;
        }
      }
      if (score > 0) {
        results.push({
          id: m.id,
          role: m.role,
          preview: this.getSearchPreview(m.content, normalizedQuery, matchStart),
          timestamp: m.timestamp,
          sessionId,
          sessionTitle,
          score
        });
      }
    }
    return results;
  }
  /**
   * 获取搜索预览
   */
  getSearchPreview(content, query, matchStart) {
    const maxLength = 120;
    if (matchStart >= 0) {
      const start = Math.max(0, matchStart - 30);
      const end = Math.min(content.length, start + maxLength);
      let preview = content.slice(start, end);
      if (start > 0)
        preview = "..." + preview;
      if (end < content.length)
        preview += "...";
      return preview;
    }
    return content.slice(0, maxLength) + (content.length > maxLength ? "..." : "");
  }
};

// src/extension/chatview/handlers/MCPHandler.ts
var vscode19 = __toESM(require("vscode"));
init_shared();
init_mcp();
var MCPHandler = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.registry = MCPRegistry.getInstance(ctx.extensionContext);
    this.executor = MCPExecutor.getInstance(ctx.extensionContext, this.registry);
    this.agent = MCPAgent.getInstance(
      ctx.extensionContext,
      this.registry,
      this.executor,
      ctx.configManager
    );
    this.autonomousAgent = AutonomousAgent.getInstance(
      ctx.extensionContext,
      this.registry,
      this.executor,
      ctx.configManager
    );
    this.executor.onExecutionComplete((history) => {
      this.ctx.postMessage({
        type: "mcp:executionComplete",
        history
      });
    });
    this.agent.onStatusChange((status) => {
      this.ctx.postMessage({
        type: "mcp:agentStatusChange",
        status
      });
    });
    this.agent.onStepUpdate((step) => {
      this.ctx.postMessage({
        type: "mcp:agentStepUpdate",
        step
      });
    });
    this.agent.onProgress((progress) => {
      this.ctx.postMessage({
        type: "mcp:agentProgress",
        ...progress
      });
    });
    this.autonomousAgent.onStatusChange((status) => {
      this.ctx.postMessage({
        type: "mcp:autonomousAgentStatusChange",
        status
      });
    });
    this.autonomousAgent.onIteration((iteration) => {
      this.ctx.postMessage({
        type: "mcp:autonomousAgentIteration",
        iteration
      });
    });
    this.autonomousAgent.onThought((thought) => {
      this.ctx.postMessage({
        type: "mcp:autonomousAgentThought",
        thought
      });
    });
    this.autonomousAgent.onToolExecution(({ call, result }) => {
      this.ctx.postMessage({
        type: "mcp:autonomousAgentToolExecution",
        call,
        result
      });
    });
    this.autonomousAgent.onProgress((progress) => {
      this.ctx.postMessage({
        type: "mcp:autonomousAgentProgress",
        ...progress
      });
    });
  }
  async handle(data) {
    var _a;
    if (!((_a = data.type) == null ? void 0 : _a.startsWith("mcp:"))) {
      return false;
    }
    switch (data.type) {
      case "mcp:getTools":
        await this.handleGetTools();
        return true;
      case "mcp:getTool":
        await this.handleGetTool(data.toolId);
        return true;
      case "mcp:registerTool":
        await this.handleRegisterTool(data.tool);
        return true;
      case "mcp:updateTool":
        await this.handleUpdateTool(data.tool);
        return true;
      case "mcp:deleteTool":
        await this.handleDeleteTool(data.toolId);
        return true;
      case "mcp:toggleTool":
        await this.handleToggleTool(data.toolId, data.enabled);
        return true;
      case "mcp:testTool":
        await this.handleTestTool(data.toolId, data.testParams);
        return true;
      case "mcp:executeTool":
        await this.handleExecuteTool(data.params);
        return true;
      case "mcp:agentRequest":
        await this.handleAgentRequest(data.request);
        return true;
      case "mcp:cancelAgent":
        this.agent.cancelTask();
        return true;
      case "mcp:autonomousAgentRequest":
        await this.handleAutonomousAgentRequest(data.request);
        return true;
      case "mcp:cancelAutonomousAgent":
        this.autonomousAgent.cancel();
        return true;
      case "mcp:getAutonomousAgentStatus":
        this.ctx.postMessage({
          type: "mcp:autonomousAgentStatus",
          status: this.autonomousAgent.getStatus(),
          iterations: this.autonomousAgent.getIterations()
        });
        return true;
      case "mcp:getConfig":
        this.handleGetConfig();
        return true;
      case "mcp:updateConfig":
        await this.handleUpdateConfig(data.config);
        return true;
      case "mcp:importTools":
        await this.handleImportTools(data.data);
        return true;
      case "mcp:exportTools":
        this.handleExportTools(data.toolIds);
        return true;
      case "mcp:getExecutionHistory":
        this.handleGetExecutionHistory(data.limit);
        return true;
      default:
        return false;
    }
  }
  /**
   * 处理聊天消息中的MCP指令
   * 从ChatMessageHandler调用
   */
  async handleMCPCommand(input) {
    const parseResult = MCPParser.parse(input);
    if (parseResult.type === "none") {
      return false;
    }
    const userMessage = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: Date.now()
    };
    await this.ctx.sessionManager.addMessage(userMessage);
    this.ctx.postMessage({ type: "addMessage", message: userMessage });
    switch (parseResult.type) {
      case "help":
        await this.sendAssistantMessage(MCPParser.getHelpText());
        break;
      case "list":
        await this.sendToolList();
        break;
      case "search":
        await this.sendSearchResults(parseResult.searchQuery || "");
        break;
      case "manage":
        this.ctx.postMessage({ type: "mcp:openManagePanel" });
        await this.sendAssistantMessage("\u5DF2\u6253\u5F00MCP\u5DE5\u5177\u7BA1\u7406\u9762\u677F\u3002");
        break;
      case "history":
        await this.sendExecutionHistory();
        break;
      case "call":
        this.ctx.updateTaskStatus("mcp", "running", `\u6267\u884C\u5DE5\u5177: ${parseResult.toolId}`);
        await this.executeToolFromChat(parseResult);
        break;
      case "agent":
        await this.executeAgentFromChat(parseResult);
        break;
    }
    return true;
  }
  // ============================================
  // 工具管理处理 (保持原有实现)
  // ============================================
  async handleGetTools() {
    const tools = this.registry.getAllTools();
    this.ctx.postMessage({
      type: "mcp:toolList",
      tools
    });
  }
  async handleGetTool(toolId) {
    const tool = this.registry.getTool(toolId);
    this.ctx.postMessage({
      type: "mcp:toolDetail",
      tool: tool || null
    });
  }
  async handleRegisterTool(tool) {
    try {
      await this.registry.registerTool(tool);
      this.ctx.postMessage({ type: "mcp:toolRegistered", toolId: tool.id });
    } catch (error) {
      this.ctx.postMessage({
        type: "mcp:error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  async handleUpdateTool(tool) {
    try {
      await this.registry.updateTool(tool);
      this.ctx.postMessage({ type: "mcp:toolUpdated", toolId: tool.id });
    } catch (error) {
      this.ctx.postMessage({
        type: "mcp:error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  async handleDeleteTool(toolId) {
    try {
      await this.registry.deleteTool(toolId);
      this.ctx.postMessage({ type: "mcp:toolDeleted", toolId });
    } catch (error) {
      this.ctx.postMessage({
        type: "mcp:error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  async handleToggleTool(toolId, enabled) {
    try {
      await this.registry.toggleTool(toolId, enabled);
      this.ctx.postMessage({ type: "mcp:toolToggled", toolId, enabled });
    } catch (error) {
      this.ctx.postMessage({
        type: "mcp:error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  async handleTestTool(toolId, testParams) {
    var _a, _b;
    const result = await this.executor.execute({
      toolId,
      arguments: testParams,
      caller: "test",
      context: {
        workspaceRoot: (_b = (_a = vscode19.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath
      }
    });
    this.ctx.postMessage({
      type: "mcp:testResult",
      toolId,
      result
    });
  }
  async handleExecuteTool(params) {
    const result = await this.executor.execute(params);
    this.ctx.postMessage({
      type: "mcp:executionResult",
      result
    });
  }
  async handleAgentRequest(request) {
    try {
      const result = await this.agent.execute(request);
      this.ctx.postMessage({
        type: "mcp:agentResult",
        result
      });
    } catch (error) {
      this.ctx.postMessage({
        type: "mcp:agentError",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  handleGetConfig() {
    this.ctx.postMessage({
      type: "mcp:config",
      config: {}
    });
  }
  async handleUpdateConfig(config) {
    this.ctx.postMessage({ type: "mcp:configUpdated" });
  }
  async handleImportTools(data) {
    this.ctx.postMessage({ type: "mcp:importComplete" });
  }
  handleExportTools(toolIds) {
    const tools = toolIds.map((id) => this.registry.getTool(id)).filter(Boolean);
    this.ctx.postMessage({
      type: "mcp:exportData",
      data: tools
    });
  }
  handleGetExecutionHistory(limit) {
    const history = this.executor.getHistory(limit);
    this.ctx.postMessage({
      type: "mcp:executionHistory",
      history
    });
  }
  /**
   * 发送助手消息
   */
  async sendAssistantMessage(content) {
    const message = {
      id: generateId(),
      role: "assistant",
      content,
      timestamp: Date.now()
    };
    await this.ctx.sessionManager.addMessage(message);
    this.ctx.postMessage({ type: "addMessage", message });
  }
  /**
   * 发送工具列表
   */
  async sendToolList() {
    const allTools = this.registry.getAllTools();
    if (allTools.length === 0) {
      await this.sendAssistantMessage("\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684MCP\u5DE5\u5177\u3002\u4F7F\u7528 `@mcp:manage` \u6253\u5F00\u7BA1\u7406\u9762\u677F\u6DFB\u52A0\u5DE5\u5177\u3002");
      return;
    }
    const byCategory = /* @__PURE__ */ new Map();
    allTools.forEach((reg) => {
      const cat = reg.tool.category || "custom";
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat).push(reg);
    });
    let content = "# \u{1F527} \u53EF\u7528MCP\u5DE5\u5177\n\n";
    byCategory.forEach((tools, category) => {
      content += `## ${this.getCategoryName(category)}

`;
      tools.forEach((reg) => {
        const status = reg.enabled ? "\u2705" : "\u23F8\uFE0F";
        content += `${status} **${reg.tool.name}** (\`@mcp:${reg.tool.id}\`)
`;
        content += `   ${reg.tool.description}

`;
      });
    });
    content += "\n\u4F7F\u7528 `@mcp:\u5DE5\u5177ID {\u53C2\u6570}` \u8C03\u7528\u5DE5\u5177";
    await this.sendAssistantMessage(content);
  }
  /**
   * 发送搜索结果
   */
  async sendSearchResults(query) {
    const results = this.registry.searchTools(query);
    if (results.length === 0) {
      await this.sendAssistantMessage(`\u6CA1\u6709\u627E\u5230\u5339\u914D "${query}" \u7684\u5DE5\u5177\u3002`);
      return;
    }
    let content = `# \u{1F50D} \u641C\u7D22\u7ED3\u679C: "${query}"

`;
    results.forEach((reg) => {
      const status = reg.enabled ? "\u2705" : "\u23F8\uFE0F";
      content += `${status} **${reg.tool.name}** (\`@mcp:${reg.tool.id}\`)
`;
      content += `   ${reg.tool.description}

`;
    });
    await this.sendAssistantMessage(content);
  }
  /**
   * 发送执行历史
   */
  async sendExecutionHistory() {
    const history = this.executor.getHistory(10);
    if (history.length === 0) {
      await this.sendAssistantMessage("\u6682\u65E0\u6267\u884C\u5386\u53F2\u3002");
      return;
    }
    let content = "# \u{1F4DC} \u6700\u8FD1\u6267\u884C\u5386\u53F2\n\n";
    for (const h of history) {
      const status = h.success ? "\u2705" : "\u274C";
      const time = new Date(h.timestamp).toLocaleString();
      const duration = h.duration;
      content += `${status} **${h.toolName}** - ${time} (${duration}ms)
`;
      content += `\`@mcp:${h.toolId}\`

`;
    }
    await this.sendAssistantMessage(content);
  }
  /**
   * [修改] 从聊天执行工具 - 结果通过chat消息完整返回
   */
  async executeToolFromChat(parseResult) {
    var _a, _b, _c, _d, _e;
    const { toolId, params } = parseResult;
    const registration = this.registry.getTool(toolId);
    if (!registration) {
      await this.sendAssistantMessage(`\u5DE5\u5177 \`${toolId}\` \u4E0D\u5B58\u5728\u3002\u4F7F\u7528 \`@mcp:list\` \u67E5\u770B\u53EF\u7528\u5DE5\u5177\u3002`);
      return;
    }
    if (!registration.enabled) {
      await this.sendAssistantMessage(`\u5DE5\u5177 \`${toolId}\` \u5DF2\u7981\u7528\u3002`);
      return;
    }
    this.ctx.updateTaskStatus("chat", "running", `\u6B63\u5728\u6267\u884C ${registration.tool.name}...`);
    this.ctx.postMessage({
      type: "mcp:toolExecutionStart",
      toolId,
      toolName: registration.tool.name,
      params
    });
    const startTime = Date.now();
    const result = await this.executor.execute({
      toolId,
      arguments: params,
      caller: "user",
      context: {
        workspaceRoot: (_b = (_a = vscode19.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath,
        activeFile: (_c = vscode19.window.activeTextEditor) == null ? void 0 : _c.document.fileName
      }
    });
    const duration = Date.now() - startTime;
    const executionResult = {
      id: generateId(),
      type: "mcp_execution",
      toolId,
      success: result.success,
      data: result.data,
      error: (_d = result.error) == null ? void 0 : _d.message,
      duration,
      timestamp: Date.now()
    };
    this.ctx.postMessage({
      type: "mcp:toolExecutionResult",
      result: executionResult,
      toolName: registration.tool.name
    });
    let chatContent;
    if (result.success) {
      const dataStr = result.data != null ? typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2) : "(\u65E0\u8FD4\u56DE\u6570\u636E)";
      const truncated = dataStr.length > 3e3 ? dataStr.slice(0, 3e3) + "\n...(\u7ED3\u679C\u5DF2\u622A\u65AD)" : dataStr;
      chatContent = `\u2705 **${registration.tool.name}** \u6267\u884C\u6210\u529F (${duration}ms)

`;
      chatContent += `\`\`\`json
${truncated}
\`\`\``;
    } else {
      chatContent = `\u274C **${registration.tool.name}** \u6267\u884C\u5931\u8D25 (${duration}ms)

`;
      chatContent += `**\u9519\u8BEF**: ${((_e = result.error) == null ? void 0 : _e.message) || "\u672A\u77E5\u9519\u8BEF"}`;
    }
    await this.sendAssistantMessage(chatContent);
    this.ctx.updateTaskStatus(
      "chat",
      result.success ? "success" : "error",
      result.success ? `${registration.tool.name} \u6267\u884C\u5B8C\u6210` : `${registration.tool.name} \u6267\u884C\u5931\u8D25`
    );
  }
  /**
   * 从聊天执行Agent（使用自主循环Agent）
   */
  async executeAgentFromChat(parseResult) {
    const task = parseResult.agentTask;
    await this.executeAutonomousAgentStreamingFromChat(task);
  }
  /**
   * 获取分类名称
   */
  getCategoryName(category) {
    const names = {
      file: "\u{1F4C1} \u6587\u4EF6\u64CD\u4F5C",
      code: "\u{1F4BB} \u4EE3\u7801\u76F8\u5173",
      api: "\u{1F310} API\u8C03\u7528",
      database: "\u{1F5C4}\uFE0F \u6570\u636E\u5E93",
      shell: "\u2328\uFE0F Shell\u547D\u4EE4",
      web: "\u{1F517} Web\u8BF7\u6C42",
      ai: "\u{1F916} AI\u670D\u52A1",
      utility: "\u{1F527} \u5DE5\u5177\u7C7B",
      custom: "\u{1F4E6} \u81EA\u5B9A\u4E49"
    };
    return names[category] || category;
  }
  /**
   * 获取Registry实例（供外部使用）
   */
  getRegistry() {
    return this.registry;
  }
  /**
   * 获取Executor实例（供外部使用）
   */
  getExecutor() {
    return this.executor;
  }
  /**
   * 获取Agent实例（供外部使用）
   */
  getAgent() {
    return this.agent;
  }
  /**
   * 获取自主Agent实例（供外部使用）
   */
  getAutonomousAgent() {
    return this.autonomousAgent;
  }
  // ============================================
  // 自主循环Agent处理
  // ============================================
  /**
   * 处理自主Agent请求
   */
  async handleAutonomousAgentRequest(request) {
    try {
      const result = await this.autonomousAgent.execute(request);
      this.ctx.postMessage({
        type: "mcp:autonomousAgentResult",
        result
      });
    } catch (error) {
      this.ctx.postMessage({
        type: "mcp:autonomousAgentError",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * [新增] 从聊天执行自主Agent - 流式输出版本
   * 输出格式：结构化步骤 + 折叠thinking + 清晰结果
   */
  async executeAutonomousAgentStreamingFromChat(task) {
    var _a, _b, _c, _d;
    if (!task) {
      await this.sendAssistantMessage("\u8BF7\u63D0\u4F9B\u4EFB\u52A1\u63CF\u8FF0\uFF0C\u4F8B\u5982: `@mcp:agent \u5E2E\u6211\u67E5\u627E\u6240\u6709TODO\u6CE8\u91CA`");
      return;
    }
    this.ctx.updateTaskStatus("mcp", "running", `Agent\u6267\u884C\u4E2D: ${task.slice(0, 30)}...`);
    const messageId = generateId();
    const initialMessage = {
      id: messageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
      metadata: {
        type: "agent_execution",
        task
      }
    };
    await this.ctx.sessionManager.addMessage(initialMessage);
    this.ctx.postMessage({ type: "addMessage", message: initialMessage, streaming: true });
    let accumulatedContent = "";
    let stepNumber = 0;
    const sendStreamUpdate = (chunk, isAppend = true) => {
      if (isAppend) {
        accumulatedContent += chunk;
      }
      this.ctx.postMessage({
        type: "updateMessage",
        messageId,
        content: accumulatedContent
      });
    };
    sendStreamUpdate(`\u{1F916} **Agent \u4EFB\u52A1**: ${task}

`);
    sendStreamUpdate(`---

`);
    const progressHandler = this.autonomousAgent.onProgress((progress) => {
      this.ctx.postMessage({
        type: "mcp:agentStreamUpdate",
        messageId,
        phase: "progress",
        progress: progress.progress,
        message: progress.message
      });
    });
    const thoughtHandler = this.autonomousAgent.onThought((thought) => {
      stepNumber++;
      sendStreamUpdate(`**\u6B65\u9AA4 ${stepNumber}** \u2014 `);
      if (thought.decision === "complete") {
        sendStreamUpdate(`\u2705 \u4EFB\u52A1\u5B8C\u6210

`);
      } else if (thought.decision === "clarify") {
        sendStreamUpdate(`\u2753 \u9700\u8981\u6F84\u6E05

`);
      } else {
        sendStreamUpdate(`\u6267\u884C\u4E2D

`);
      }
      sendStreamUpdate(`<details>
<summary>\u{1F4AD} \u601D\u8003\u8FC7\u7A0B</summary>

`);
      sendStreamUpdate(`${thought.analysis}

`);
      if (thought.toolCalls.length > 0) {
        sendStreamUpdate(`**\u8BA1\u5212**:
`);
        for (const call of thought.toolCalls) {
          sendStreamUpdate(`- \u{1F527} ${call.toolName} \u2014 ${call.reason}
`);
        }
      }
      sendStreamUpdate(`
</details>

`);
    });
    const toolExecutionHandler = this.autonomousAgent.onToolExecution(({ call, result }) => {
      if (!result) {
        sendStreamUpdate(`> \u26A1 **${call.toolName}** \u2014 ${call.reason}
`);
      } else {
        const status = result.success ? "\u2705" : "\u274C";
        const duration = result.duration ? ` (${result.duration}ms)` : "";
        if (result.success && result.data) {
          const dataStr = typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2);
          const truncated = dataStr.length > 300 ? dataStr.slice(0, 300) + "\n..." : dataStr;
          sendStreamUpdate(`> ${status} \u5B8C\u6210${duration}
>
> \`\`\`
> ${truncated.split("\n").join("\n> ")}
> \`\`\`

`);
        } else if (!result.success) {
          sendStreamUpdate(`> ${status} \u5931\u8D25${duration}: ${result.error}

`);
        } else {
          sendStreamUpdate(`> ${status} \u5B8C\u6210${duration}

`);
        }
      }
    });
    const iterationHandler = this.autonomousAgent.onIteration((iteration) => {
      sendStreamUpdate(`<details>
<summary>\u{1F441} \u7B2C${iteration.iteration}\u8F6E\u89C2\u5BDF</summary>

`);
      sendStreamUpdate(`${iteration.observation}

`);
      sendStreamUpdate(`</details>

`);
    });
    try {
      const result = await this.autonomousAgent.execute({
        task,
        context: {
          workspaceRoot: (_b = (_a = vscode19.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath,
          activeFile: (_c = vscode19.window.activeTextEditor) == null ? void 0 : _c.document.fileName,
          selectedCode: (_d = vscode19.window.activeTextEditor) == null ? void 0 : _d.document.getText(
            vscode19.window.activeTextEditor.selection
          )
        },
        config: {
          maxIterations: 10,
          maxParallelCalls: 5,
          timeout: 12e4
        }
      });
      sendStreamUpdate(`---

`);
      sendStreamUpdate(`## \u2705 \u7ED3\u679C

`);
      sendStreamUpdate(`${result.finalAnswer}

`);
      sendStreamUpdate(`<details>
<summary>\u{1F4CA} \u6267\u884C\u7EDF\u8BA1</summary>

`);
      sendStreamUpdate(`- \u8FED\u4EE3: ${result.stats.totalIterations} \u8F6E
`);
      sendStreamUpdate(`- \u5DE5\u5177\u8C03\u7528: ${result.stats.totalToolCalls} \u6B21 (\u6210\u529F ${result.stats.successfulCalls} / \u5931\u8D25 ${result.stats.failedCalls})
`);
      sendStreamUpdate(`- \u8017\u65F6: ${(result.totalDuration / 1e3).toFixed(1)}s
`);
      if (result.toolsUsed.length > 0) {
        sendStreamUpdate(`- \u4F7F\u7528\u5DE5\u5177: ${result.toolsUsed.join(", ")}
`);
      }
      sendStreamUpdate(`
</details>
`);
      initialMessage.content = accumulatedContent;
      initialMessage.isStreaming = false;
      await this.ctx.sessionManager.updateLastMessage(accumulatedContent, true);
      this.ctx.postMessage({
        type: "completeMessage",
        messageId,
        content: accumulatedContent
      });
      this.ctx.updateTaskStatus("mcp", "success", "Agent\u4EFB\u52A1\u5B8C\u6210");
    } catch (error) {
      sendStreamUpdate(`
---

`);
      sendStreamUpdate(`## \u274C \u6267\u884C\u5931\u8D25

`);
      sendStreamUpdate(`${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}
`);
      initialMessage.content = accumulatedContent;
      initialMessage.isStreaming = false;
      await this.ctx.sessionManager.updateLastMessage(accumulatedContent, true);
      this.ctx.postMessage({
        type: "completeMessage",
        messageId,
        content: accumulatedContent,
        error: true
      });
      this.ctx.updateTaskStatus("mcp", "error", error instanceof Error ? error.message : "\u6267\u884C\u5931\u8D25");
    } finally {
      progressHandler.dispose();
      thoughtHandler.dispose();
      toolExecutionHandler.dispose();
      iterationHandler.dispose();
    }
  }
};

// src/extension/chatview/ChatViewProvider.ts
init_mcp();

// src/extension/skills/package/SkillManager.ts
var vscode21 = __toESM(require("vscode"));
var path10 = __toESM(require("path"));
var fs9 = __toESM(require("fs"));

// src/extension/skills/package/SkillLoader.ts
var path8 = __toESM(require("path"));
var fs7 = __toESM(require("fs"));
var _SkillLoader = class _SkillLoader {
  static getInstance() {
    if (!_SkillLoader.instance) {
      _SkillLoader.instance = new _SkillLoader();
    }
    return _SkillLoader.instance;
  }
  /**
   * 从目录加载skill包
   */
  async loadFromDirectory(dirPath) {
    try {
      if (!fs7.existsSync(dirPath)) {
        return { success: false, error: `\u76EE\u5F55\u4E0D\u5B58\u5728: ${dirPath}` };
      }
      const manifestPath = path8.join(dirPath, "manifest.json");
      if (!fs7.existsSync(manifestPath)) {
        return { success: false, error: "manifest.json \u6587\u4EF6\u4E0D\u5B58\u5728" };
      }
      const manifestContent = fs7.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(manifestContent);
      const validation = this.validateManifest(manifest);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      const skillFilePath = path8.join(dirPath, manifest.skillFile || "SKILL.md");
      let markdown;
      if (fs7.existsSync(skillFilePath)) {
        const rawContent = fs7.readFileSync(skillFilePath, "utf-8");
        markdown = this.parseSkillMarkdown(rawContent);
      }
      return { success: true, manifest, markdown };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "\u52A0\u8F7D\u5931\u8D25"
      };
    }
  }
  /**
   * 从Git仓库克隆skill包
   */
  async loadFromGit(repoUrl, targetDir, branch) {
    try {
      if (!fs7.existsSync(targetDir)) {
        fs7.mkdirSync(targetDir, { recursive: true });
      }
      const { execSync: execSync2 } = require("child_process");
      const branchArg = branch ? `-b ${branch}` : "";
      execSync2(`git clone ${branchArg} --depth 1 "${repoUrl}" "${targetDir}"`, {
        stdio: "pipe",
        timeout: 12e4
      });
      return this.loadFromDirectory(targetDir);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "\u514B\u9686\u4ED3\u5E93\u5931\u8D25"
      };
    }
  }
  /**
   * 从URL下载skill包（zip格式）
   */
  async loadFromUrl(url, targetDir) {
    try {
      const https = require("https");
      const http = require("http");
      if (!fs7.existsSync(targetDir)) {
        fs7.mkdirSync(targetDir, { recursive: true });
      }
      const tempZipPath = path8.join(targetDir, "_temp_skill.zip");
      await new Promise((resolve2, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        const file = fs7.createWriteStream(tempZipPath);
        const request = protocol.get(url, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            file.close();
            fs7.unlinkSync(tempZipPath);
            this.loadFromUrl(response.headers.location, targetDir).then(() => resolve2()).catch(reject);
            return;
          }
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve2();
          });
        });
        request.on("error", (err) => {
          file.close();
          fs7.unlinkSync(tempZipPath);
          reject(err);
        });
        request.setTimeout(6e4, () => {
          request.destroy();
          reject(new Error("\u4E0B\u8F7D\u8D85\u65F6"));
        });
      });
      const AdmZip = require("adm-zip");
      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(targetDir, true);
      fs7.unlinkSync(tempZipPath);
      const manifestPath = this.findFile(targetDir, "manifest.json");
      if (!manifestPath) {
        return { success: false, error: "\u538B\u7F29\u5305\u4E2D\u672A\u627E\u5230 manifest.json" };
      }
      return this.loadFromDirectory(path8.dirname(manifestPath));
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "\u4E0B\u8F7D\u5931\u8D25"
      };
    }
  }
  /**
   * 验证清单文件
   */
  validateManifest(manifest) {
    if (!manifest.id) {
      return { valid: false, error: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5: id" };
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(manifest.id)) {
      return { valid: false, error: "id \u683C\u5F0F\u65E0\u6548\uFF0C\u5FC5\u987B\u4EE5\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\u548C\u8FDE\u5B57\u7B26" };
    }
    if (!manifest.name) {
      return { valid: false, error: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5: name" };
    }
    if (!manifest.version) {
      return { valid: false, error: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5: version" };
    }
    if (!manifest.description) {
      return { valid: false, error: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5: description" };
    }
    const validRuntimes = ["node", "python", "shell", "builtin"];
    if (manifest.runtime && !validRuntimes.includes(manifest.runtime)) {
      return { valid: false, error: `\u65E0\u6548\u7684\u8FD0\u884C\u65F6: ${manifest.runtime}` };
    }
    return { valid: true };
  }
  /**
   * 解析SKILL.md文件
   */
  parseSkillMarkdown(content) {
    var _a;
    const sections = {};
    const lines = content.split("\n");
    let currentSection = "description";
    let currentContent = [];
    let title = "";
    for (const line of lines) {
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match && !title) {
        title = h1Match[1].trim();
        continue;
      }
      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n").trim();
        }
        currentSection = this.normalizeSectionName(h2Match[1].trim());
        currentContent = [];
        continue;
      }
      currentContent.push(line);
    }
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n").trim();
    }
    const examples = [];
    const exampleContent = sections["examples"] || sections["usage"] || "";
    const codeBlocks = exampleContent.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      examples.push(...codeBlocks.map((b) => b.replace(/```\w*\n?/g, "").trim()));
    }
    return {
      title: title || "Untitled Skill",
      description: ((_a = sections["description"]) == null ? void 0 : _a.split("\n\n")[0]) || "",
      usage: sections["usage"] || sections["\u4F7F\u7528\u8BF4\u660E"],
      examples,
      aiPrompt: sections["ai-prompt"] || sections["prompt"] || sections["ai\u63D0\u793A\u8BCD"],
      configuration: sections["configuration"] || sections["config"] || sections["\u914D\u7F6E"],
      rawContent: content,
      sections
    };
  }
  /**
   * 规范化section名称
   */
  normalizeSectionName(name) {
    const mapping = {
      "\u63CF\u8FF0": "description",
      "\u4F7F\u7528\u8BF4\u660E": "usage",
      "\u7528\u6CD5": "usage",
      "\u793A\u4F8B": "examples",
      "\u4F8B\u5B50": "examples",
      "\u914D\u7F6E": "configuration",
      "ai\u63D0\u793A\u8BCD": "ai-prompt",
      "\u63D0\u793A\u8BCD": "ai-prompt"
    };
    const lower = name.toLowerCase();
    return mapping[lower] || lower.replace(/\s+/g, "-");
  }
  /**
   * 在目录中查找文件
   */
  findFile(dir, filename, maxDepth = 2) {
    const search = (currentDir, depth) => {
      if (depth > maxDepth)
        return null;
      const filePath = path8.join(currentDir, filename);
      if (fs7.existsSync(filePath)) {
        return filePath;
      }
      const entries = fs7.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          const found = search(path8.join(currentDir, entry.name), depth + 1);
          if (found)
            return found;
        }
      }
      return null;
    };
    return search(dir, 0);
  }
  /**
   * 列出skill目录中的脚本文件
   */
  listScripts(skillDir) {
    const scriptsDir = path8.join(skillDir, "scripts");
    if (!fs7.existsSync(scriptsDir))
      return [];
    const scripts = [];
    const entries = fs7.readdirSync(scriptsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path8.extname(entry.name).toLowerCase();
        if ([".js", ".ts", ".py", ".sh"].includes(ext)) {
          scripts.push(path8.join(scriptsDir, entry.name));
        }
      }
    }
    return scripts;
  }
  /**
   * 列出skill目录中的资源文件
   */
  listResources(skillDir) {
    const srcDir = path8.join(skillDir, "src");
    if (!fs7.existsSync(srcDir))
      return [];
    const resources = [];
    const scan = (dir) => {
      const entries = fs7.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path8.join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else {
          resources.push(fullPath);
        }
      }
    };
    scan(srcDir);
    return resources;
  }
};
_SkillLoader.instance = null;
var SkillLoader = _SkillLoader;

// src/extension/skills/package/SkillExecutor.ts
var vscode20 = __toESM(require("vscode"));
var path9 = __toESM(require("path"));
var fs8 = __toESM(require("fs"));
var import_child_process2 = require("child_process");

// src/extension/skills/package/SkillMCPBridge.ts
var SkillMCPBridgeImpl = class {
  constructor(skill, registry, executor) {
    this.registeredTools = /* @__PURE__ */ new Set();
    this.skill = skill;
    this.registry = registry;
    this.executor = executor;
  }
  /**
   * 调用MCP工具
   */
  async call(toolId, params) {
    const startTime = Date.now();
    try {
      const allowedTools = this.skill.manifest.mcpTools;
      if (allowedTools && !allowedTools.includes(toolId) && !allowedTools.includes("*")) {
        return {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: `Skill "${this.skill.manifest.name}" \u65E0\u6743\u8C03\u7528\u5DE5\u5177 "${toolId}"`
          },
          duration: Date.now() - startTime
        };
      }
      const tool = this.registry.getTool(toolId);
      if (!tool) {
        return {
          success: false,
          error: {
            code: "TOOL_NOT_FOUND",
            message: `\u5DE5\u5177 "${toolId}" \u4E0D\u5B58\u5728`
          },
          duration: Date.now() - startTime
        };
      }
      const result = await this.executor.execute({
        toolId,
        arguments: params,
        caller: "agent",
        // skill作为agent身份调用
        context: {
          sessionId: `skill_${this.skill.manifest.id}`
        }
      });
      return {
        success: result.success,
        data: result.data,
        error: result.error ? {
          code: result.error.code,
          message: result.error.message
        } : void 0,
        duration: result.stats.duration
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"
        },
        duration: Date.now() - startTime
      };
    }
  }
  /**
   * 获取可用工具列表
   */
  async listTools() {
    const allTools = this.registry.getAllTools();
    const allowedTools = this.skill.manifest.mcpTools;
    if (!allowedTools || allowedTools.includes("*")) {
      return allTools.filter((t2) => t2.enabled).map((t2) => t2.tool);
    }
    return allTools.filter((t2) => t2.enabled && allowedTools.includes(t2.tool.id)).map((t2) => t2.tool);
  }
  /**
   * 注册工具到MCP
   */
  async registerTool(tool) {
    try {
      const permissions = this.skill.manifest.permissions || [];
      if (!permissions.includes("mcp:register")) {
        return {
          success: false,
          error: `Skill "${this.skill.manifest.name}" \u6CA1\u6709\u6CE8\u518C\u5DE5\u5177\u7684\u6743\u9650`
        };
      }
      const prefixedTool = {
        ...tool,
        id: `skill_${this.skill.manifest.id}_${tool.id}`,
        description: `${tool.description} [\u6765\u81EA: ${this.skill.manifest.name}]`,
        metadata: {
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      };
      const result = await this.registry.registerTool(prefixedTool, "user");
      if (result.success) {
        this.registeredTools.add(prefixedTool.id);
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "\u6CE8\u518C\u5931\u8D25"
      };
    }
  }
  /**
   * 注销工具
   */
  async unregisterTool(toolId) {
    try {
      const prefixedId = toolId.startsWith("skill_") ? toolId : `skill_${this.skill.manifest.id}_${toolId}`;
      if (!this.registeredTools.has(prefixedId)) {
        return {
          success: false,
          error: `\u5DE5\u5177 "${toolId}" \u4E0D\u662F\u7531\u6B64skill\u6CE8\u518C\u7684`
        };
      }
      const result = await this.registry.deleteTool(prefixedId);
      if (result.success) {
        this.registeredTools.delete(prefixedId);
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "\u6CE8\u9500\u5931\u8D25"
      };
    }
  }
  /**
   * 注册skill清单中定义的所有工具
   */
  async registerProvidedTools() {
    const registered = [];
    const errors = [];
    const providedTools = this.skill.manifest.providedTools;
    if (!providedTools || providedTools.length === 0) {
      return { success: true, registered, errors };
    }
    for (const tool of providedTools) {
      const result = await this.registerTool(tool);
      if (result.success) {
        registered.push(tool.id);
      } else {
        errors.push(`${tool.id}: ${result.error}`);
      }
    }
    return {
      success: errors.length === 0,
      registered,
      errors
    };
  }
  /**
   * 注销所有由此skill注册的工具
   */
  async unregisterAllTools() {
    for (const toolId of this.registeredTools) {
      await this.registry.deleteTool(toolId);
    }
    this.registeredTools.clear();
  }
  /**
   * 获取此skill注册的工具列表
   */
  getRegisteredTools() {
    return Array.from(this.registeredTools);
  }
};
var _SkillMCPBridgeFactory = class _SkillMCPBridgeFactory {
  constructor() {
    this.registry = null;
    this.executor = null;
    this.bridges = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!_SkillMCPBridgeFactory.instance) {
      _SkillMCPBridgeFactory.instance = new _SkillMCPBridgeFactory();
    }
    return _SkillMCPBridgeFactory.instance;
  }
  /**
   * 初始化工厂
   */
  initialize(registry, executor) {
    this.registry = registry;
    this.executor = executor;
  }
  /**
   * 为skill创建桥接
   */
  createBridge(skill) {
    if (!this.registry || !this.executor) {
      throw new Error("SkillMCPBridgeFactory \u672A\u521D\u59CB\u5316");
    }
    const existing = this.bridges.get(skill.manifest.id);
    if (existing) {
      return existing;
    }
    const bridge = new SkillMCPBridgeImpl(skill, this.registry, this.executor);
    this.bridges.set(skill.manifest.id, bridge);
    return bridge;
  }
  /**
   * 获取skill的桥接
   */
  getBridge(skillId) {
    return this.bridges.get(skillId);
  }
  /**
   * 移除skill的桥接并注销其工具
   */
  async removeBridge(skillId) {
    const bridge = this.bridges.get(skillId);
    if (bridge) {
      await bridge.unregisterAllTools();
      this.bridges.delete(skillId);
    }
  }
};
_SkillMCPBridgeFactory.instance = null;
var SkillMCPBridgeFactory = _SkillMCPBridgeFactory;

// src/extension/skills/package/SkillExecutor.ts
var _SkillExecutor = class _SkillExecutor {
  constructor(context) {
    this.runningProcesses = /* @__PURE__ */ new Map();
    this.context = context;
    this.bridgeFactory = SkillMCPBridgeFactory.getInstance();
  }
  static getInstance(context) {
    if (!_SkillExecutor.instance) {
      _SkillExecutor.instance = new _SkillExecutor(context);
    }
    return _SkillExecutor.instance;
  }
  /**
   * 执行skill
   */
  async execute(skill, params, workspaceContext) {
    var _a, _b, _c;
    const startTime = Date.now();
    const logs = [];
    const mcpCalls = [];
    const log = (message, level = "info") => {
      logs.push({ level, message, timestamp: Date.now() });
      console.log(`[Skill:${skill.manifest.id}] [${level}] ${message}`);
    };
    try {
      log(`\u5F00\u59CB\u6267\u884Cskill: ${skill.manifest.name}`);
      const bridge = this.bridgeFactory.createBridge(skill);
      const wrappedBridge = {
        call: async (toolId, toolParams) => {
          const result = await bridge.call(toolId, toolParams);
          mcpCalls.push({ toolId, params: toolParams, result });
          return result;
        },
        listTools: () => bridge.listTools(),
        registerTool: (tool) => bridge.registerTool(tool),
        unregisterTool: (toolId) => bridge.unregisterTool(toolId)
      };
      const execContext = {
        skill,
        workspaceRoot: (workspaceContext == null ? void 0 : workspaceContext.workspaceRoot) || ((_b = (_a = vscode20.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath),
        activeFile: (workspaceContext == null ? void 0 : workspaceContext.activeFile) || ((_c = vscode20.window.activeTextEditor) == null ? void 0 : _c.document.fileName),
        selectedCode: workspaceContext == null ? void 0 : workspaceContext.selectedCode,
        params,
        mcp: wrappedBridge,
        log,
        progress: (percent, message) => {
          log(`\u8FDB\u5EA6: ${percent}%${message ? ` - ${message}` : ""}`, "info");
        }
      };
      const runtime = skill.manifest.runtime || "node";
      let output;
      switch (runtime) {
        case "node":
          output = await this.executeNode(skill, execContext);
          break;
        case "python":
          output = await this.executePython(skill, execContext);
          break;
        case "shell":
          output = await this.executeShell(skill, execContext);
          break;
        case "builtin":
          output = await this.executeBuiltin(skill, execContext);
          break;
        default:
          throw new Error(`\u4E0D\u652F\u6301\u7684\u8FD0\u884C\u65F6: ${runtime}`);
      }
      log("\u6267\u884C\u5B8C\u6210");
      return {
        success: true,
        output,
        logs,
        mcpCalls,
        duration: Date.now() - startTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
      log(`\u6267\u884C\u5931\u8D25: ${errorMessage}`, "error");
      return {
        success: false,
        error: errorMessage,
        logs,
        mcpCalls,
        duration: Date.now() - startTime
      };
    }
  }
  /**
   * 执行Node.js脚本
   */
  async executeNode(skill, context) {
    const mainScript = skill.manifest.main || "scripts/main.js";
    const scriptPath = path9.join(skill.installPath, mainScript);
    if (!fs8.existsSync(scriptPath)) {
      throw new Error(`\u4E3B\u811A\u672C\u4E0D\u5B58\u5728: ${scriptPath}`);
    }
    if (scriptPath.endsWith(".ts")) {
      return this.executeTypeScript(skill, context, scriptPath);
    }
    const vm = require("vm");
    const scriptContent = fs8.readFileSync(scriptPath, "utf-8");
    const sandbox = this.createSandbox(context);
    const script = new vm.Script(`
      (async function(context) {
        ${scriptContent}
        if (typeof execute === 'function') {
          return await execute(context);
        } else if (typeof main === 'function') {
          return await main(context);
        } else if (typeof module !== 'undefined' && module.exports) {
          const exp = module.exports;
          if (typeof exp === 'function') return await exp(context);
          if (typeof exp.execute === 'function') return await exp.execute(context);
          if (typeof exp.default === 'function') return await exp.default(context);
        }
        throw new Error('\u672A\u627E\u5230\u53EF\u6267\u884C\u7684\u51FD\u6570 (execute, main, \u6216 module.exports)');
      })
    `);
    const execute = script.runInNewContext(sandbox);
    return execute(context);
  }
  /**
   * 执行TypeScript脚本
   */
  async executeTypeScript(skill, context, scriptPath) {
    var _a;
    const jsPath = scriptPath.replace(/\.ts$/, ".js");
    if (!fs8.existsSync(jsPath) || fs8.statSync(scriptPath).mtime > fs8.statSync(jsPath).mtime) {
      try {
        (0, import_child_process2.execSync)(`npx tsc "${scriptPath}" --outDir "${path9.dirname(jsPath)}"`, {
          cwd: skill.installPath,
          stdio: "pipe"
        });
      } catch (error) {
        throw new Error(`TypeScript\u7F16\u8BD1\u5931\u8D25: ${error}`);
      }
    }
    const updatedSkill = {
      ...skill,
      manifest: {
        ...skill.manifest,
        main: (_a = skill.manifest.main) == null ? void 0 : _a.replace(/\.ts$/, ".js")
      }
    };
    return this.executeNode(updatedSkill, context);
  }
  /**
   * 执行Python脚本
   */
  async executePython(skill, context) {
    const mainScript = skill.manifest.main || "scripts/main.py";
    const scriptPath = path9.join(skill.installPath, mainScript);
    if (!fs8.existsSync(scriptPath)) {
      throw new Error(`\u4E3B\u811A\u672C\u4E0D\u5B58\u5728: ${scriptPath}`);
    }
    return new Promise((resolve2, reject) => {
      const contextJson = JSON.stringify({
        workspaceRoot: context.workspaceRoot,
        activeFile: context.activeFile,
        selectedCode: context.selectedCode,
        params: context.params,
        skillId: skill.manifest.id
      });
      const python = (0, import_child_process2.spawn)("python", [scriptPath], {
        cwd: skill.installPath,
        env: {
          ...process.env,
          SKILL_CONTEXT: contextJson,
          PYTHONPATH: skill.installPath
        }
      });
      this.runningProcesses.set(skill.manifest.id, python);
      let stdout = "";
      let stderr = "";
      python.stdout.on("data", (data) => {
        stdout += data.toString();
        context.log(data.toString().trim(), "info");
      });
      python.stderr.on("data", (data) => {
        stderr += data.toString();
        context.log(data.toString().trim(), "error");
      });
      python.on("close", (code) => {
        this.runningProcesses.delete(skill.manifest.id);
        if (code === 0) {
          try {
            const lastLine = stdout.trim().split("\n").pop() || "";
            resolve2(JSON.parse(lastLine));
          } catch {
            resolve2(stdout);
          }
        } else {
          reject(new Error(`Python\u811A\u672C\u9000\u51FA\u7801 ${code}: ${stderr}`));
        }
      });
      python.on("error", (error) => {
        this.runningProcesses.delete(skill.manifest.id);
        reject(error);
      });
    });
  }
  /**
   * 执行Shell脚本
   */
  async executeShell(skill, context) {
    const mainScript = skill.manifest.main || "scripts/main.sh";
    const scriptPath = path9.join(skill.installPath, mainScript);
    if (!fs8.existsSync(scriptPath)) {
      throw new Error(`\u4E3B\u811A\u672C\u4E0D\u5B58\u5728: ${scriptPath}`);
    }
    return new Promise((resolve2, reject) => {
      const shell = process.platform === "win32" ? "powershell.exe" : "bash";
      const args = process.platform === "win32" ? ["-File", scriptPath] : [scriptPath];
      const proc = (0, import_child_process2.spawn)(shell, args, {
        cwd: skill.installPath,
        env: {
          ...process.env,
          WORKSPACE_ROOT: context.workspaceRoot || "",
          ACTIVE_FILE: context.activeFile || "",
          SELECTED_CODE: context.selectedCode || "",
          SKILL_ID: skill.manifest.id,
          SKILL_PARAMS: JSON.stringify(context.params || {})
        }
      });
      this.runningProcesses.set(skill.manifest.id, proc);
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
        context.log(data.toString().trim(), "info");
      });
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
        context.log(data.toString().trim(), "error");
      });
      proc.on("close", (code) => {
        this.runningProcesses.delete(skill.manifest.id);
        if (code === 0) {
          resolve2(stdout);
        } else {
          reject(new Error(`Shell\u811A\u672C\u9000\u51FA\u7801 ${code}: ${stderr}`));
        }
      });
      proc.on("error", (error) => {
        this.runningProcesses.delete(skill.manifest.id);
        reject(error);
      });
    });
  }
  /**
   * 执行内置skill
   */
  async executeBuiltin(skill, context) {
    const mainScript = skill.manifest.main || "scripts/main.js";
    const scriptPath = path9.join(skill.installPath, mainScript);
    if (!fs8.existsSync(scriptPath)) {
      throw new Error(`\u4E3B\u811A\u672C\u4E0D\u5B58\u5728: ${scriptPath}`);
    }
    const module2 = require(scriptPath);
    if (typeof module2.execute === "function") {
      return module2.execute(context);
    } else if (typeof module2.default === "function") {
      return module2.default(context);
    } else if (typeof module2 === "function") {
      return module2(context);
    }
    throw new Error("\u672A\u627E\u5230\u53EF\u6267\u884C\u51FD\u6570");
  }
  /**
   * 创建沙箱环境
   */
  createSandbox(context) {
    return {
      console: {
        log: (...args) => context.log(args.join(" "), "info"),
        warn: (...args) => context.log(args.join(" "), "warn"),
        error: (...args) => context.log(args.join(" "), "error"),
        info: (...args) => context.log(args.join(" "), "info")
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Promise,
      Buffer,
      JSON,
      Math,
      Date,
      RegExp,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Map,
      Set,
      Error,
      URL,
      module: { exports: {} },
      exports: {},
      require: this.createSafeRequire(context.skill.installPath)
    };
  }
  /**
   * 创建安全的require函数
   */
  createSafeRequire(skillPath) {
    const allowedModules = ["path", "fs", "url", "util", "crypto", "zlib"];
    return (moduleName) => {
      if (allowedModules.includes(moduleName)) {
        return require(moduleName);
      }
      if (moduleName.startsWith("./") || moduleName.startsWith("../")) {
        const resolvedPath = path9.resolve(skillPath, moduleName);
        if (resolvedPath.startsWith(skillPath)) {
          return require(resolvedPath);
        }
      }
      const nodeModulesPath = path9.join(skillPath, "node_modules", moduleName);
      if (fs8.existsSync(nodeModulesPath)) {
        return require(nodeModulesPath);
      }
      throw new Error(`\u4E0D\u5141\u8BB8\u52A0\u8F7D\u6A21\u5757: ${moduleName}`);
    };
  }
  /**
   * 取消skill执行
   */
  cancel(skillId) {
    const proc = this.runningProcesses.get(skillId);
    if (proc) {
      proc.kill("SIGTERM");
      this.runningProcesses.delete(skillId);
      return true;
    }
    return false;
  }
  /**
   * 检查skill是否正在执行
   */
  isRunning(skillId) {
    return this.runningProcesses.has(skillId);
  }
};
_SkillExecutor.instance = null;
var SkillExecutor = _SkillExecutor;

// src/extension/skills/package/SkillManager.ts
var STORAGE_KEY3 = "aiAssistant.skills";
var SKILLS_DIR = "skills";
var _SkillManager = class _SkillManager {
  constructor(context, registry, executor) {
    this.skills = /* @__PURE__ */ new Map();
    // 事件
    this._onSkillInstalled = new vscode21.EventEmitter();
    this._onSkillUninstalled = new vscode21.EventEmitter();
    this._onSkillStatusChanged = new vscode21.EventEmitter();
    this.onSkillInstalled = this._onSkillInstalled.event;
    this.onSkillUninstalled = this._onSkillUninstalled.event;
    this.onSkillStatusChanged = this._onSkillStatusChanged.event;
    this.context = context;
    this.loader = SkillLoader.getInstance();
    this.executor = SkillExecutor.getInstance(context);
    this.bridgeFactory = SkillMCPBridgeFactory.getInstance();
    this.bridgeFactory.initialize(registry, executor);
    this.skillsDir = path10.join(context.globalStorageUri.fsPath, SKILLS_DIR);
    if (!fs9.existsSync(this.skillsDir)) {
      fs9.mkdirSync(this.skillsDir, { recursive: true });
    }
  }
  static getInstance(context, registry, executor) {
    if (!_SkillManager.instance) {
      if (!registry || !executor) {
        throw new Error("SkillManager\u9996\u6B21\u521D\u59CB\u5316\u9700\u8981\u63D0\u4F9BMCPRegistry\u548CMCPExecutor");
      }
      _SkillManager.instance = new _SkillManager(context, registry, executor);
    }
    return _SkillManager.instance;
  }
  /**
   * 初始化：加载内置skill包 + 已安装的skill包
   */
  async initialize() {
    await this.loadBuiltinSkills();
    await this.loadInstalledSkills();
    console.log(`[SkillManager] \u521D\u59CB\u5316\u5B8C\u6210: ${this.skills.size} \u4E2Askill`);
  }
  /**
   * 加载内置skill包（从扩展dist/resources/builtin-packages目录）
   */
  async loadBuiltinSkills() {
    const builtinDir = path10.join(this.context.extensionPath, "dist", "resources", "builtin-packages");
    if (!fs9.existsSync(builtinDir)) {
      console.log("[SkillManager] \u5185\u7F6Eskill\u5305\u76EE\u5F55\u4E0D\u5B58\u5728:", builtinDir);
      const devDir = path10.join(this.context.extensionPath, "src", "extension", "skills", "builtin-packages");
      if (fs9.existsSync(devDir)) {
        console.log("[SkillManager] \u4F7F\u7528\u5F00\u53D1\u6A21\u5F0F\u8DEF\u5F84:", devDir);
        return this._loadBuiltinFromDir(devDir);
      }
      return;
    }
    return this._loadBuiltinFromDir(builtinDir);
  }
  async _loadBuiltinFromDir(builtinDir) {
    const entries = fs9.readdirSync(builtinDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory())
        continue;
      const skillDir = path10.join(builtinDir, entry.name);
      const manifestPath = path10.join(skillDir, "manifest.json");
      if (!fs9.existsSync(manifestPath))
        continue;
      try {
        const loadResult = await this.loader.loadFromDirectory(skillDir);
        if (!loadResult.success || !loadResult.manifest)
          continue;
        const manifest = loadResult.manifest;
        if (this.skills.has(manifest.id))
          continue;
        const skill = {
          manifest,
          installPath: skillDir,
          installedAt: 0,
          // 内置标记
          status: "active",
          source: { type: "local", localPath: skillDir }
        };
        this.skills.set(manifest.id, skill);
      } catch (err) {
        console.error(`[SkillManager] \u52A0\u8F7D\u5185\u7F6Eskill\u5931\u8D25 ${entry.name}:`, err);
      }
    }
  }
  /**
   * 加载已安装的skills（从globalState）
   */
  async loadInstalledSkills() {
    const saved = this.context.globalState.get(STORAGE_KEY3) || [];
    for (const skill of saved) {
      if (!fs9.existsSync(skill.installPath))
        continue;
      this.skills.set(skill.manifest.id, skill);
      if (skill.status === "active") {
        try {
          await this.initializeSkill(skill);
        } catch (err) {
          console.error(`\u521D\u59CB\u5316skill\u5931\u8D25 ${skill.manifest.id}:`, err);
          this.updateStatus(skill.manifest.id, "error", String(err));
        }
      }
    }
  }
  async saveSkills() {
    const userSkills = Array.from(this.skills.values()).filter((s) => s.installedAt > 0);
    await this.context.globalState.update(STORAGE_KEY3, userSkills);
  }
  // ========== 安装方法 ==========
  async installFromLocal(localPath, options = {}) {
    try {
      const loadResult = await this.loader.loadFromDirectory(localPath);
      if (!loadResult.success || !loadResult.manifest) {
        return { success: false, error: loadResult.error || "\u52A0\u8F7D\u5931\u8D25" };
      }
      const manifest = loadResult.manifest;
      if (this.skills.has(manifest.id) && !options.overwrite) {
        return { success: false, error: `Skill "${manifest.id}" \u5DF2\u5B89\u88C5` };
      }
      const targetDir = path10.join(this.skillsDir, manifest.id);
      await this.copyDirectory(localPath, targetDir);
      const skill = {
        manifest,
        installPath: targetDir,
        installedAt: Date.now(),
        status: options.autoEnable !== false ? "active" : "installed",
        userConfig: options.config || {},
        source: { type: "local", localPath }
      };
      this.skills.set(manifest.id, skill);
      await this.saveSkills();
      if (skill.status === "active") {
        await this.initializeSkill(skill);
      }
      this._onSkillInstalled.fire(skill);
      return { success: true, skill };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  async installFromGit(repoUrl, options = {}) {
    const tempDir = path10.join(this.skillsDir, ".temp_" + Date.now());
    try {
      fs9.mkdirSync(tempDir, { recursive: true });
      const loadResult = await this.loader.loadFromGit(repoUrl, tempDir, options.branch);
      if (!loadResult.success || !loadResult.manifest) {
        return { success: false, error: loadResult.error || "\u514B\u9686\u5931\u8D25" };
      }
      const manifest = loadResult.manifest;
      if (this.skills.has(manifest.id) && !options.overwrite) {
        return { success: false, error: `Skill "${manifest.id}" \u5DF2\u5B89\u88C5` };
      }
      const targetDir = path10.join(this.skillsDir, manifest.id);
      if (fs9.existsSync(targetDir)) {
        fs9.rmSync(targetDir, { recursive: true });
      }
      fs9.renameSync(tempDir, targetDir);
      const skill = {
        manifest,
        installPath: targetDir,
        installedAt: Date.now(),
        status: options.autoEnable !== false ? "active" : "installed",
        userConfig: options.config || {},
        source: { type: "git", url: repoUrl, branch: options.branch }
      };
      this.skills.set(manifest.id, skill);
      await this.saveSkills();
      if (skill.status === "active") {
        await this.initializeSkill(skill);
      }
      this._onSkillInstalled.fire(skill);
      return { success: true, skill };
    } catch (error) {
      return { success: false, error: String(error) };
    } finally {
      if (fs9.existsSync(tempDir)) {
        fs9.rmSync(tempDir, { recursive: true });
      }
    }
  }
  async installFromUrl(url, options = {}) {
    const tempDir = path10.join(this.skillsDir, ".temp_" + Date.now());
    try {
      fs9.mkdirSync(tempDir, { recursive: true });
      const loadResult = await this.loader.loadFromUrl(url, tempDir);
      if (!loadResult.success || !loadResult.manifest) {
        return { success: false, error: loadResult.error || "\u4E0B\u8F7D\u5931\u8D25" };
      }
      const manifest = loadResult.manifest;
      if (this.skills.has(manifest.id) && !options.overwrite) {
        return { success: false, error: `Skill "${manifest.id}" \u5DF2\u5B89\u88C5` };
      }
      const manifestPath = this.findFile(tempDir, "manifest.json");
      const skillSourceDir = manifestPath ? path10.dirname(manifestPath) : tempDir;
      const targetDir = path10.join(this.skillsDir, manifest.id);
      if (fs9.existsSync(targetDir)) {
        fs9.rmSync(targetDir, { recursive: true });
      }
      await this.copyDirectory(skillSourceDir, targetDir);
      const skill = {
        manifest,
        installPath: targetDir,
        installedAt: Date.now(),
        status: options.autoEnable !== false ? "active" : "installed",
        userConfig: options.config || {},
        source: { type: "url", url }
      };
      this.skills.set(manifest.id, skill);
      await this.saveSkills();
      if (skill.status === "active") {
        await this.initializeSkill(skill);
      }
      this._onSkillInstalled.fire(skill);
      return { success: true, skill };
    } catch (error) {
      return { success: false, error: String(error) };
    } finally {
      if (fs9.existsSync(tempDir)) {
        fs9.rmSync(tempDir, { recursive: true });
      }
    }
  }
  // ========== 管理方法 ==========
  async uninstall(skillId) {
    try {
      const skill = this.skills.get(skillId);
      if (!skill) {
        return { success: false, error: `Skill "${skillId}" \u672A\u627E\u5230` };
      }
      if (skill.installedAt === 0) {
        return { success: false, error: `\u5185\u7F6ESkill "${skillId}" \u4E0D\u80FD\u5378\u8F7D\uFF0C\u53EA\u80FD\u7981\u7528` };
      }
      await this.bridgeFactory.removeBridge(skillId);
      this.executor.cancel(skillId);
      if (fs9.existsSync(skill.installPath)) {
        fs9.rmSync(skill.installPath, { recursive: true });
      }
      this.skills.delete(skillId);
      await this.saveSkills();
      this._onSkillUninstalled.fire(skillId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  async enable(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill)
      return { success: false, error: `Skill "${skillId}" \u672A\u627E\u5230` };
    try {
      await this.initializeSkill(skill);
      await this.updateStatus(skillId, "active");
      return { success: true };
    } catch (error) {
      await this.updateStatus(skillId, "error", String(error));
      return { success: false, error: String(error) };
    }
  }
  async disable(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill)
      return { success: false, error: `Skill "${skillId}" \u672A\u627E\u5230` };
    try {
      await this.bridgeFactory.removeBridge(skillId);
      this.executor.cancel(skillId);
      await this.updateStatus(skillId, "disabled");
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  async execute(skillId, params) {
    const skill = this.skills.get(skillId);
    if (!skill)
      return { success: false, error: `Skill "${skillId}" \u672A\u627E\u5230`, duration: 0 };
    if (skill.status !== "active")
      return { success: false, error: `Skill "${skillId}" \u672A\u6FC0\u6D3B`, duration: 0 };
    return this.executor.execute(skill, params);
  }
  async update(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill)
      return { success: false, error: `Skill "${skillId}" \u672A\u627E\u5230` };
    const source = skill.source;
    switch (source.type) {
      case "git":
        return this.installFromGit(source.url, { branch: source.branch, overwrite: true, config: skill.userConfig });
      case "url":
        return this.installFromUrl(source.url, { overwrite: true, config: skill.userConfig });
      case "local":
        return this.installFromLocal(source.localPath, { overwrite: true, config: skill.userConfig });
      default:
        return { success: false, error: "\u4E0D\u652F\u6301\u7684\u6765\u6E90\u7C7B\u578B" };
    }
  }
  // ========== 查询方法 ==========
  getInstalledSkills() {
    return Array.from(this.skills.values());
  }
  getActiveSkills() {
    return Array.from(this.skills.values()).filter((s) => s.status === "active");
  }
  getSkill(skillId) {
    return this.skills.get(skillId);
  }
  async getSkillMarkdown(skillId) {
    const skill = this.skills.get(skillId);
    if (!skill)
      return null;
    const loadResult = await this.loader.loadFromDirectory(skill.installPath);
    return loadResult.markdown || null;
  }
  async updateConfig(skillId, config) {
    const skill = this.skills.get(skillId);
    if (!skill)
      return { success: false };
    skill.userConfig = { ...skill.userConfig, ...config };
    skill.updatedAt = Date.now();
    await this.saveSkills();
    return { success: true };
  }
  // ========== 管理UI命令 ==========
  /**
   * 注册VSCode命令（在extension.ts中调用）
   */
  registerCommands(context) {
    context.subscriptions.push(
      vscode21.commands.registerCommand("aiAssistant.skill.install", () => this.showInstallDialog()),
      vscode21.commands.registerCommand("aiAssistant.skill.manage", () => this.showManageDialog()),
      vscode21.commands.registerCommand("aiAssistant.skill.create", () => this.showCreateDialog())
    );
  }
  /**
   * Skill安装对话框
   */
  async showInstallDialog() {
    const source = await vscode21.window.showQuickPick(
      [
        { label: "\u{1F4C1} \u4ECE\u672C\u5730\u76EE\u5F55\u5B89\u88C5", description: "\u9009\u62E9\u5305\u542Bmanifest.json\u7684\u76EE\u5F55", value: "local" },
        { label: "\u{1F517} \u4ECEGit\u4ED3\u5E93\u5B89\u88C5", description: "\u8F93\u5165git clone\u5730\u5740", value: "git" },
        { label: "\u{1F4E6} \u4ECEURL\u4E0B\u8F7D\u5B89\u88C5", description: "\u8F93\u5165skill\u5305zip\u4E0B\u8F7D\u94FE\u63A5", value: "url" }
      ],
      { placeHolder: "\u9009\u62E9\u5B89\u88C5\u6765\u6E90" }
    );
    if (!source)
      return;
    switch (source.value) {
      case "local": {
        const uris = await vscode21.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          openLabel: "\u9009\u62E9Skill\u76EE\u5F55"
        });
        if (uris == null ? void 0 : uris[0]) {
          const result = await this.installFromLocal(uris[0].fsPath);
          this.showInstallResult(result);
        }
        break;
      }
      case "git": {
        const url = await vscode21.window.showInputBox({
          prompt: "\u8F93\u5165Git\u4ED3\u5E93\u5730\u5740",
          placeHolder: "https://github.com/user/skill-package.git"
        });
        if (url) {
          const result = await this.installFromGit(url);
          this.showInstallResult(result);
        }
        break;
      }
      case "url": {
        const url = await vscode21.window.showInputBox({
          prompt: "\u8F93\u5165Skill\u5305\u4E0B\u8F7D\u94FE\u63A5 (zip)",
          placeHolder: "https://example.com/skill-package.zip"
        });
        if (url) {
          const result = await this.installFromUrl(url);
          this.showInstallResult(result);
        }
        break;
      }
    }
  }
  /**
   * Skill管理对话框
   */
  async showManageDialog() {
    const skills = this.getInstalledSkills();
    if (skills.length === 0) {
      vscode21.window.showInformationMessage("\u6CA1\u6709\u5DF2\u5B89\u88C5\u7684skill");
      return;
    }
    const items = skills.map((s) => ({
      label: `${s.status === "active" ? "\u2705" : s.status === "disabled" ? "\u23F8\uFE0F" : "\u274C"} ${s.manifest.name}`,
      description: `v${s.manifest.version} - ${s.manifest.description}`,
      detail: `ID: ${s.manifest.id} | \u6765\u6E90: ${s.source.type}${s.installedAt === 0 ? " (\u5185\u7F6E)" : ""}`,
      skill: s
    }));
    const selected = await vscode21.window.showQuickPick(items, {
      placeHolder: "\u9009\u62E9\u8981\u7BA1\u7406\u7684skill"
    });
    if (!selected)
      return;
    const actions = [
      { label: selected.skill.status === "active" ? "\u23F8\uFE0F \u7981\u7528" : "\u25B6\uFE0F \u542F\u7528", value: "toggle" },
      { label: "\u{1F504} \u66F4\u65B0", value: "update" },
      { label: "\u2139\uFE0F \u67E5\u770B\u8BE6\u60C5", value: "info" }
    ];
    if (selected.skill.installedAt > 0) {
      actions.push({ label: "\u{1F5D1}\uFE0F \u5378\u8F7D", value: "uninstall" });
    }
    const action = await vscode21.window.showQuickPick(actions, {
      placeHolder: `\u7BA1\u7406 ${selected.skill.manifest.name}`
    });
    if (!action)
      return;
    switch (action.value) {
      case "toggle":
        if (selected.skill.status === "active") {
          await this.disable(selected.skill.manifest.id);
          vscode21.window.showInformationMessage(`\u5DF2\u7981\u7528 ${selected.skill.manifest.name}`);
        } else {
          await this.enable(selected.skill.manifest.id);
          vscode21.window.showInformationMessage(`\u5DF2\u542F\u7528 ${selected.skill.manifest.name}`);
        }
        break;
      case "update":
        const result = await this.update(selected.skill.manifest.id);
        if (result.success) {
          vscode21.window.showInformationMessage(`\u5DF2\u66F4\u65B0 ${selected.skill.manifest.name}`);
        } else {
          vscode21.window.showErrorMessage(`\u66F4\u65B0\u5931\u8D25: ${result.error}`);
        }
        break;
      case "info":
        const md = await this.getSkillMarkdown(selected.skill.manifest.id);
        if (md) {
          const doc = await vscode21.workspace.openTextDocument({ content: md.rawContent, language: "markdown" });
          await vscode21.window.showTextDocument(doc, { preview: true });
        }
        break;
      case "uninstall":
        const confirm = await vscode21.window.showWarningMessage(
          `\u786E\u5B9A\u8981\u5378\u8F7D ${selected.skill.manifest.name}?`,
          { modal: true },
          "\u786E\u8BA4\u5378\u8F7D"
        );
        if (confirm === "\u786E\u8BA4\u5378\u8F7D") {
          await this.uninstall(selected.skill.manifest.id);
          vscode21.window.showInformationMessage(`\u5DF2\u5378\u8F7D ${selected.skill.manifest.name}`);
        }
        break;
    }
  }
  /**
   * 创建新skill对话框
   */
  async showCreateDialog() {
    const name = await vscode21.window.showInputBox({
      prompt: "Skill\u540D\u79F0",
      placeHolder: "my-custom-skill",
      validateInput: (v) => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(v) ? null : "ID\u5FC5\u987B\u4EE5\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u6570\u5B57\u4E0B\u5212\u7EBF\u8FDE\u5B57\u7B26"
    });
    if (!name)
      return;
    const uris = await vscode21.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: "\u9009\u62E9\u521B\u5EFA\u4F4D\u7F6E"
    });
    if (!(uris == null ? void 0 : uris[0]))
      return;
    const targetDir = path10.join(uris[0].fsPath, name);
    let templateDir = path10.join(this.context.extensionPath, "dist", "resources", "templates", "example-skill");
    if (!fs9.existsSync(templateDir)) {
      templateDir = path10.join(this.context.extensionPath, "src", "extension", "skills", "templates", "example-skill");
    }
    try {
      await this.copyDirectory(templateDir, targetDir);
      const manifestPath = path10.join(targetDir, "manifest.json");
      const manifest = JSON.parse(fs9.readFileSync(manifestPath, "utf-8"));
      manifest.id = name;
      manifest.name = name;
      manifest.description = `\u81EA\u5B9A\u4E49skill: ${name}`;
      fs9.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      const doc = await vscode21.workspace.openTextDocument(manifestPath);
      await vscode21.window.showTextDocument(doc);
      vscode21.window.showInformationMessage(
        `Skill "${name}" \u5DF2\u521B\u5EFA\u5728 ${targetDir}`,
        "\u5B89\u88C5\u5230\u63D2\u4EF6"
      ).then(async (choice) => {
        if (choice === "\u5B89\u88C5\u5230\u63D2\u4EF6") {
          const result = await this.installFromLocal(targetDir);
          this.showInstallResult(result);
        }
      });
    } catch (error) {
      vscode21.window.showErrorMessage(`\u521B\u5EFA\u5931\u8D25: ${error}`);
    }
  }
  showInstallResult(result) {
    if (result.success) {
      vscode21.window.showInformationMessage(`\u2705 Skill "${result.skill.manifest.name}" \u5B89\u88C5\u6210\u529F`);
    } else {
      vscode21.window.showErrorMessage(`\u274C \u5B89\u88C5\u5931\u8D25: ${result.error}`);
    }
  }
  // ========== 内部方法 ==========
  async initializeSkill(skill) {
    const bridge = this.bridgeFactory.createBridge(skill);
    await bridge.registerProvidedTools();
    console.log(`[SkillManager] \u521D\u59CB\u5316skill: ${skill.manifest.id}`);
  }
  async updateStatus(skillId, status, error) {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.status = status;
      skill.error = error;
      skill.updatedAt = Date.now();
      await this.saveSkills();
      this._onSkillStatusChanged.fire({ id: skillId, status });
    }
  }
  async copyDirectory(src, dest) {
    if (!fs9.existsSync(dest)) {
      fs9.mkdirSync(dest, { recursive: true });
    }
    const entries = fs9.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path10.join(src, entry.name);
      const destPath = path10.join(dest, entry.name);
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs9.copyFileSync(srcPath, destPath);
      }
    }
  }
  findFile(dir, filename) {
    const entries = fs9.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path10.join(dir, entry.name);
      if (entry.isFile() && entry.name === filename)
        return fullPath;
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        const found = this.findFile(fullPath, filename);
        if (found)
          return found;
      }
    }
    return null;
  }
};
_SkillManager.instance = null;
var SkillManager = _SkillManager;

// src/extension/chatview/ChatViewProvider.ts
var ChatViewProvider = class {
  constructor(_extensionUri, _context) {
    this._extensionUri = _extensionUri;
    this._context = _context;
    this._currentStreamingMessage = null;
    this._messageHistory = [];
    this._historyIndex = -1;
    // 防止监听器重复注册
    this._visibilityListenerRegistered = false;
    this._configManager = new ConfigManager(_context);
    this._sessionManager = new SessionManager(_context);
    this._commandParser = new CommandParser();
    this._diagramGenerator = new DiagramGenerator(_context);
    this._testGenerator = new TestGenerator(_context);
    this._autoFixService = new AutoFixService(_context);
    this._projectAnalyzer = new EnhancedProjectAnalyzer();
    this._inputParser = new SmartInputParser();
    this._skillManager = null;
    this._skillExecutor = SkillExecutor.getInstance(_context);
    this._taskStateManager = new TaskStateManager((msg) => this._postMessage(msg));
  }
  /**
   * 创建共享上下文
   */
  _createContext() {
    return {
      extensionUri: this._extensionUri,
      extensionContext: this._context,
      view: this._view,
      chatService: this._chatService,
      configManager: this._configManager,
      sessionManager: this._sessionManager,
      diagramGenerator: this._diagramGenerator,
      testGenerator: this._testGenerator,
      autoFixService: this._autoFixService,
      projectAnalyzer: this._projectAnalyzer,
      inputParser: this._inputParser,
      commandParser: this._commandParser,
      taskStates: this._taskStateManager.getTaskStates(),
      currentStreamingMessage: this._currentStreamingMessage,
      messageHistory: this._messageHistory,
      historyIndex: this._historyIndex,
      projectContext: this._projectContext,
      lastGeneratedDiagram: this._lastGeneratedDiagram,
      lastGeneratedTest: this._lastGeneratedTest,
      postMessage: (msg) => this._postMessage(msg),
      updateTaskStatus: (type, status, msg) => this._taskStateManager.updateStatus(type, status, msg),
      isTaskRunning: (type) => this._taskStateManager.isRunning(type),
      setProcessingContext: (processing) => this._setProcessingContext(processing),
      ensureChatService: () => this._ensureChatService()
    };
  }
  /**
   * 初始化处理器
   */
  _initializeHandlers() {
    const ctx = this._createContext();
    const createDynamicContext = () => ({
      ...ctx,
      view: this._view,
      chatService: this._chatService,
      currentStreamingMessage: this._currentStreamingMessage,
      messageHistory: this._messageHistory,
      historyIndex: this._historyIndex,
      projectContext: this._projectContext,
      lastGeneratedDiagram: this._lastGeneratedDiagram,
      lastGeneratedTest: this._lastGeneratedTest
    });
    const dynamicCtx = new Proxy({}, {
      get: (_, prop) => {
        const currentCtx = createDynamicContext();
        const value = currentCtx[prop];
        if (prop === "currentStreamingMessage") {
          return this._currentStreamingMessage;
        }
        if (prop === "historyIndex") {
          return this._historyIndex;
        }
        return value;
      },
      set: (_, prop, value) => {
        if (prop === "currentStreamingMessage") {
          this._currentStreamingMessage = value;
          return true;
        }
        if (prop === "historyIndex") {
          this._historyIndex = value;
          return true;
        }
        if (prop === "projectContext") {
          this._projectContext = value;
          return true;
        }
        if (prop === "lastGeneratedDiagram") {
          this._lastGeneratedDiagram = value;
          return true;
        }
        if (prop === "lastGeneratedTest") {
          this._lastGeneratedTest = value;
          return true;
        }
        if (prop === "chatService") {
          this._chatService = value;
          return true;
        }
        return false;
      }
    });
    this._sessionHandler = new SessionHandler(dynamicCtx);
    this._chatMessageHandler = new ChatMessageHandler(dynamicCtx);
    this._diagramHandler = new DiagramHandler(dynamicCtx);
    this._testHandler = new TestHandler(dynamicCtx);
    this._commandHandler = new CommandHandler(dynamicCtx);
    this._configHandler = new ConfigHandler(dynamicCtx);
    this._mcpHandler = new MCPHandler(dynamicCtx);
    try {
      const registry = this._mcpHandler.getRegistry();
      const executor = this._mcpHandler.getExecutor();
      this._skillManager = SkillManager.getInstance(this._context, registry, executor);
      this._skillManager.initialize().then(() => {
        console.log("[ChatViewProvider] SkillManager\u521D\u59CB\u5316\u5B8C\u6210");
      }).catch((e) => console.error("[SkillManager] \u521D\u59CB\u5316\u5931\u8D25:", e));
      this._skillManager.registerCommands(this._context);
    } catch (err) {
      console.error("[ChatViewProvider] SkillManager\u521D\u59CB\u5316\u5931\u8D25:", err);
    }
  }
  async resolveWebviewView(webviewView, _context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.title = "AI Chat";
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    const config = await this._configManager.getFullModelConfig();
    if (config.apiKey) {
      this._chatService = new ChatService(config);
    }
    this._initializeHandlers();
    if (!this._sessionManager.currentSession) {
      await this._sessionManager.continueLastSession();
    }
    if (!this._sessionManager.currentSession) {
      this._sessionManager.createSession();
    }
    webviewView.webview.onDidReceiveMessage(async (data) => {
      await this._handleMessage(data);
    });
    if (!this._visibilityListenerRegistered) {
      this._visibilityListenerRegistered = true;
      webviewView.onDidChangeVisibility(async () => {
        if (webviewView.visible) {
          this._sessionHandler.sendCurrentStateWithStreaming();
        }
      });
    }
    this._sessionHandler.sendCurrentStateWithStreaming();
  }
  /**
   * 消息路由
   */
  async _handleMessage(data) {
    if (await this._sessionHandler.handle(data))
      return;
    if (await this._configHandler.handle(data))
      return;
    if (await this._mcpHandler.handle(data))
      return;
    if (await this._diagramHandler.handle(data))
      return;
    if (await this._testHandler.handle(data))
      return;
    if (data.type === "sendMessage") {
      await this._handleSendMessage(data.message, data.attachments);
      return;
    }
    if (await this._chatMessageHandler.handle(data))
      return;
    if (data.type === "saveCodeToFile") {
      await this._saveCodeToFile(data.code, data.filename, data.language);
      return;
    }
    if (data.type === "insertCode") {
      await this._insertCodeToEditor(data.code);
      return;
    }
    if (data.type === "replaceCode") {
      await this._replaceCodeInEditor(data.original, data.replacement);
      return;
    }
    if (data.type === "executeSkill") {
      await this._executeSkillDirect(data.skillId, data.params);
      return;
    }
    if (data.type === "getAvailableSkills") {
      await this._getAvailableSkills();
      return;
    }
    if (data.type === "cancelSkill") {
      this._cancelSkill(data.skillId);
      return;
    }
    if (data.type === "skill:enable") {
      await this._handleSkillEnable(data.skillId);
      return;
    }
    if (data.type === "skill:disable") {
      await this._handleSkillDisable(data.skillId);
      return;
    }
    if (data.type === "skill:uninstall") {
      await this._handleSkillUninstall(data.skillId);
      return;
    }
    if (data.type === "skill:installFromUrl") {
      await this._handleSkillInstallFromUrl(data.url);
      return;
    }
    if (data.type === "skill:openInstallDialog") {
      vscode22.commands.executeCommand("aiAssistant.skill.install");
      return;
    }
    if (data.type === "skill:openCreateDialog") {
      vscode22.commands.executeCommand("aiAssistant.skill.create");
      return;
    }
    console.warn("[ChatViewProvider] Unhandled message type:", data.type);
  }
  /**
   * 处理发送消息 - 集成意图识别
   * 
   * 路由优先级:
   * 1. 显式前缀 @mcp:xxx / @skill:xxx → 直接路由到对应处理器
   * 2. 斜杠命令 /xxx → CommandHandler
   * 3. 自然语言输入 → IntentClassifier 判断是 chat 还是需要调用工具
   */
  async _handleSendMessage(content, attachments) {
    if (!(content == null ? void 0 : content.trim()) && (!attachments || attachments.length === 0)) {
      return;
    }
    if (content == null ? void 0 : content.trim()) {
      this._messageHistory.push(content);
      if (this._messageHistory.length > 100) {
        this._messageHistory.shift();
      }
      this._historyIndex = -1;
    }
    if (MCPParser.isMCPCommand(content)) {
      const handled = await this._mcpHandler.handleMCPCommand(content);
      if (handled)
        return;
    }
    if (this._isSkillCommand(content)) {
      await this._handleSkillCommand(content);
      return;
    }
    const parsed = this._inputParser.parse(content);
    if (parsed.type === "command") {
      const commandParsed = this._commandParser.parse(content);
      if (commandParsed) {
        await this._commandHandler.executeCommand(
          commandParsed,
          this._diagramHandler,
          this._testHandler,
          this._sessionHandler
        );
        return;
      }
    }
    await this._chatMessageHandler.handleSendMessage(content, attachments);
  }
  /**
   * 检查是否是Skill命令
   */
  _isSkillCommand(input) {
    return input.trim().toLowerCase().startsWith("@skill");
  }
  /**
   * [修改] 处理Skill命令 - 结果通过独立通道返回
   */
  async _handleSkillCommand(input) {
    const trimmed = input.trim();
    const match = trimmed.match(/^@skill:?(\w+[-\w]*)?(?:\s+(.*))?$/i);
    const userMessage = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: Date.now()
    };
    await this._sessionManager.addMessage(userMessage);
    this._postMessage({ type: "addMessage", message: userMessage });
    if (!match) {
      this._postMessage({
        type: "addMessage",
        message: {
          id: generateId(),
          role: "assistant",
          content: this._getSkillHelpText(),
          timestamp: Date.now()
        }
      });
      return;
    }
    const skillId = match[1];
    const params = match[2];
    if (!skillId) {
      this._postMessage({
        type: "addMessage",
        message: {
          id: generateId(),
          role: "assistant",
          content: this._getSkillHelpText(),
          timestamp: Date.now()
        }
      });
      return;
    }
    if (skillId.toLowerCase() === "list") {
      await this._showSkillList();
      return;
    }
    await this._executeSkillDirect(skillId, params ? { input: params } : void 0);
  }
  /**
   * 直接执行Skill - 脚本执行，不调用LLM
   */
  async _executeSkillDirect(skillId, params) {
    var _a, _b;
    this._taskStateManager.updateStatus("skill", "running", `\u6267\u884C\u6280\u80FD: ${skillId}`);
    this._postMessage({
      type: "skill:executionStart",
      skillId,
      params
    });
    const startTime = Date.now();
    try {
      if (!this._skillManager) {
        throw new Error("SkillManager\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u68C0\u67E5MCP\u914D\u7F6E");
      }
      const skill = this._skillManager.getSkill(skillId);
      if (!skill) {
        const duration2 = Date.now() - startTime;
        const errorMsg = {
          id: generateId(),
          role: "assistant",
          content: `\u26A0\uFE0F \u6280\u80FD \`${skillId}\` \u672A\u5B89\u88C5\u3002

\u8BF7\u4F7F\u7528 \`@skill:list\` \u67E5\u770B\u53EF\u7528\u6280\u80FD\uFF0C\u6216\u901A\u8FC7Skill\u5305\u7BA1\u7406\u5B89\u88C5:
- \u672C\u5730\u5B89\u88C5: \u5C06skill\u5305\u653E\u5165 skills \u76EE\u5F55
- Git\u5B89\u88C5: \u63D0\u4F9Bskill\u5305\u7684Git\u4ED3\u5E93\u5730\u5740`,
          timestamp: Date.now()
        };
        await this._sessionManager.addMessage(errorMsg);
        this._postMessage({ type: "addMessage", message: errorMsg });
        this._taskStateManager.updateStatus("skill", "error", `\u6280\u80FD ${skillId} \u672A\u5B89\u88C5`);
        return;
      }
      const editor = vscode22.window.activeTextEditor;
      const workspaceContext = {
        workspaceRoot: (_b = (_a = vscode22.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath,
        activeFile: editor == null ? void 0 : editor.document.fileName,
        selectedCode: (editor == null ? void 0 : editor.selection.isEmpty) ? void 0 : editor == null ? void 0 : editor.document.getText(editor.selection)
      };
      const result = await this._skillExecutor.execute(skill, params, workspaceContext);
      const duration = Date.now() - startTime;
      const executionResult = {
        id: generateId(),
        skillId,
        skillName: skill.manifest.name,
        success: result.success,
        output: result.output,
        error: result.error,
        duration,
        logs: result.logs || [],
        mcpCalls: result.mcpCalls || []
      };
      this._postMessage({
        type: "skill:executionResult",
        result: executionResult
      });
      let chatContent;
      if (result.success) {
        const outputStr = result.output != null ? typeof result.output === "string" ? result.output : JSON.stringify(result.output, null, 2) : "(\u6267\u884C\u5B8C\u6210\uFF0C\u65E0\u8F93\u51FA)";
        const truncated = outputStr.length > 3e3 ? outputStr.slice(0, 3e3) + "\n...(\u5DF2\u622A\u65AD)" : outputStr;
        chatContent = `\u2705 **${skill.manifest.name}** \u6267\u884C\u5B8C\u6210 (${duration}ms)

`;
        chatContent += `\`\`\`
${truncated}
\`\`\``;
        if (result.logs && result.logs.length > 0) {
          chatContent += `

<details>
<summary>\u{1F4CB} \u6267\u884C\u65E5\u5FD7 (${result.logs.length}\u6761)</summary>

`;
          for (const log of result.logs) {
            const icon = log.level === "error" ? "\u274C" : log.level === "warn" ? "\u26A0\uFE0F" : "\u2139\uFE0F";
            chatContent += `${icon} ${log.message}
`;
          }
          chatContent += `
</details>`;
        }
      } else {
        chatContent = `\u274C **${skill.manifest.name}** \u6267\u884C\u5931\u8D25 (${duration}ms)

${result.error}`;
      }
      const resultMessage = {
        id: generateId(),
        role: "assistant",
        content: chatContent,
        timestamp: Date.now(),
        metadata: {
          type: "skill_result",
          skillId,
          resultId: executionResult.id
        }
      };
      await this._sessionManager.addMessage(resultMessage);
      this._postMessage({ type: "addMessage", message: resultMessage });
      this._taskStateManager.updateStatus(
        "skill",
        result.success ? "success" : "error",
        result.success ? "\u6280\u80FD\u6267\u884C\u5B8C\u6210" : result.error || "\u6267\u884C\u5931\u8D25"
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
      const duration = Date.now() - startTime;
      this._postMessage({
        type: "skill:executionError",
        skillId,
        error: errorMessage,
        duration
      });
      const errorMsg = {
        id: generateId(),
        role: "assistant",
        content: `\u274C \u6280\u80FD \`${skillId}\` \u6267\u884C\u5931\u8D25 (${duration}ms): ${errorMessage}`,
        timestamp: Date.now()
      };
      await this._sessionManager.addMessage(errorMsg);
      this._postMessage({ type: "addMessage", message: errorMsg });
      this._taskStateManager.updateStatus("skill", "error", errorMessage);
    }
  }
  /**
   * [新增] 获取可用技能列表
   */
  async _getAvailableSkills() {
    const allSkills = [];
    if (this._skillManager) {
      const installed = this._skillManager.getInstalledSkills();
      for (const s of installed) {
        allSkills.push({
          id: s.manifest.id,
          name: s.manifest.name,
          desc: s.manifest.description,
          type: s.installedAt === 0 ? "builtin" : "installed",
          version: s.manifest.version,
          status: s.status
        });
      }
    }
    this._postMessage({
      type: "skill:availableSkills",
      skills: allSkills
    });
  }
  /**
   * [新增] 取消技能执行
   */
  _cancelSkill(skillId) {
    const cancelled = this._skillExecutor.cancel(skillId);
    this._postMessage({
      type: "skill:cancelled",
      skillId,
      success: cancelled
    });
    if (cancelled) {
      this._taskStateManager.updateStatus("skill", "idle", "\u5DF2\u53D6\u6D88");
    }
  }
  // ========== Skill管理操作 ==========
  async _handleSkillEnable(skillId) {
    if (!this._skillManager)
      return;
    const result = await this._skillManager.enable(skillId);
    this._postMessage({
      type: "skill:operationResult",
      operation: "enable",
      skillId,
      success: result.success,
      error: result.error
    });
    if (result.success) {
      await this._getAvailableSkills();
    }
  }
  async _handleSkillDisable(skillId) {
    if (!this._skillManager)
      return;
    const result = await this._skillManager.disable(skillId);
    this._postMessage({
      type: "skill:operationResult",
      operation: "disable",
      skillId,
      success: result.success,
      error: result.error
    });
    if (result.success) {
      await this._getAvailableSkills();
    }
  }
  async _handleSkillUninstall(skillId) {
    if (!this._skillManager)
      return;
    const result = await this._skillManager.uninstall(skillId);
    this._postMessage({
      type: "skill:operationResult",
      operation: "uninstall",
      skillId,
      success: result.success,
      error: result.error
    });
    if (result.success) {
      await this._getAvailableSkills();
    }
  }
  async _handleSkillInstallFromUrl(url) {
    if (!this._skillManager)
      return;
    this._postMessage({ type: "skill:installProgress", status: "downloading", url });
    const result = await this._skillManager.installFromUrl(url);
    this._postMessage({
      type: "skill:operationResult",
      operation: "install",
      success: result.success,
      error: result.error,
      skill: result.skill ? {
        id: result.skill.manifest.id,
        name: result.skill.manifest.name,
        version: result.skill.manifest.version
      } : void 0
    });
    if (result.success) {
      await this._getAvailableSkills();
    }
  }
  /**
   * 获取Skill帮助文本
   */
  _getSkillHelpText() {
    let text = `# Skill \u6280\u80FD\u4F7F\u7528\u5E2E\u52A9

## \u57FA\u672C\u8BED\u6CD5
\`@skill\` - \u663E\u793A\u6B64\u5E2E\u52A9
\`@skill:list\` - \u5217\u51FA\u6240\u6709\u53EF\u7528\u6280\u80FD

## \u8C03\u7528\u6280\u80FD
\`@skill:\u6280\u80FDID\` - \u8C03\u7528\u6307\u5B9A\u6280\u80FD
\`@skill:\u6280\u80FDID \u53C2\u6570\` - \u5E26\u53C2\u6570\u8C03\u7528

## \u53EF\u7528\u6280\u80FD

| \u6280\u80FDID | \u540D\u79F0 | \u8BF4\u660E |
|--------|------|------|
`;
    if (this._skillManager) {
      const skills = this._skillManager.getInstalledSkills();
      for (const s of skills) {
        const icon = s.installedAt === 0 ? "\u{1F4E6}" : "\u{1F4E5}";
        text += `| \`${s.manifest.id}\` | ${icon} ${s.manifest.name} | ${s.manifest.description} |
`;
      }
    }
    if (!this._skillManager || this._skillManager.getInstalledSkills().length === 0) {
      text += "| - | (\u65E0\u53EF\u7528\u6280\u80FD) | \u8BF7\u7B49\u5F85\u521D\u59CB\u5316\u5B8C\u6210\u6216\u5B89\u88C5\u6280\u80FD\u5305 |\n";
    }
    text += `
## \u7BA1\u7406\u6280\u80FD
- \u547D\u4EE4\u9762\u677F: \`Ctrl+Shift+P\` \u2192 \u641C\u7D22 "Skill"
- \u5B89\u88C5: \`aiAssistant.skill.install\`
- \u7BA1\u7406: \`aiAssistant.skill.manage\`
- \u521B\u5EFA: \`aiAssistant.skill.create\`

## \u793A\u4F8B
\`@skill:code-reviewer\`
\`@skill:test-architect src/utils.ts\`
\`@skill:dependency-guardian\`
`;
    return text;
  }
  /**
   * 显示可用技能列表
   */
  async _showSkillList() {
    const installedSkills = this._skillManager ? this._skillManager.getInstalledSkills() : [];
    let content = "# \u{1F4E6} \u53EF\u7528\u6280\u80FD\u5217\u8868\n\n";
    const builtins = installedSkills.filter((s) => s.installedAt === 0);
    const userInstalled = installedSkills.filter((s) => s.installedAt > 0);
    if (builtins.length > 0) {
      content += "## \u5185\u7F6E\u6280\u80FD\n\n";
      content += "| \u6280\u80FDID | \u540D\u79F0 | \u8BF4\u660E | \u72B6\u6001 |\n";
      content += "|--------|------|------|------|\n";
      for (const skill of builtins) {
        const statusIcon = skill.status === "active" ? "\u2705" : skill.status === "disabled" ? "\u23F8\uFE0F" : "\u274C";
        content += `| \`${skill.manifest.id}\` | ${skill.manifest.name} | ${skill.manifest.description} | ${statusIcon} |
`;
      }
    } else {
      content += "> \u26A0\uFE0F \u6CA1\u6709\u627E\u5230\u5185\u7F6E\u6280\u80FD\u3002\u8BF7\u786E\u8BA4\u6269\u5C55\u5B89\u88C5\u5B8C\u6574\u3002\n\n";
    }
    if (userInstalled.length > 0) {
      content += "\n## \u5DF2\u5B89\u88C5\u6280\u80FD\n\n";
      content += "| \u6280\u80FDID | \u540D\u79F0 | \u7248\u672C | \u72B6\u6001 |\n";
      content += "|--------|------|------|------|\n";
      for (const skill of userInstalled) {
        const statusIcon = skill.status === "active" ? "\u2705" : skill.status === "disabled" ? "\u23F8\uFE0F" : "\u274C";
        content += `| \`${skill.manifest.id}\` | ${skill.manifest.name} | ${skill.manifest.version} | ${statusIcon} |
`;
      }
    }
    content += "\n---\n";
    content += "\u4F7F\u7528\u65B9\u5F0F: `@skill:\u6280\u80FDID [\u53C2\u6570]`\n";
    content += '\u7BA1\u7406\u6280\u80FD: \u547D\u4EE4\u9762\u677F `Ctrl+Shift+P` \u2192 \u641C\u7D22 "Skill"\n';
    this._postMessage({
      type: "addMessage",
      message: {
        id: generateId(),
        role: "assistant",
        content,
        timestamp: Date.now()
      }
    });
  }
  /**
   * 确保ChatService可用
   */
  async _ensureChatService() {
    if (!this._chatService) {
      const config = await this._configManager.getFullModelConfig();
      if (!config.apiKey) {
        return null;
      }
      this._chatService = new ChatService(config);
    }
    return this._chatService;
  }
  /**
   * 保存代码到文件
   */
  async _saveCodeToFile(code, filename, language) {
    var _a, _b;
    try {
      const workspaceRoot = (_b = (_a = vscode22.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath;
      if (!workspaceRoot) {
        vscode22.window.showErrorMessage("\u8BF7\u5148\u6253\u5F00\u5DE5\u4F5C\u533A");
        return;
      }
      const saveUri = await vscode22.window.showSaveDialog({
        defaultUri: vscode22.Uri.file(`${workspaceRoot}/${filename}`),
        filters: { "All Files": ["*"] }
      });
      if (saveUri) {
        const fs10 = require("fs");
        fs10.writeFileSync(saveUri.fsPath, code, "utf-8");
        const document = await vscode22.workspace.openTextDocument(saveUri);
        await vscode22.window.showTextDocument(document);
        vscode22.window.showInformationMessage(`\u6587\u4EF6\u5DF2\u4FDD\u5B58: ${saveUri.fsPath}`);
      }
    } catch (error) {
      vscode22.window.showErrorMessage(`\u4FDD\u5B58\u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
    }
  }
  /**
   * 插入代码到编辑器
   */
  async _insertCodeToEditor(code) {
    const editor = vscode22.window.activeTextEditor;
    if (!editor) {
      vscode22.window.showWarningMessage("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u6587\u4EF6");
      return;
    }
    await editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, code);
    });
  }
  /**
   * 替换编辑器中的代码
   */
  async _replaceCodeInEditor(original, replacement) {
    const editor = vscode22.window.activeTextEditor;
    if (!editor) {
      vscode22.window.showWarningMessage("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u6587\u4EF6");
      return;
    }
    const document = editor.document;
    const fullText = document.getText();
    const index = fullText.indexOf(original);
    if (index === -1) {
      vscode22.window.showWarningMessage("\u672A\u627E\u5230\u8981\u66FF\u6362\u7684\u4EE3\u7801");
      return;
    }
    const startPos = document.positionAt(index);
    const endPos = document.positionAt(index + original.length);
    const range = new vscode22.Range(startPos, endPos);
    await editor.edit((editBuilder) => {
      editBuilder.replace(range, replacement);
    });
    vscode22.window.showInformationMessage("\u4EE3\u7801\u5DF2\u66FF\u6362");
  }
  _setProcessingContext(processing) {
    vscode22.commands.executeCommand("setContext", "aiAssistant.isProcessing", processing);
  }
  _postMessage(message) {
    var _a;
    (_a = this._view) == null ? void 0 : _a.webview.postMessage(message);
  }
  _getHtmlForWebview(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode22.Uri.joinPath(this._extensionUri, "dist", "webview.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode22.Uri.joinPath(this._extensionUri, "dist", "webview.css")
    );
    const nonce = this._getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: https: blob: https://mermaid.ink; font-src ${webview.cspSource}; frame-src blob: https:; connect-src https: https://mermaid.ink; worker-src 'none';">
  <link href="${styleUri}" rel="stylesheet">
  <title>AI Assistant</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
  _getNonce() {
    let text = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }
  // ==================== 公共方法 ====================
  async newChat() {
    await this._sessionHandler.createNewChat();
  }
  stopTask() {
    this._chatMessageHandler.stopCurrentTask();
  }
  async continueLastSession() {
    await this._sessionHandler.continueLastSession();
  }
  async showSessionPicker() {
    await this._sessionHandler.showSessionPicker();
  }
  clearAllDataAndReset() {
    this._sessionHandler.clearAllDataAndReset();
  }
  async sendMessage(content) {
    if (!this._view) {
      vscode22.window.showWarningMessage("\u804A\u5929\u89C6\u56FE\u5C1A\u672A\u51C6\u5907\u597D\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5");
      return;
    }
    await this._handleSendMessage(content);
  }
  async sendMessageWithContext(displayLabel, systemContext) {
    await this._chatMessageHandler.sendMessageWithContext(displayLabel, systemContext);
  }
};
ChatViewProvider.viewType = "aiAssistant.chatView";

// src/extension/code-editor/SmartCodeEditor.ts
var vscode23 = __toESM(require("vscode"));
var SmartCodeEditor = class {
  /**
   * 初始化MCP工具提示系统
   */
  static initialize(context) {
    this.completionProvider = vscode23.languages.registerCompletionItemProvider(
      ["typescript", "javascript", "typescriptreact", "javascriptreact", "markdown", "plaintext"],
      {
        provideCompletionItems: (document, position) => {
          return this.provideCompletions(document, position);
        },
        resolveCompletionItem: (item) => {
          return this.resolveCompletion(item);
        }
      },
      "@",
      ":",
      "."
      // 触发字符
    );
    this.hoverProvider = vscode23.languages.registerHoverProvider(
      ["typescript", "javascript", "typescriptreact", "javascriptreact", "markdown", "plaintext"],
      {
        provideHover: (document, position) => {
          return this.provideHover(document, position);
        }
      }
    );
    context.subscriptions.push(this.completionProvider, this.hoverProvider);
    this.loadBuiltinTools();
    this.loadBuiltinSkills();
  }
  /**
   * 加载内置MCP工具定义
   */
  static loadBuiltinTools() {
    const builtinTools = [
      {
        id: "file:read",
        name: "\u8BFB\u53D6\u6587\u4EF6",
        description: "\u8BFB\u53D6\u6307\u5B9A\u8DEF\u5F84\u7684\u6587\u4EF6\u5185\u5BB9",
        category: "file",
        insertText: '@mcp:file:read "${1:path}"',
        parameters: [
          { name: "path", type: "string", description: "\u6587\u4EF6\u8DEF\u5F84", required: true }
        ]
      },
      {
        id: "file:write",
        name: "\u5199\u5165\u6587\u4EF6",
        description: "\u5C06\u5185\u5BB9\u5199\u5165\u6307\u5B9A\u6587\u4EF6",
        category: "file",
        insertText: '@mcp:file:write "${1:path}" "${2:content}"',
        parameters: [
          { name: "path", type: "string", description: "\u6587\u4EF6\u8DEF\u5F84", required: true },
          { name: "content", type: "string", description: "\u6587\u4EF6\u5185\u5BB9", required: true }
        ]
      },
      {
        id: "file:list",
        name: "\u5217\u51FA\u6587\u4EF6",
        description: "\u5217\u51FA\u76EE\u5F55\u4E0B\u7684\u6240\u6709\u6587\u4EF6",
        category: "file",
        insertText: '@mcp:file:list "${1:directory}"',
        parameters: [
          { name: "directory", type: "string", description: "\u76EE\u5F55\u8DEF\u5F84", required: true }
        ]
      },
      {
        id: "code:analyze",
        name: "\u5206\u6790\u4EE3\u7801",
        description: "\u5206\u6790\u4EE3\u7801\u7ED3\u6784\u548C\u4F9D\u8D56\u5173\u7CFB",
        category: "code",
        insertText: '@mcp:code:analyze "${1:file}"',
        parameters: [
          { name: "file", type: "string", description: "\u8981\u5206\u6790\u7684\u6587\u4EF6", required: true }
        ]
      },
      {
        id: "code:refactor",
        name: "\u91CD\u6784\u4EE3\u7801",
        description: "\u667A\u80FD\u91CD\u6784\u9009\u4E2D\u7684\u4EE3\u7801",
        category: "code",
        insertText: '@mcp:code:refactor "${1:target}" "${2:type}"',
        parameters: [
          { name: "target", type: "string", description: "\u91CD\u6784\u76EE\u6807", required: true },
          { name: "type", type: "string", description: "\u91CD\u6784\u7C7B\u578B: extract-function, rename, inline", required: true }
        ]
      },
      {
        id: "shell:run",
        name: "\u8FD0\u884C\u547D\u4EE4",
        description: "\u5728\u7EC8\u7AEF\u8FD0\u884CShell\u547D\u4EE4",
        category: "shell",
        insertText: '@mcp:shell:run "${1:command}"',
        parameters: [
          { name: "command", type: "string", description: "Shell\u547D\u4EE4", required: true }
        ]
      },
      {
        id: "git:status",
        name: "Git\u72B6\u6001",
        description: "\u83B7\u53D6Git\u4ED3\u5E93\u72B6\u6001",
        category: "git",
        insertText: "@mcp:git:status"
      },
      {
        id: "git:diff",
        name: "Git\u5DEE\u5F02",
        description: "\u83B7\u53D6\u672A\u63D0\u4EA4\u7684\u66F4\u6539",
        category: "git",
        insertText: '@mcp:git:diff "${1:file}"',
        parameters: [
          { name: "file", type: "string", description: "\u6587\u4EF6\u8DEF\u5F84\uFF08\u53EF\u9009\uFF09", required: false }
        ]
      },
      {
        id: "git:commit",
        name: "Git\u63D0\u4EA4",
        description: "\u63D0\u4EA4\u66F4\u6539\u5230\u672C\u5730\u4ED3\u5E93",
        category: "git",
        insertText: '@mcp:git:commit "${1:message}"',
        parameters: [
          { name: "message", type: "string", description: "\u63D0\u4EA4\u4FE1\u606F", required: true }
        ]
      },
      {
        id: "search:code",
        name: "\u641C\u7D22\u4EE3\u7801",
        description: "\u5728\u9879\u76EE\u4E2D\u641C\u7D22\u4EE3\u7801",
        category: "search",
        insertText: '@mcp:search:code "${1:query}"',
        parameters: [
          { name: "query", type: "string", description: "\u641C\u7D22\u5173\u952E\u8BCD", required: true }
        ]
      },
      {
        id: "search:files",
        name: "\u641C\u7D22\u6587\u4EF6",
        description: "\u6309\u540D\u79F0\u641C\u7D22\u6587\u4EF6",
        category: "search",
        insertText: '@mcp:search:files "${1:pattern}"',
        parameters: [
          { name: "pattern", type: "string", description: "\u6587\u4EF6\u540D\u6A21\u5F0F", required: true }
        ]
      },
      {
        id: "test:generate",
        name: "\u751F\u6210\u6D4B\u8BD5",
        description: "\u4E3A\u4EE3\u7801\u751F\u6210\u5355\u5143\u6D4B\u8BD5",
        category: "test",
        insertText: '@mcp:test:generate "${1:file}"',
        parameters: [
          { name: "file", type: "string", description: "\u8981\u6D4B\u8BD5\u7684\u6587\u4EF6", required: true }
        ]
      },
      {
        id: "test:run",
        name: "\u8FD0\u884C\u6D4B\u8BD5",
        description: "\u8FD0\u884C\u9879\u76EE\u6D4B\u8BD5",
        category: "test",
        insertText: '@mcp:test:run "${1:pattern}"',
        parameters: [
          { name: "pattern", type: "string", description: "\u6D4B\u8BD5\u6587\u4EF6\u6A21\u5F0F\uFF08\u53EF\u9009\uFF09", required: false }
        ]
      },
      {
        id: "diagram:generate",
        name: "\u751F\u6210\u56FE\u8868",
        description: "\u6839\u636E\u4EE3\u7801\u751F\u6210\u67B6\u6784\u56FE",
        category: "diagram",
        insertText: '@mcp:diagram:generate "${1:type}" "${2:description}"',
        parameters: [
          { name: "type", type: "string", description: "\u56FE\u8868\u7C7B\u578B: flowchart, sequence, class, architecture", required: true },
          { name: "description", type: "string", description: "\u56FE\u8868\u63CF\u8FF0", required: true }
        ]
      },
      {
        id: "web:fetch",
        name: "\u7F51\u9875\u8BF7\u6C42",
        description: "\u83B7\u53D6\u7F51\u9875\u5185\u5BB9",
        category: "web",
        insertText: '@mcp:web:fetch "${1:url}"',
        parameters: [
          { name: "url", type: "string", description: "URL\u5730\u5740", required: true }
        ]
      },
      {
        id: "agent:run",
        name: "\u542F\u52A8Agent",
        description: "\u542F\u52A8\u81EA\u4E3BAgent\u6267\u884C\u590D\u6742\u4EFB\u52A1",
        category: "agent",
        insertText: '@mcp:agent:run "${1:task}"',
        parameters: [
          { name: "task", type: "string", description: "\u4EFB\u52A1\u63CF\u8FF0", required: true }
        ]
      }
    ];
    for (const tool of builtinTools) {
      this.mcpTools.set(tool.id, tool);
    }
  }
  /**
   * 注册自定义MCP工具
   */
  static registerTool(tool) {
    this.mcpTools.set(tool.id, tool);
  }
  /**
   * 批量注册MCP工具
   */
  static registerTools(tools) {
    for (const tool of tools) {
      this.mcpTools.set(tool.id, tool);
    }
  }
  /**
   * 加载内置Skill技能定义
   */
  static loadBuiltinSkills() {
    const builtinSkills = [
      {
        id: "dependency-guardian",
        name: "\u4F9D\u8D56\u5B89\u5168\u536B\u58EB",
        description: "\u68C0\u67E5\u9879\u76EE\u4F9D\u8D56\u4E2D\u7684\u5B89\u5168\u6F0F\u6D1E",
        category: "automator",
        icon: "\u{1F6E1}\uFE0F",
        insertText: "@skill:dependency-guardian",
        supportedLanguages: ["typescript", "javascript", "python", "java", "go"]
      },
      {
        id: "test-architect",
        name: "\u6D4B\u8BD5\u67B6\u6784\u5E08",
        description: "\u4E3A\u6E90\u4EE3\u7801\u667A\u80FD\u751F\u6210\u5355\u5143\u6D4B\u8BD5",
        category: "builder",
        icon: "\u{1F9EA}",
        insertText: '@skill:test-architect "${1:file}"',
        supportedLanguages: ["typescript", "javascript", "python", "java", "go"]
      },
      {
        id: "code-reviewer",
        name: "\u4EE3\u7801\u5BA1\u67E5\u5458",
        description: "\u5BF9\u4EE3\u7801\u8FDB\u884C\u667A\u80FD\u5BA1\u67E5\uFF0C\u6307\u51FA\u6F5C\u5728\u95EE\u9898",
        category: "explainer",
        icon: "\u{1F50D}",
        insertText: '@skill:code-reviewer "${1:file}"',
        supportedLanguages: ["typescript", "javascript", "python", "java", "go"]
      },
      {
        id: "tool-maker",
        name: "\u5C0F\u5DE5\u5177\u5236\u4F5C\u5668",
        description: "\u5236\u4F5C\u672C\u5730CLI\u811A\u672C\uFF08\u6279\u91CF\u91CD\u547D\u540D\u3001\u65E5\u5FD7\u5206\u6790\u3001\u56FE\u7247\u538B\u7F29\u7B49\uFF09",
        category: "builder",
        icon: "\u{1F527}",
        insertText: '@skill:tool-maker "${1:tool_type}" "${2:description}"',
        supportedLanguages: ["typescript", "javascript", "python", "java", "go"]
      },
      {
        id: "excel-processor",
        name: "Excel\u5904\u7406\u5668",
        description: "\u6E05\u6D17\u8868\u683C\u6570\u636E\u3001\u5408\u5E76\u591A\u8868\u3001\u505A\u7EDF\u8BA1\u5206\u6790\uFF0C\u8F93\u51FAExcel\u6587\u4EF6",
        category: "automator",
        icon: "\u{1F4CA}",
        insertText: '@skill:excel-processor "${1:operation}" "${2:file}"'
      },
      {
        id: "word-processor",
        name: "Word\u6587\u6863\u5904\u7406\u5668",
        description: "\u751F\u6210\u89C4\u8303Word\u6587\u6863\uFF0C\u652F\u6301\u9700\u6C42\u6587\u6863\u3001\u4F1A\u8BAE\u7EAA\u8981\u3001\u8BF4\u660E\u4E66\u7B49",
        category: "builder",
        icon: "\u{1F4C4}",
        insertText: '@skill:word-processor "${1:template}" "${2:content}"'
      },
      {
        id: "ppt-processor",
        name: "PPT\u6F14\u793A\u6587\u7A3F\u751F\u6210\u5668",
        description: "\u6839\u636E\u4E3B\u9898\u81EA\u52A8\u751F\u6210\u5927\u7EB2\u4E0E\u9010\u9875\u8981\u70B9\u6F14\u793A\u6587\u7A3F",
        category: "builder",
        icon: "\u{1F4FD}\uFE0F",
        insertText: '@skill:ppt-processor "${1:topic}" "${2:outline}"'
      },
      {
        id: "git-scribe",
        name: "Git\u4E66\u8BB0\u5458",
        description: "\u81EA\u52A8\u751F\u6210Commit Message\u548CPR\u63CF\u8FF0",
        category: "automator",
        icon: "\u{1F4DD}",
        insertText: '@skill:git-scribe "${1:type}"'
      },
      {
        id: "scaffolder",
        name: "\u811A\u624B\u67B6\u751F\u6210\u5668",
        description: "\u5FEB\u901F\u751F\u6210\u9879\u76EE\u7ED3\u6784\u548C\u6837\u677F\u4EE3\u7801",
        category: "builder",
        icon: "\u{1F3D7}\uFE0F",
        insertText: '@skill:scaffolder "${1:template}" "${2:name}"'
      },
      {
        id: "live-docs",
        name: "\u6587\u6863\u751F\u6210\u5668",
        description: "\u81EA\u52A8\u751F\u6210\u4EE3\u7801\u6587\u6863\u548CAPI\u8BF4\u660E",
        category: "explainer",
        icon: "\u{1F4DA}",
        insertText: '@skill:live-docs "${1:file}"'
      },
      {
        id: "mcp-tools",
        name: "MCP\u5DE5\u5177\u8C03\u7528",
        description: "\u901A\u8FC7MCP\u534F\u8BAE\u8C03\u7528\u5916\u90E8\u5DE5\u5177\uFF08\u6587\u4EF6\u7CFB\u7EDF\u3001\u6D4F\u89C8\u5668\u3001\u6570\u636E\u5E93\u7B49\uFF09",
        category: "automator",
        icon: "\u{1F50C}",
        insertText: '@skill:mcp-tools "${1:tool}" "${2:params}"'
      },
      {
        id: "mcp-config",
        name: "MCP\u914D\u7F6E\u7BA1\u7406",
        description: "\u914D\u7F6E\u548C\u7BA1\u7406MCP\u670D\u52A1\u5668\u8FDE\u63A5",
        category: "automator",
        icon: "\u2699\uFE0F",
        insertText: '@skill:mcp-config "${1:action}"'
      }
    ];
    for (const skill of builtinSkills) {
      this.skillTools.set(skill.id, skill);
    }
  }
  /**
   * 注册自定义Skill技能
   */
  static registerSkill(skill) {
    this.skillTools.set(skill.id, skill);
  }
  /**
   * 批量注册Skill技能
   */
  static registerSkills(skills) {
    for (const skill of skills) {
      this.skillTools.set(skill.id, skill);
    }
  }
  /**
   * 提供统一的自动补全（@mcp 和 @skill）
   */
  static provideCompletions(document, position) {
    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    const atMatch = linePrefix.match(/@([a-zA-Z0-9:_-]*)$/);
    if (!atMatch) {
      return null;
    }
    const prefix = atMatch[1] || "";
    const items = [];
    const showMcpPrefix = prefix === "" || "mcp:".startsWith(prefix) && !prefix.startsWith("mcp:");
    const showSkillPrefix = prefix === "" || "skill:".startsWith(prefix) && !prefix.startsWith("skill:");
    const isMcpToolMode = prefix.startsWith("mcp:");
    const isSkillMode = prefix.startsWith("skill:");
    if (showMcpPrefix) {
      const mcpItem = new vscode23.CompletionItem("@mcp:", vscode23.CompletionItemKind.Module);
      mcpItem.detail = "MCP \u5DE5\u5177\u8C03\u7528";
      mcpItem.documentation = new vscode23.MarkdownString(
        "**MCP \u5DE5\u5177\u7CFB\u7EDF**\n\n\u8F93\u5165 `@mcp:` \u540E\u8DDF\u5DE5\u5177ID\u6765\u8C03\u7528MCP\u5DE5\u5177\u3002\n\n**\u5206\u7C7B:** file, code, shell, git, search, test, diagram, web, agent"
      );
      mcpItem.insertText = new vscode23.SnippetString("mcp:${1}");
      mcpItem.filterText = "@mcp:";
      mcpItem.command = { command: "editor.action.triggerSuggest", title: "\u89E6\u53D1\u5EFA\u8BAE" };
      mcpItem.sortText = "0-mcp";
      items.push(mcpItem);
    }
    if (showSkillPrefix) {
      const skillItem = new vscode23.CompletionItem("@skill:", vscode23.CompletionItemKind.Module);
      skillItem.detail = "Skill \u6280\u80FD\u8C03\u7528";
      skillItem.documentation = new vscode23.MarkdownString(
        "**Skill \u6280\u80FD\u7CFB\u7EDF**\n\n\u8F93\u5165 `@skill:` \u540E\u8DDF\u6280\u80FDID\u6765\u8C03\u7528Skill\u6280\u80FD\u3002\n\n**\u70ED\u95E8:** test-architect, code-reviewer, tool-maker"
      );
      skillItem.insertText = new vscode23.SnippetString("skill:${1}");
      skillItem.filterText = "@skill:";
      skillItem.command = { command: "editor.action.triggerSuggest", title: "\u89E6\u53D1\u5EFA\u8BAE" };
      skillItem.sortText = "1-skill";
      items.push(skillItem);
    }
    if (isMcpToolMode) {
      const toolPrefix = prefix.slice(4);
      for (const [id, tool] of this.mcpTools) {
        if (toolPrefix === "" || id.startsWith(toolPrefix) || id.includes(toolPrefix) || tool.name.includes(toolPrefix)) {
          const item = new vscode23.CompletionItem(`@mcp:${id}`, vscode23.CompletionItemKind.Function);
          item.detail = tool.name;
          item.documentation = new vscode23.MarkdownString(
            `**${tool.name}**

${tool.description}

` + (tool.parameters ? `**\u53C2\u6570:**
${tool.parameters.map(
              (p) => `- \`${p.name}\` (${p.type}${p.required ? "" : ", \u53EF\u9009"}): ${p.description}`
            ).join("\n")}` : "")
          );
          item.insertText = new vscode23.SnippetString(tool.insertText.replace("@mcp:", ""));
          item.filterText = `@mcp:${id}`;
          item.sortText = `2-${tool.category}-${id}`;
          items.push(item);
        }
      }
    }
    if (isSkillMode) {
      const skillPrefix = prefix.slice(6);
      for (const [id, skill] of this.skillTools) {
        if (skillPrefix === "" || id.startsWith(skillPrefix) || id.includes(skillPrefix) || skill.name.includes(skillPrefix)) {
          const item = new vscode23.CompletionItem(`@skill:${id}`, vscode23.CompletionItemKind.Module);
          item.detail = `${skill.icon} ${skill.name}`;
          item.documentation = new vscode23.MarkdownString(
            `## ${skill.icon} ${skill.name}

${skill.description}

**\u7C7B\u522B:** \`${skill.category}\`

` + (skill.supportedLanguages ? `**\u652F\u6301\u8BED\u8A00:** ${skill.supportedLanguages.join(", ")}` : "**\u652F\u6301\u8BED\u8A00:** \u6240\u6709\u8BED\u8A00")
          );
          item.insertText = new vscode23.SnippetString(skill.insertText.replace("@skill:", ""));
          item.filterText = `@skill:${id}`;
          item.sortText = `3-${skill.category}-${id}`;
          items.push(item);
        }
      }
    }
    return items.length > 0 ? new vscode23.CompletionList(items, false) : null;
  }
  /**
   * 提供MCP自动补全 (保留用于向后兼容)
   */
  static provideMCPCompletions(document, position, prefix = "") {
    const items = [];
    for (const [id, tool] of this.mcpTools) {
      if (id.startsWith(prefix) || tool.name.includes(prefix)) {
        const item = new vscode23.CompletionItem(
          `@mcp:${id}`,
          vscode23.CompletionItemKind.Function
        );
        item.detail = tool.name;
        item.documentation = new vscode23.MarkdownString(
          `**${tool.name}**

${tool.description}

` + (tool.parameters ? `**\u53C2\u6570:**
${tool.parameters.map(
            (p) => `- \`${p.name}\` (${p.type}${p.required ? "" : ", \u53EF\u9009"}): ${p.description}`
          ).join("\n")}` : "")
        );
        item.insertText = new vscode23.SnippetString(tool.insertText.replace("@mcp:", ""));
        item.filterText = `@mcp:${id}`;
        item.sortText = `0-${tool.category}-${id}`;
        items.push(item);
      }
    }
    return new vscode23.CompletionList(items, false);
  }
  /**
   * 提供Skill自动补全
   */
  static provideSkillCompletions(document, position, prefix = "") {
    const items = [];
    for (const [id, skill] of this.skillTools) {
      if (id.startsWith(prefix) || skill.name.includes(prefix)) {
        const item = new vscode23.CompletionItem(
          `@skill:${id}`,
          vscode23.CompletionItemKind.Module
        );
        item.detail = `${skill.icon} ${skill.name}`;
        item.documentation = new vscode23.MarkdownString(
          `## ${skill.icon} ${skill.name}

${skill.description}

**\u7C7B\u522B:** \`${skill.category}\`

` + (skill.supportedLanguages ? `**\u652F\u6301\u8BED\u8A00:** ${skill.supportedLanguages.join(", ")}` : "**\u652F\u6301\u8BED\u8A00:** \u6240\u6709\u8BED\u8A00")
        );
        item.insertText = new vscode23.SnippetString(skill.insertText.replace("@skill:", ""));
        item.filterText = `@skill:${id}`;
        item.sortText = `1-${skill.category}-${id}`;
        items.push(item);
      }
    }
    return new vscode23.CompletionList(items, false);
  }
  /**
   * 创建所有 @ 前缀补全（包括 @mcp 和 @skill）
   */
  static createAllPrefixCompletions() {
    const items = [];
    const mcpItem = new vscode23.CompletionItem("mcp:", vscode23.CompletionItemKind.Module);
    mcpItem.detail = "MCP \u5DE5\u5177\u8C03\u7528";
    mcpItem.documentation = new vscode23.MarkdownString(
      "**MCP \u5DE5\u5177\u7CFB\u7EDF**\n\n\u8F93\u5165 `@mcp:` \u540E\u8DDF\u5DE5\u5177ID\u6765\u8C03\u7528MCP\u5DE5\u5177\u3002\n\n**\u5206\u7C7B:**\n- `file:` - \u6587\u4EF6\u64CD\u4F5C\n- `code:` - \u4EE3\u7801\u5206\u6790\n- `shell:` - Shell\u547D\u4EE4\n- `git:` - Git\u64CD\u4F5C\n- `search:` - \u641C\u7D22\n- `test:` - \u6D4B\u8BD5\n- `diagram:` - \u56FE\u8868\n- `web:` - \u7F51\u7EDC\u8BF7\u6C42\n- `agent:` - \u81EA\u4E3BAgent"
    );
    mcpItem.insertText = new vscode23.SnippetString("mcp:${1}");
    mcpItem.command = {
      command: "editor.action.triggerSuggest",
      title: "\u89E6\u53D1\u5EFA\u8BAE"
    };
    mcpItem.sortText = "0-mcp";
    items.push(mcpItem);
    const skillItem = new vscode23.CompletionItem("skill:", vscode23.CompletionItemKind.Module);
    skillItem.detail = "Skill \u6280\u80FD\u8C03\u7528";
    skillItem.documentation = new vscode23.MarkdownString(
      "**Skill \u6280\u80FD\u7CFB\u7EDF**\n\n\u8F93\u5165 `@skill:` \u540E\u8DDF\u6280\u80FDID\u6765\u8C03\u7528Skill\u6280\u80FD\u3002\n\n**\u5206\u7C7B:**\n- `automator` - \u{1F916} \u81EA\u52A8\u5316\u6280\u80FD\uFF08\u5B89\u5168\u68C0\u67E5\u3001Git\u64CD\u4F5C\u7B49\uFF09\n- `builder` - \u{1F3D7}\uFE0F \u6784\u5EFA\u5668\u6280\u80FD\uFF08\u751F\u6210\u6D4B\u8BD5\u3001\u6587\u6863\u3001\u811A\u624B\u67B6\u7B49\uFF09\n- `explainer` - \u{1F4D6} \u89E3\u91CA\u5668\u6280\u80FD\uFF08\u4EE3\u7801\u5BA1\u67E5\u3001\u6587\u6863\u751F\u6210\u7B49\uFF09\n\n**\u70ED\u95E8\u6280\u80FD:**\n- `test-architect` - \u6D4B\u8BD5\u67B6\u6784\u5E08\n- `code-reviewer` - \u4EE3\u7801\u5BA1\u67E5\u5458\n- `tool-maker` - \u5C0F\u5DE5\u5177\u5236\u4F5C\u5668\n- `dependency-guardian` - \u4F9D\u8D56\u5B89\u5168\u536B\u58EB"
    );
    skillItem.insertText = new vscode23.SnippetString("skill:${1}");
    skillItem.command = {
      command: "editor.action.triggerSuggest",
      title: "\u89E6\u53D1\u5EFA\u8BAE"
    };
    skillItem.sortText = "1-skill";
    items.push(skillItem);
    return new vscode23.CompletionList(items, false);
  }
  /**
   * 解析补全项（添加更多细节）
   */
  static resolveCompletion(item) {
    var _a;
    const label = ((_a = item.label) == null ? void 0 : _a.toString()) || "";
    if (label.startsWith("@mcp:")) {
      const toolId = label.replace("@mcp:", "");
      const tool = this.mcpTools.get(toolId);
      if (tool && tool.documentation) {
        item.documentation = new vscode23.MarkdownString(tool.documentation);
      }
    }
    if (label.startsWith("@skill:")) {
      const skillId = label.replace("@skill:", "");
      const skill = this.skillTools.get(skillId);
      if (skill && skill.documentation) {
        item.documentation = new vscode23.MarkdownString(skill.documentation);
      }
    }
    return item;
  }
  /**
   * 提供悬停提示（支持 @mcp 和 @skill）
   */
  static provideHover(document, position) {
    const mcpRange = document.getWordRangeAtPosition(position, /@mcp:[a-zA-Z0-9:_-]+/);
    if (mcpRange) {
      const text = document.getText(mcpRange);
      const toolId = text.replace("@mcp:", "");
      const tool = this.mcpTools.get(toolId);
      if (tool) {
        const markdown = new vscode23.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown(`## \u{1F527} ${tool.name}

`);
        markdown.appendMarkdown(`${tool.description}

`);
        markdown.appendMarkdown(`**\u5206\u7C7B:** \`${tool.category}\`

`);
        if (tool.parameters && tool.parameters.length > 0) {
          markdown.appendMarkdown(`**\u53C2\u6570:**

`);
          for (const param of tool.parameters) {
            const required = param.required ? "(\u5FC5\u9700)" : "(\u53EF\u9009)";
            markdown.appendMarkdown(`- \`${param.name}\` ${required}: ${param.description}
`);
          }
          markdown.appendMarkdown("\n");
        }
        markdown.appendMarkdown(`**\u7528\u6CD5:** \`${tool.insertText}\``);
        return new vscode23.Hover(markdown, mcpRange);
      }
    }
    const skillRange = document.getWordRangeAtPosition(position, /@skill:[a-zA-Z0-9:_-]+/);
    if (skillRange) {
      const text = document.getText(skillRange);
      const skillId = text.replace("@skill:", "");
      const skill = this.skillTools.get(skillId);
      if (skill) {
        const markdown = new vscode23.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown(`## ${skill.icon} ${skill.name}

`);
        markdown.appendMarkdown(`${skill.description}

`);
        markdown.appendMarkdown(`**\u7C7B\u522B:** \`${skill.category}\`

`);
        if (skill.supportedLanguages && skill.supportedLanguages.length > 0) {
          markdown.appendMarkdown(`**\u652F\u6301\u8BED\u8A00:** ${skill.supportedLanguages.join(", ")}

`);
        } else {
          markdown.appendMarkdown(`**\u652F\u6301\u8BED\u8A00:** \u6240\u6709\u8BED\u8A00

`);
        }
        markdown.appendMarkdown(`**\u7528\u6CD5:** \`${skill.insertText}\``);
        return new vscode23.Hover(markdown, skillRange);
      }
    }
    return null;
  }
  /**
   * 分析代码上下文，推荐相关的MCP工具
   */
  static analyzeCodeContext(document) {
    const text = document.getText();
    const language = document.languageId;
    const suggestedTools = [];
    const hasImports = /^(import|require|from)\s/m.test(text);
    const hasFunctions = /function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\(|=>\s*{/m.test(text);
    const hasClasses = /class\s+\w+/m.test(text);
    if (hasFunctions || hasClasses) {
      suggestedTools.push("code:analyze", "test:generate");
    }
    if (hasImports) {
      suggestedTools.push("code:refactor");
    }
    if (document.fileName.includes(".test.") || document.fileName.includes(".spec.")) {
      suggestedTools.push("test:run");
    }
    if (document.fileName.endsWith("package.json") || document.fileName.endsWith("tsconfig.json")) {
      suggestedTools.push("shell:run");
    }
    return {
      hasImports,
      hasFunctions,
      hasClasses,
      language,
      suggestedTools
    };
  }
  /**
   * 获取当前上下文推荐的工具
   */
  static getContextualSuggestions(document) {
    const analysis = this.analyzeCodeContext(document);
    const suggestions = [];
    for (const toolId of analysis.suggestedTools) {
      const tool = this.mcpTools.get(toolId);
      if (tool) {
        suggestions.push(tool);
      }
    }
    return suggestions;
  }
  /**
   * 清理资源
   */
  static dispose() {
    if (this.completionProvider) {
      this.completionProvider.dispose();
      this.completionProvider = null;
    }
    if (this.hoverProvider) {
      this.hoverProvider.dispose();
      this.hoverProvider = null;
    }
    this.mcpTools.clear();
    this.skillTools.clear();
  }
  // ============================================
  // 原有的代码编辑功能
  // ============================================
  /**
   * 分析文本的缩进信息
   */
  static analyzeIndent(text) {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { char: " ", size: 2, level: 0, raw: "" };
    }
    const indents = lines.map((line) => {
      var _a;
      return ((_a = line.match(/^[\t ]+/)) == null ? void 0 : _a[0]) || "";
    }).filter((indent) => indent.length > 0);
    if (indents.length === 0) {
      return { char: " ", size: 2, level: 0, raw: "" };
    }
    const usesTabs = indents.some((i) => i.includes("	"));
    const char = usesTabs ? "	" : " ";
    let size = 2;
    if (!usesTabs) {
      const spaces = indents.map((i) => i.length).filter((len) => len > 0);
      if (spaces.length > 1) {
        const diffs = [];
        const sorted = [...new Set(spaces)].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
          diffs.push(sorted[i] - sorted[i - 1]);
        }
        if (diffs.length > 0) {
          size = Math.min(...diffs.filter((d) => d > 0)) || 2;
        }
      } else if (spaces.length === 1) {
        size = spaces[0] <= 4 ? spaces[0] : 2;
      }
    } else {
      size = 1;
    }
    return { char, size, level: 0, raw: "" };
  }
  /**
   * 获取行的缩进信息
   */
  static getLineIndent(line, indentInfo) {
    const match = line.match(/^[\t ]*/);
    const raw = match ? match[0] : "";
    let level = 0;
    if (indentInfo.char === "	") {
      level = (raw.match(/\t/g) || []).length;
    } else {
      level = Math.floor(raw.length / indentInfo.size);
    }
    return { ...indentInfo, level, raw };
  }
  /**
   * 调整代码块的缩进
   */
  static adjustIndent(code, targetIndent) {
    var _a;
    const lines = code.split("\n");
    if (lines.length === 0)
      return code;
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
    if (nonEmptyLines.length === 0)
      return code;
    const baseIndent = ((_a = nonEmptyLines[0].match(/^[\t ]*/)) == null ? void 0 : _a[0]) || "";
    const baseLevel = this.getLineIndent(nonEmptyLines[0], targetIndent).level;
    const targetLevel = targetIndent.level;
    const levelDiff = targetLevel - baseLevel;
    return lines.map((line) => {
      var _a2;
      if (line.trim().length === 0) {
        return "";
      }
      const currentIndent = ((_a2 = line.match(/^[\t ]*/)) == null ? void 0 : _a2[0]) || "";
      const currentLevel = this.getLineIndent(line, targetIndent).level;
      const newLevel = Math.max(0, currentLevel + levelDiff);
      const newIndent = targetIndent.char.repeat(newLevel * targetIndent.size);
      return newIndent + line.trimStart();
    }).join("\n");
  }
  /**
   * 在文档中查找文本位置
   */
  static findTextPosition(document, searchText, startFrom = 0) {
    const fullText = document.getText();
    const index = fullText.indexOf(searchText, startFrom);
    if (index === -1)
      return null;
    const start = document.positionAt(index);
    const end = document.positionAt(index + searchText.length);
    return { start, end };
  }
  /**
   * 模糊匹配查找（忽略缩进差异）
   */
  static findTextFuzzy(document, searchText) {
    const fullText = document.getText();
    const searchLines = searchText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (searchLines.length === 0)
      return null;
    const fullLines = fullText.split("\n");
    for (let i = 0; i < fullLines.length; i++) {
      if (fullLines[i].trim() === searchLines[0]) {
        let allMatch = true;
        let endLine = i;
        for (let j = 1; j < searchLines.length; j++) {
          if (i + j >= fullLines.length || fullLines[i + j].trim() !== searchLines[j]) {
            allMatch = false;
            break;
          }
          endLine = i + j;
        }
        if (allMatch) {
          const start = new vscode23.Position(i, 0);
          const end = new vscode23.Position(endLine, fullLines[endLine].length);
          const matchedText = fullLines.slice(i, endLine + 1).join("\n");
          return { start, end, matchedText };
        }
      }
    }
    return null;
  }
  /**
   * 执行字符串替换（Claude Code 核心功能）
   */
  static async replaceText(document, oldText, newText, options = {}) {
    const editor = await vscode23.window.showTextDocument(document);
    let position = this.findTextPosition(document, oldText);
    if (!position && options.fuzzy) {
      const fuzzyResult = this.findTextFuzzy(document, oldText);
      if (fuzzyResult) {
        position = { start: fuzzyResult.start, end: fuzzyResult.end };
        if (options.adjustIndent) {
          const indentInfo = this.analyzeIndent(document.getText());
          const targetIndent = this.getLineIndent(
            document.lineAt(fuzzyResult.start.line).text,
            indentInfo
          );
          newText = this.adjustIndent(newText, targetIndent);
        }
      }
    }
    if (!position) {
      return false;
    }
    if (options.adjustIndent && !options.fuzzy) {
      const indentInfo = this.analyzeIndent(document.getText());
      const targetIndent = this.getLineIndent(
        document.lineAt(position.start.line).text,
        indentInfo
      );
      newText = this.adjustIndent(newText, targetIndent);
    }
    const range = new vscode23.Range(position.start, position.end);
    const success = await editor.edit((editBuilder) => {
      editBuilder.replace(range, newText);
    });
    if (success) {
      await document.save();
    }
    return success;
  }
  /**
   * 在锚点前后插入代码
   */
  static async insertNearAnchor(document, anchor, content, position, options = {}) {
    const editor = await vscode23.window.showTextDocument(document);
    const anchorPosition = this.findTextPosition(document, anchor);
    if (!anchorPosition)
      return false;
    const indentInfo = this.analyzeIndent(document.getText());
    const anchorLine = document.lineAt(anchorPosition.start.line);
    const targetIndent = this.getLineIndent(anchorLine.text, indentInfo);
    if (options.adjustIndent) {
      content = this.adjustIndent(content, targetIndent);
    }
    let insertPosition;
    let insertContent;
    if (position === "before") {
      insertPosition = new vscode23.Position(anchorPosition.start.line, 0);
      insertContent = content + "\n";
    } else {
      insertPosition = new vscode23.Position(anchorPosition.end.line + 1, 0);
      insertContent = content + "\n";
    }
    const success = await editor.edit((editBuilder) => {
      editBuilder.insert(insertPosition, insertContent);
    });
    if (success) {
      await document.save();
    }
    return success;
  }
  /**
   * 在指定行插入代码
   */
  static async insertAtLine(document, lineNumber, content, options = {}) {
    const editor = await vscode23.window.showTextDocument(document);
    const targetLine = Math.max(0, Math.min(lineNumber, document.lineCount));
    if (options.adjustIndent) {
      const refLine = Math.max(0, targetLine + (options.referenceLineOffset || -1));
      if (refLine < document.lineCount) {
        const indentInfo = this.analyzeIndent(document.getText());
        const targetIndent = this.getLineIndent(document.lineAt(refLine).text, indentInfo);
        content = this.adjustIndent(content, targetIndent);
      }
    }
    const insertPosition = new vscode23.Position(targetLine, 0);
    const success = await editor.edit((editBuilder) => {
      editBuilder.insert(insertPosition, content + "\n");
    });
    if (success) {
      await document.save();
    }
    return success;
  }
  /**
   * 删除指定文本
   */
  static async deleteText(document, targetText, options = {}) {
    const editor = await vscode23.window.showTextDocument(document);
    let position = this.findTextPosition(document, targetText);
    if (!position && options.fuzzy) {
      const fuzzyResult = this.findTextFuzzy(document, targetText);
      if (fuzzyResult) {
        position = { start: fuzzyResult.start, end: fuzzyResult.end };
      }
    }
    if (!position)
      return false;
    let range;
    if (options.deleteWholeLine) {
      range = new vscode23.Range(
        new vscode23.Position(position.start.line, 0),
        new vscode23.Position(position.end.line + 1, 0)
      );
    } else {
      range = new vscode23.Range(position.start, position.end);
    }
    const success = await editor.edit((editBuilder) => {
      editBuilder.delete(range);
    });
    if (success) {
      await document.save();
    }
    return success;
  }
  /**
   * 批量执行编辑操作
   */
  static async applyEdits(document, operations) {
    const failedOps = [];
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      let success = false;
      switch (op.type) {
        case "replace":
          success = await this.replaceText(document, op.oldText, op.newText, {
            fuzzy: true,
            adjustIndent: true
          });
          break;
        case "insert":
          success = await this.insertNearAnchor(document, op.anchor, op.content, op.position, {
            adjustIndent: true
          });
          break;
        case "insertAtLine":
          success = await this.insertAtLine(document, op.line, op.content, {
            adjustIndent: true
          });
          break;
        case "delete":
          success = await this.deleteText(document, op.target, {
            fuzzy: true,
            deleteWholeLine: true
          });
          break;
        case "wrap":
          success = await this.replaceText(
            document,
            op.target,
            op.before + op.target + op.after,
            { fuzzy: true }
          );
          break;
      }
      if (!success) {
        failedOps.push(i);
      }
    }
    return {
      success: failedOps.length === 0,
      failedOps
    };
  }
  /**
   * 从 AI 响应中提取代码并应用
   */
  static async applyCodeFromAI(targetDocument, aiResponse) {
    const operations = this.parseAIResponse(aiResponse);
    if (operations.length === 0) {
      return { success: false, message: "No code changes found in AI response" };
    }
    const result = await this.applyEdits(targetDocument, operations);
    if (result.success) {
      return { success: true, message: `Applied ${operations.length} changes successfully` };
    } else {
      return {
        success: false,
        message: `Failed to apply ${result.failedOps.length} of ${operations.length} changes`
      };
    }
  }
  /**
   * 解析 AI 响应中的代码操作
   */
  static parseAIResponse(response) {
    const operations = [];
    const diffMatch = response.match(/```(?:diff|patch)\n([\s\S]*?)```/g);
    if (diffMatch) {
      for (const diff of diffMatch) {
        const parsed = this.parseDiff(diff);
        operations.push(...parsed);
      }
    }
    const searchReplaceMatch = response.match(
      /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g
    );
    if (searchReplaceMatch) {
      for (const block of searchReplaceMatch) {
        const match = block.match(
          /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/
        );
        if (match) {
          operations.push({
            type: "replace",
            oldText: match[1],
            newText: match[2]
          });
        }
      }
    }
    return operations;
  }
  /**
   * 解析 diff 格式
   */
  static parseDiff(diff) {
    const operations = [];
    const lines = diff.split("\n");
    let oldLines = [];
    let newLines = [];
    let inHunk = false;
    for (const line of lines) {
      if (line.startsWith("@@")) {
        if (oldLines.length > 0 || newLines.length > 0) {
          operations.push({
            type: "replace",
            oldText: oldLines.join("\n"),
            newText: newLines.join("\n")
          });
        }
        oldLines = [];
        newLines = [];
        inHunk = true;
      } else if (inHunk) {
        if (line.startsWith("-")) {
          oldLines.push(line.slice(1));
        } else if (line.startsWith("+")) {
          newLines.push(line.slice(1));
        } else if (line.startsWith(" ")) {
          oldLines.push(line.slice(1));
          newLines.push(line.slice(1));
        }
      }
    }
    if (oldLines.length > 0 || newLines.length > 0) {
      operations.push({
        type: "replace",
        oldText: oldLines.join("\n"),
        newText: newLines.join("\n")
      });
    }
    return operations;
  }
};
// ============================================
// MCP 工具注册表（用于智能提示）
// ============================================
SmartCodeEditor.mcpTools = /* @__PURE__ */ new Map();
SmartCodeEditor.skillTools = /* @__PURE__ */ new Map();
SmartCodeEditor.completionProvider = null;
SmartCodeEditor.hoverProvider = null;

// src/extension/code-editor/CodeApplier.ts
var vscode24 = __toESM(require("vscode"));
var CodeApplier = class {
  constructor() {
    this.pendingChanges = /* @__PURE__ */ new Map();
  }
  /**
   * 从 AI 响应解析代码变更
   */
  parseCodeChanges(response, targetFile) {
    const changes = [];
    const fileCodeBlocks = response.matchAll(
      /```(\w+):([^\n]+)\n([\s\S]*?)```/g
    );
    for (const match of fileCodeBlocks) {
      const [, language, filePath, code] = match;
      changes.push({
        filePath: filePath.trim(),
        original: "",
        modified: code.trim(),
        operations: [{ type: "replace", oldText: "", newText: code.trim() }]
      });
    }
    const searchReplaceBlocks = response.matchAll(
      /(?:File:\s*([^\n]+)\n)?<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g
    );
    for (const match of searchReplaceBlocks) {
      const [, filePath, oldCode, newCode] = match;
      const path11 = (filePath == null ? void 0 : filePath.trim()) || targetFile || "";
      const existing = changes.find((c) => c.filePath === path11);
      if (existing) {
        existing.operations.push({
          type: "replace",
          oldText: oldCode,
          newText: newCode
        });
      } else {
        changes.push({
          filePath: path11,
          original: oldCode,
          modified: newCode,
          operations: [{ type: "replace", oldText: oldCode, newText: newCode }]
        });
      }
    }
    if (changes.length === 0 && targetFile) {
      const codeBlock = response.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeBlock) {
        changes.push({
          filePath: targetFile,
          original: "",
          modified: codeBlock[1].trim(),
          operations: []
        });
      }
    }
    return changes;
  }
  /**
   * 显示差异预览
   */
  async showDiffPreview(change) {
    const uri = vscode24.Uri.parse(`ai-diff:${change.filePath}`);
    const originalUri = vscode24.Uri.parse(`ai-original:${change.filePath}`);
    const modifiedUri = vscode24.Uri.parse(`ai-modified:${change.filePath}`);
    await vscode24.commands.executeCommand(
      "vscode.diff",
      originalUri,
      modifiedUri,
      `AI Changes: ${change.filePath}`
    );
  }
  /**
   * 应用代码变更到文件
   */
  async applyChanges(changes, options = {}) {
    var _a, _b;
    const messages = [];
    let applied = 0;
    let failed = 0;
    for (const change of changes) {
      try {
        let document;
        const workspaceRoot = (_b = (_a = vscode24.workspace.workspaceFolders) == null ? void 0 : _a[0]) == null ? void 0 : _b.uri.fsPath;
        const fullPath = change.filePath.startsWith("/") ? change.filePath : `${workspaceRoot}/${change.filePath}`;
        const uri = vscode24.Uri.file(fullPath);
        try {
          document = await vscode24.workspace.openTextDocument(uri);
        } catch {
          if (change.modified) {
            await vscode24.workspace.fs.writeFile(
              uri,
              Buffer.from(change.modified, "utf-8")
            );
            messages.push(`Created: ${change.filePath}`);
            applied++;
            continue;
          } else {
            throw new Error(`File not found: ${change.filePath}`);
          }
        }
        if (change.operations.length > 0) {
          const result = await SmartCodeEditor.applyEdits(document, change.operations);
          if (result.success) {
            messages.push(`Applied ${change.operations.length} changes to ${change.filePath}`);
            applied++;
          } else {
            messages.push(`Failed to apply some changes to ${change.filePath}`);
            failed++;
          }
        } else if (change.modified) {
          const editor = await vscode24.window.showTextDocument(document);
          const fullRange = new vscode24.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );
          await editor.edit((editBuilder) => {
            editBuilder.replace(fullRange, change.modified);
          });
          if (options.autoSave) {
            await document.save();
          }
          messages.push(`Updated: ${change.filePath}`);
          applied++;
        }
      } catch (error) {
        messages.push(`Error: ${change.filePath} - ${error instanceof Error ? error.message : "Unknown error"}`);
        failed++;
      }
    }
    return { success: failed === 0, applied, failed, messages };
  }
  /**
   * 智能插入代码片段
   * 自动检测最佳插入位置并调整缩进
   */
  async smartInsert(document, code, hint) {
    const editor = await vscode24.window.showTextDocument(document);
    const selection = editor.selection;
    if (!selection.isEmpty) {
      const indentInfo2 = SmartCodeEditor.analyzeIndent(document.getText());
      const targetIndent2 = SmartCodeEditor.getLineIndent(
        document.lineAt(selection.start.line).text,
        indentInfo2
      );
      const adjustedCode2 = SmartCodeEditor.adjustIndent(code, targetIndent2);
      const success2 = await editor.edit((editBuilder) => {
        editBuilder.replace(selection, adjustedCode2);
      });
      return {
        success: success2,
        message: success2 ? "Code inserted at selection" : "Failed to insert code"
      };
    }
    if (hint) {
      const position = SmartCodeEditor.findTextPosition(document, hint);
      if (position) {
        const indentInfo2 = SmartCodeEditor.analyzeIndent(document.getText());
        const targetIndent2 = SmartCodeEditor.getLineIndent(
          document.lineAt(position.start.line).text,
          indentInfo2
        );
        const adjustedCode2 = SmartCodeEditor.adjustIndent(code, targetIndent2);
        const insertPosition = new vscode24.Position(position.end.line + 1, 0);
        const success2 = await editor.edit((editBuilder) => {
          editBuilder.insert(insertPosition, adjustedCode2 + "\n");
        });
        return {
          success: success2,
          message: success2 ? `Code inserted after "${hint.slice(0, 30)}..."` : "Failed to insert code"
        };
      }
    }
    const cursorPosition = selection.active;
    const indentInfo = SmartCodeEditor.analyzeIndent(document.getText());
    const targetIndent = SmartCodeEditor.getLineIndent(
      document.lineAt(cursorPosition.line).text,
      indentInfo
    );
    const adjustedCode = SmartCodeEditor.adjustIndent(code, targetIndent);
    const success = await editor.edit((editBuilder) => {
      editBuilder.insert(cursorPosition, adjustedCode);
    });
    return {
      success,
      message: success ? "Code inserted at cursor" : "Failed to insert code"
    };
  }
  /**
   * 格式化并应用代码
   */
  async formatAndApply(document, code) {
    const result = await this.smartInsert(document, code);
    if (result.success) {
      try {
        await vscode24.commands.executeCommand("editor.action.formatDocument");
      } catch {
      }
      await document.save();
    }
    return result.success;
  }
  /**
   * 交互式代码应用
   * 显示预览并让用户确认
   */
  async interactiveApply(response, targetFile) {
    const changes = this.parseCodeChanges(response, targetFile);
    if (changes.length === 0) {
      return { success: false, message: "No code changes found" };
    }
    const items = changes.map((change, index) => ({
      label: change.filePath || `Change ${index + 1}`,
      description: `${change.operations.length} operations`,
      detail: change.modified.slice(0, 100) + "...",
      change,
      picked: true
    }));
    const selected = await vscode24.window.showQuickPick(items, {
      canPickMany: true,
      placeHolder: "Select changes to apply"
    });
    if (!selected || selected.length === 0) {
      return { success: false, message: "No changes selected" };
    }
    const result = await this.applyChanges(
      selected.map((s) => s.change),
      { autoSave: true }
    );
    return {
      success: result.success,
      message: `Applied ${result.applied} changes, ${result.failed} failed`
    };
  }
};
var DiffContentProvider = class {
  constructor() {
    this.contents = /* @__PURE__ */ new Map();
  }
  setContent(uri, content) {
    this.contents.set(uri, content);
  }
  provideTextDocumentContent(uri) {
    return this.contents.get(uri.toString()) || "";
  }
};

// src/extension/services/NewFeaturesService.ts
var vscode25 = __toESM(require("vscode"));
var _NewFeaturesService = class _NewFeaturesService {
  constructor(context) {
    this.context = context;
    i18n.initialize(context);
  }
  static getInstance(context) {
    if (!_NewFeaturesService.instance) {
      _NewFeaturesService.instance = new _NewFeaturesService(context);
    }
    return _NewFeaturesService.instance;
  }
  // ============ 语言配置功能 ============
  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    return i18n.getCurrentLanguage();
  }
  /**
   * 设置语言
   */
  async setLanguage(language) {
    await i18n.setLanguage(language);
    vscode25.window.showInformationMessage(
      language === "zh-CN" ? "\u2705 \u8BED\u8A00\u5DF2\u5207\u6362\u4E3A\u4E2D\u6587" : "\u2705 Language switched to English"
    );
  }
  /**
   * 显示语言选择器
   */
  async showLanguageSelector() {
    const languages4 = SUPPORTED_LANGUAGES;
    const currentLanguage = i18n.getCurrentLanguage();
    const items = languages4.map((lang) => ({
      label: `${lang.code === currentLanguage ? "$(check) " : ""}${lang.nativeName}`,
      description: lang.name,
      code: lang.code
    }));
    const selected = await vscode25.window.showQuickPick(items, {
      placeHolder: t("chat", "selectProvider")
    });
    if (selected) {
      await this.setLanguage(selected.code);
    }
  }
  /**
   * 获取 AI 系统提示（含语言指示）
   */
  getAISystemPrompt(type = "general") {
    return i18n.getFullAIPrompt(type);
  }
  /**
   * 获取翻译文本
   */
  translate(category, key) {
    return t(category, key);
  }
};
_NewFeaturesService.instance = null;
var NewFeaturesService = _NewFeaturesService;
function registerNewFeaturesCommands(context, service) {
  context.subscriptions.push(
    vscode25.commands.registerCommand("aiAssistant.setLanguage", () => {
      service.showLanguageSelector();
    })
  );
}
function getNewFeaturesService(context) {
  return NewFeaturesService.getInstance(context);
}

// src/extension.ts
init_mcp();
var chatViewProvider;
var mcpPanelProvider;
var codeApplier;
var diffProvider;
function activate(context) {
  console.log("AI Code Assistant Lite is now active!");
  chatViewProvider = new ChatViewProvider(context.extensionUri, context);
  mcpPanelProvider = MCPPanelProvider.getInstance(context.extensionUri, context);
  const configManager = new ConfigManager(context);
  codeApplier = new CodeApplier();
  diffProvider = new DiffContentProvider();
  SmartCodeEditor.initialize(context);
  console.log("SmartCodeEditor initialized with @mcp and @skill completions");
  const newFeaturesService = getNewFeaturesService(context);
  registerNewFeaturesCommands(context, newFeaturesService);
  console.log("New Features Service initialized");
  context.subscriptions.push(
    vscode26.workspace.registerTextDocumentContentProvider("ai-original", diffProvider),
    vscode26.workspace.registerTextDocumentContentProvider("ai-modified", diffProvider)
  );
  context.subscriptions.push(
    vscode26.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatViewProvider),
    vscode26.window.registerWebviewViewProvider(MCPPanelProvider.viewType, mcpPanelProvider)
  );
  const commands8 = [
    // Chat commands
    { id: "aiAssistant.newChat", handler: () => chatViewProvider.newChat() },
    { id: "aiAssistant.clearChat", handler: () => chatViewProvider.newChat() },
    { id: "aiAssistant.stopTask", handler: () => chatViewProvider.stopTask() },
    { id: "aiAssistant.compactContext", handler: () => vscode26.commands.executeCommand("aiAssistant.chatView.focus") },
    // Session commands
    { id: "aiAssistant.continueLastSession", handler: () => chatViewProvider.continueLastSession() },
    { id: "aiAssistant.resumeSession", handler: () => chatViewProvider.showSessionPicker() },
    // ✅ 清空所有历史数据命令
    {
      id: "aiAssistant.clearAllData",
      handler: async () => {
        const confirm = await vscode26.window.showWarningMessage(
          "\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u5386\u53F2\u6570\u636E\u5417\uFF1F\u8FD9\u5C06\u5220\u9664\u6240\u6709\u4F1A\u8BDD\u8BB0\u5F55\u3001\u56FE\u8868\u5386\u53F2\u548C\u6D4B\u8BD5\u5386\u53F2\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002",
          { modal: true },
          "\u786E\u8BA4\u6E05\u7A7A"
        );
        if (confirm === "\u786E\u8BA4\u6E05\u7A7A") {
          const keysToClean = [
            "aiAssistant.sessions",
            "aiAssistant.currentSessionId",
            "diagramHistory",
            "testHistory",
            "aiAssistant.memory.v2"
          ];
          for (const key of keysToClean) {
            await context.globalState.update(key, void 0);
          }
          chatViewProvider.clearAllDataAndReset();
          vscode26.window.showInformationMessage("\u5DF2\u6E05\u7A7A\u6240\u6709\u5386\u53F2\u6570\u636E");
        }
      }
    },
    // Focus command
    { id: "aiAssistant.focus", handler: () => vscode26.commands.executeCommand("aiAssistant.chatView.focus") },
    // API Key configuration
    {
      id: "aiAssistant.setApiKey",
      handler: async () => {
        const providers = ["deepseek", "openai", "anthropic", "kimi", "openrouter"];
        const selected = await vscode26.window.showQuickPick(providers, {
          placeHolder: "Select AI provider"
        });
        if (!selected)
          return;
        const apiKey = await vscode26.window.showInputBox({
          prompt: `Enter API Key for ${selected}`,
          password: true,
          placeHolder: "sk-..."
        });
        if (apiKey) {
          await configManager.setApiKey(selected, apiKey);
          vscode26.window.showInformationMessage(`API Key for ${selected} has been saved`);
        }
      }
    },
    // Model switching
    {
      id: "aiAssistant.switchModel",
      handler: async () => {
        const allModels = configManager.getAllModels();
        const items = [];
        for (const [provider, models] of Object.entries(allModels)) {
          for (const model of models) {
            items.push({
              label: model.name,
              description: provider,
              detail: model.supportVision ? "\u{1F441} Supports vision" : void 0
            });
          }
        }
        const selected = await vscode26.window.showQuickPick(items, {
          placeHolder: "Select a model"
        });
        if (selected) {
          const provider = selected.description;
          const models = allModels[provider];
          const model = models.find((m) => m.name === selected.label);
          if (model) {
            await configManager.updateModelConfig({ provider, model: model.id });
            vscode26.window.showInformationMessage(`Switched to ${model.name}`);
          }
        }
      }
    },
    // ==================== 智能代码编辑命令 ====================
    // 应用 AI 生成的代码（核心功能）
    {
      id: "aiAssistant.applyCode",
      handler: async () => {
        const editor = vscode26.window.activeTextEditor;
        if (!editor) {
          vscode26.window.showWarningMessage("No active editor");
          return;
        }
        const clipboardText = await vscode26.env.clipboard.readText();
        if (!clipboardText) {
          vscode26.window.showWarningMessage("Clipboard is empty");
          return;
        }
        const result = await codeApplier.smartInsert(editor.document, clipboardText);
        if (result.success) {
          vscode26.window.showInformationMessage(result.message);
        } else {
          vscode26.window.showErrorMessage(result.message);
        }
      }
    },
    // 智能替换选中代码
    {
      id: "aiAssistant.smartReplace",
      handler: async () => {
        const editor = vscode26.window.activeTextEditor;
        if (!editor) {
          vscode26.window.showWarningMessage("No active editor");
          return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (!selectedText) {
          vscode26.window.showWarningMessage("No text selected");
          return;
        }
        const newCode = await vscode26.window.showInputBox({
          prompt: "Enter replacement code or paste from clipboard",
          value: await vscode26.env.clipboard.readText()
        });
        if (newCode) {
          const success = await SmartCodeEditor.replaceText(
            editor.document,
            selectedText,
            newCode,
            { adjustIndent: true }
          );
          if (success) {
            vscode26.window.showInformationMessage("Code replaced successfully");
          } else {
            vscode26.window.showErrorMessage("Failed to replace code");
          }
        }
      }
    },
    // 在锚点后插入代码
    {
      id: "aiAssistant.insertAfter",
      handler: async () => {
        const editor = vscode26.window.activeTextEditor;
        if (!editor)
          return;
        const anchor = await vscode26.window.showInputBox({
          prompt: "Enter the text after which to insert code"
        });
        if (!anchor)
          return;
        const code = await vscode26.env.clipboard.readText();
        if (!code) {
          vscode26.window.showWarningMessage("Clipboard is empty");
          return;
        }
        const success = await SmartCodeEditor.insertNearAnchor(
          editor.document,
          anchor,
          code,
          "after",
          { adjustIndent: true }
        );
        if (success) {
          vscode26.window.showInformationMessage("Code inserted successfully");
        } else {
          vscode26.window.showErrorMessage(`Could not find anchor text: "${anchor}"`);
        }
      }
    },
    // Code actions with AI
    {
      id: "aiAssistant.explainCode",
      handler: () => sendSelectedCodeWithAction("explain", "Explain this code in detail:")
    },
    {
      id: "aiAssistant.refactorCode",
      handler: () => sendSelectedCodeWithAction("refactor", "Refactor this code. Use SEARCH/REPLACE format:")
    },
    {
      id: "aiAssistant.fixCode",
      handler: () => sendSelectedCodeWithAction("fix", "Find and fix bugs. Use SEARCH/REPLACE format:")
    },
    {
      id: "aiAssistant.addComments",
      handler: () => sendSelectedCodeWithAction("comment", "Add comments. Use SEARCH/REPLACE format:")
    },
    {
      id: "aiAssistant.optimizeCode",
      handler: () => sendSelectedCodeWithAction("optimize", "Optimize this code. Use SEARCH/REPLACE format:")
    },
    {
      id: "aiAssistant.reviewCode",
      handler: () => sendSelectedCodeWithAction("review", "Review this code for issues and improvements:")
    },
    {
      id: "aiAssistant.generateTests",
      handler: () => sendSelectedCodeWithAction("test", "Generate tests for this code:")
    },
    // Generate diagram
    {
      id: "aiAssistant.generateDiagram",
      handler: async () => {
        const editor = vscode26.window.activeTextEditor;
        const hasSelection = editor && !editor.selection.isEmpty;
        const types = [];
        if (hasSelection) {
          types.push({
            label: "\u{1F4CA} \u6D41\u7A0B\u56FE (Flowchart)",
            description: "\u6839\u636E\u9009\u4E2D\u4EE3\u7801",
            detail: "\u5C55\u793A\u9009\u4E2D\u4EE3\u7801\u7684\u6267\u884C\u6D41\u7A0B"
          });
          types.push({
            label: "\u23F1\uFE0F \u65F6\u5E8F\u56FE (Sequence)",
            description: "\u6839\u636E\u9009\u4E2D\u4EE3\u7801",
            detail: "\u5C55\u793A\u9009\u4E2D\u4EE3\u7801\u4E2D\u7684\u8C03\u7528\u987A\u5E8F"
          });
          types.push({
            label: "\u{1F3DB}\uFE0F \u7C7B\u56FE (Class Diagram)",
            description: "\u6839\u636E\u9009\u4E2D\u4EE3\u7801",
            detail: "\u5C55\u793A\u9009\u4E2D\u4EE3\u7801\u4E2D\u7684\u7C7B\u7ED3\u6784"
          });
          types.push({
            label: "\u{1F504} \u72B6\u6001\u56FE (State Diagram)",
            description: "\u6839\u636E\u9009\u4E2D\u4EE3\u7801",
            detail: "\u5C55\u793A\u9009\u4E2D\u4EE3\u7801\u4E2D\u7684\u72B6\u6001\u8F6C\u6362"
          });
        }
        if (editor) {
          types.push({
            label: "\u{1F4C1} \u6839\u636E\u5F53\u524D\u6587\u4EF6\u751F\u6210",
            description: editor.document.fileName.split(/[/\\]/).pop(),
            detail: "\u5206\u6790\u5F53\u524D\u6253\u5F00\u7684\u6587\u4EF6"
          });
        }
        types.push({
          label: "\u{1F3D7}\uFE0F \u6839\u636E\u9879\u76EE\u7ED3\u6784\u751F\u6210",
          description: "\u67B6\u6784\u56FE",
          detail: "\u751F\u6210\u9879\u76EE\u6574\u4F53\u67B6\u6784\u56FE"
        });
        types.push({
          label: "\u{1F517} ER\u56FE (ER Diagram)",
          description: "\u6570\u636E\u5E93\u8868\u5173\u7CFB",
          detail: "\u5C55\u793A\u6570\u636E\u5E93\u8868\u5173\u7CFB"
        });
        types.push({
          label: "\u{1F4C5} \u7518\u7279\u56FE (Gantt)",
          description: "\u9879\u76EE\u65F6\u95F4\u7EBF",
          detail: "\u5C55\u793A\u9879\u76EE\u65F6\u95F4\u7EBF"
        });
        types.push({
          label: "\u{1F9E0} \u601D\u7EF4\u5BFC\u56FE (Mind Map)",
          description: "\u6982\u5FF5\u5C42\u7EA7",
          detail: "\u5C55\u793A\u6982\u5FF5\u5C42\u7EA7"
        });
        const selected = await vscode26.window.showQuickPick(types, {
          placeHolder: hasSelection ? "\u9009\u62E9\u56FE\u8868\u7C7B\u578B\uFF08\u5C06\u5206\u6790\u9009\u4E2D\u7684\u4EE3\u7801\uFF09" : "\u9009\u62E9\u56FE\u8868\u7C7B\u578B",
          matchOnDescription: true,
          matchOnDetail: true
        });
        if (!selected)
          return;
        await vscode26.commands.executeCommand("aiAssistant.chatView.focus");
        await new Promise((resolve2) => setTimeout(resolve2, 200));
        const label = selected.label;
        if (label.includes("\u6839\u636E\u5F53\u524D\u6587\u4EF6")) {
          chatViewProvider.sendMessage("/diagram file");
        } else if (label.includes("\u6839\u636E\u9879\u76EE\u7ED3\u6784")) {
          chatViewProvider.sendMessage("/diagram project");
        } else if (hasSelection && editor) {
          const selectedText = editor.document.getText(editor.selection);
          const language = editor.document.languageId;
          let diagramType = "flowchart";
          if (label.includes("\u65F6\u5E8F\u56FE"))
            diagramType = "sequence";
          else if (label.includes("\u7C7B\u56FE"))
            diagramType = "class";
          else if (label.includes("\u72B6\u6001\u56FE"))
            diagramType = "state";
          else if (label.includes("ER\u56FE"))
            diagramType = "er";
          else if (label.includes("\u7518\u7279\u56FE"))
            diagramType = "gantt";
          else if (label.includes("\u601D\u7EF4\u5BFC\u56FE"))
            diagramType = "mindmap";
          chatViewProvider.sendMessage(`/diagram ${diagramType} code:
\`\`\`${language}
${selectedText}
\`\`\``);
        } else {
          let diagramType = "flowchart";
          if (label.includes("ER\u56FE"))
            diagramType = "er";
          else if (label.includes("\u7518\u7279\u56FE"))
            diagramType = "gantt";
          else if (label.includes("\u601D\u7EF4\u5BFC\u56FE"))
            diagramType = "mindmap";
          const description = await vscode26.window.showInputBox({
            prompt: "\u8BF7\u8F93\u5165\u7B80\u5355\u63CF\u8FF0",
            placeHolder: "\u4F8B\u5982\uFF1A\u7528\u6237\u767B\u5F55\u6D41\u7A0B\u3001\u9879\u76EE\u6A21\u5757\u5173\u7CFB"
          });
          if (description) {
            chatViewProvider.sendMessage(`/diagram ${diagramType} ${description}`);
          }
        }
      }
    },
    // Test generation
    {
      id: "aiAssistant.generateTestFile",
      handler: async () => {
        const editor = vscode26.window.activeTextEditor;
        if (!editor) {
          vscode26.window.showWarningMessage("No active editor");
          return;
        }
        await vscode26.commands.executeCommand("aiAssistant.chatView.focus");
      }
    },
    // Test generation via MCP tool (triggers actual TestHandler)
    {
      id: "aiAssistant.triggerTestGeneration",
      handler: async (filePath) => {
        var _a;
        const targetPath = filePath || ((_a = vscode26.window.activeTextEditor) == null ? void 0 : _a.document.uri.fsPath);
        if (!targetPath) {
          vscode26.window.showWarningMessage("\u8BF7\u5148\u6253\u5F00\u6216\u9009\u62E9\u4E00\u4E2A\u6587\u4EF6");
          return;
        }
        await vscode26.commands.executeCommand("aiAssistant.chatView.focus");
        chatViewProvider.sendMessage(`/gentest ${targetPath}`);
      }
    },
    // Open settings
    {
      id: "aiAssistant.openSettings",
      handler: () => {
        vscode26.commands.executeCommand("workbench.action.openSettings", "aiAssistant");
      }
    },
    // ==================== MCP相关命令 ====================
    // 打开MCP工具管理面板
    {
      id: "aiAssistant.openMcpPanel",
      handler: async () => {
        try {
          await vscode26.commands.executeCommand("aiAssistant.mcpPanel.focus");
        } catch (error) {
          vscode26.window.showInformationMessage(
            "\u8BF7\u5728\u4FA7\u8FB9\u680FAI Assistant\u4E2D\u67E5\u770BMCP\u5DE5\u5177\u9762\u677F"
          );
        }
      }
    },
    // MCP工具快速执行
    {
      id: "aiAssistant.mcpExecute",
      handler: async () => {
        const { MCPRegistry: MCPRegistry2 } = await Promise.resolve().then(() => (init_mcp(), mcp_exports));
        const registry = MCPRegistry2.getInstance(context);
        const tools = registry.getEnabledTools();
        if (tools.length === 0) {
          vscode26.window.showWarningMessage("\u6CA1\u6709\u53EF\u7528\u7684MCP\u5DE5\u5177");
          return;
        }
        const items = tools.map((t2) => ({
          label: `$(tools) ${t2.tool.name}`,
          description: `@mcp:${t2.tool.id}`,
          detail: t2.tool.description,
          toolId: t2.tool.id
        }));
        const selected = await vscode26.window.showQuickPick(items, {
          placeHolder: "\u9009\u62E9\u8981\u6267\u884C\u7684MCP\u5DE5\u5177",
          matchOnDescription: true,
          matchOnDetail: true
        });
        if (selected) {
          await vscode26.commands.executeCommand("aiAssistant.chatView.focus");
          await new Promise((resolve2) => setTimeout(resolve2, 200));
          chatViewProvider.sendMessage(`@mcp:${selected.toolId}`);
        }
      }
    },
    // MCP Agent模式
    {
      id: "aiAssistant.mcpAgent",
      handler: async () => {
        const task = await vscode26.window.showInputBox({
          prompt: "\u63CF\u8FF0\u4F60\u60F3\u8BA9AI Agent\u5B8C\u6210\u7684\u4EFB\u52A1",
          placeHolder: "\u4F8B\u5982\uFF1A\u5206\u6790\u5F53\u524D\u9879\u76EE\u7684\u4EE3\u7801\u7ED3\u6784\u5E76\u751F\u6210\u6587\u6863",
          ignoreFocusOut: true
        });
        if (task) {
          await vscode26.commands.executeCommand("aiAssistant.chatView.focus");
          await new Promise((resolve2) => setTimeout(resolve2, 200));
          chatViewProvider.sendMessage(`@mcp:agent ${task}`);
        }
      }
    }
  ];
  for (const cmd of commands8) {
    context.subscriptions.push(vscode26.commands.registerCommand(cmd.id, cmd.handler));
  }
  async function sendSelectedCodeWithAction(action, prompt) {
    const editor = vscode26.window.activeTextEditor;
    if (!editor) {
      vscode26.window.showWarningMessage("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u6587\u4EF6\u5E76\u9009\u62E9\u4EE3\u7801");
      return;
    }
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText) {
      vscode26.window.showWarningMessage("\u8BF7\u5148\u9009\u62E9\u9700\u8981\u5904\u7406\u7684\u4EE3\u7801");
      return;
    }
    const language = editor.document.languageId;
    const filePath = editor.document.uri.fsPath;
    const fileName = filePath.split(/[/\\]/).pop() || "";
    const actionLabels = {
      "explain": "\u89E3\u91CA\u4EE3\u7801",
      "fix": "\u4FEE\u590D\u4EE3\u7801",
      "optimize": "\u4F18\u5316\u4EE3\u7801",
      "comment": "\u6DFB\u52A0\u6CE8\u91CA",
      "review": "\u4EE3\u7801\u5BA1\u67E5",
      "refactor": "\u91CD\u6784\u4EE3\u7801",
      "test": "\u751F\u6210\u6D4B\u8BD5",
      "clearAllData": "\u6E05\u7A7A\u6240\u6709\u6570\u636E"
    };
    const displayLabel = actionLabels[action] || action;
    const systemContext = {
      action,
      prompt,
      fileName,
      language,
      code: selectedText,
      useSearchReplace: !["explain", "test", "review", "clearAllData"].includes(action)
    };
    await vscode26.commands.executeCommand("aiAssistant.chatView.focus");
    await new Promise((resolve2) => setTimeout(resolve2, 200));
    chatViewProvider.sendMessageWithContext(displayLabel, systemContext);
    vscode26.window.showInformationMessage(`\u6B63\u5728${displayLabel}...`);
  }
  const args = process.argv;
  if (args.includes("-c") || args.includes("--continue")) {
    chatViewProvider.continueLastSession();
  } else if (args.includes("-r") || args.includes("--resume")) {
    chatViewProvider.showSessionPicker();
  }
  const statusBarItem = vscode26.window.createStatusBarItem(vscode26.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(comment-discussion) AI";
  statusBarItem.tooltip = "AI Code Assistant Lite";
  statusBarItem.command = "aiAssistant.focus";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(
    vscode26.languages.registerCodeActionsProvider(
      { pattern: "**/*" },
      new AICodeActionProvider(),
      { providedCodeActionKinds: AICodeActionProvider.providedCodeActionKinds }
    )
  );
}
var AICodeActionProvider = class {
  provideCodeActions(document, range) {
    if (range.isEmpty)
      return [];
    const actions = [];
    const fixAction = new vscode26.CodeAction("\u{1F916} AI Fix", vscode26.CodeActionKind.QuickFix);
    fixAction.command = { command: "aiAssistant.fixCode", title: "AI Fix" };
    actions.push(fixAction);
    const refactorAction = new vscode26.CodeAction("\u{1F916} AI Refactor", vscode26.CodeActionKind.Refactor);
    refactorAction.command = { command: "aiAssistant.refactorCode", title: "AI Refactor" };
    actions.push(refactorAction);
    const explainAction = new vscode26.CodeAction("\u{1F916} AI Explain", vscode26.CodeActionKind.Empty);
    explainAction.command = { command: "aiAssistant.explainCode", title: "AI Explain" };
    actions.push(explainAction);
    const commentAction = new vscode26.CodeAction("\u{1F916} AI Add Comments", vscode26.CodeActionKind.Refactor);
    commentAction.command = { command: "aiAssistant.addComments", title: "AI Add Comments" };
    actions.push(commentAction);
    const clearAction = new vscode26.CodeAction("\u{1F916} AI Clear All Data", vscode26.CodeActionKind.Refactor);
    clearAction.command = { command: "aiAssistant.clearAllData", title: "AI Clear All Data" };
    actions.push(clearAction);
    return actions;
  }
};
AICodeActionProvider.providedCodeActionKinds = [
  vscode26.CodeActionKind.QuickFix,
  vscode26.CodeActionKind.Refactor,
  vscode26.CodeActionKind.Empty
];
function deactivate() {
  SmartCodeEditor.dispose();
  console.log("AI Code Assistant Lite deactivated");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
