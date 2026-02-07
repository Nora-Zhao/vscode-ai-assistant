const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * 复制目录（递归）
 * 用于将 builtin-packages 和 templates 等非JS资源复制到 dist/resources/
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 复制 skill 资源文件到 dist/resources/
 */
function copySkillResources() {
  const resourceMappings = [
    {
      src: './src/extension/skills/builtin-packages',
      dest: './dist/resources/builtin-packages',
    },
    {
      src: './src/extension/skills/templates',
      dest: './dist/resources/templates',
    },
  ];
  for (const { src, dest } of resourceMappings) {
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true });
    }
    copyDirSync(src, dest);
  }
  console.log('Skill resources copied to dist/resources/');
}

// Extension build config
const extensionConfig = {
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  outfile: './dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node16',
  sourcemap: !production,
  minify: production,
};

// Webview build config
const webviewConfig = {
  entryPoints: ['./src/webview/index.tsx'],
  bundle: true,
  outfile: './dist/webview.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: !production,
  minify: production,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'css',
  },
  define: {
    'process.env.NODE_ENV': production ? '"production"' : '"development"',
  },
};

// CSS build config
const cssConfig = {
  entryPoints: ['./src/webview/styles/main.css'],
  bundle: true,
  outfile: './dist/webview.css',
  minify: production,
};

async function build() {
  try {
    // Always copy skill resources first
    copySkillResources();

    if (watch) {
      // Watch mode
      const extCtx = await esbuild.context(extensionConfig);
      const webCtx = await esbuild.context(webviewConfig);
      const cssCtx = await esbuild.context(cssConfig);
      
      await Promise.all([
        extCtx.watch(),
        webCtx.watch(),
        cssCtx.watch(),
      ]);
      
      console.log('Watching for changes...');
    } else {
      // Build once
      await Promise.all([
        esbuild.build(extensionConfig),
        esbuild.build(webviewConfig),
        esbuild.build(cssConfig),
      ]);
      
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
