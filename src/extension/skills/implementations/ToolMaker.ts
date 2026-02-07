import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BaseSkill } from '../BaseSkill';
import { ProjectContext, SkillParams, SkillResult, SkillProgressReporter, SupportedLanguage } from '../interfaces';

/**
 * 工具类型
 */
type ToolType = 
  | 'batch_rename'      // 批量重命名
  | 'log_analyzer'      // 日志分析
  | 'image_processor'   // 图片处理
  | 'file_organizer'    // 文件整理
  | 'data_converter'    // 数据转换
  | 'backup_tool'       // 备份工具
  | 'text_processor'    // 文本处理
  | 'api_tester'        // API测试
  | 'port_scanner'      // 端口扫描
  | 'system_monitor'    // 系统监控
  | 'custom';           // 自定义工具

/**
 * 工具配置
 */
interface ToolConfig {
  name: string;
  description: string;
  language: 'python' | 'bash' | 'node';
  template: string;
  dependencies?: string[];
}

/**
 * 小工具制作技能
 * 制作本地CLI/小脚本并直接在终端运行
 */
export class ToolMakerSkill extends BaseSkill {
  readonly id = 'tool-maker';
  readonly name = '小工具制作器';
  readonly description = '制作本地CLI/小脚本(批量重命名、日志分析、图片压缩等)并直接在终端运行';
  readonly category = 'builder' as const;

  private toolTemplates: Record<ToolType, ToolConfig> = {
    batch_rename: {
      name: '批量重命名工具',
      description: '批量重命名文件,支持正则替换、序号添加、日期添加等',
      language: 'python',
      dependencies: [],
      template: this.getBatchRenameTemplate(),
    },
    log_analyzer: {
      name: '日志分析工具',
      description: '分析日志文件,提取错误、统计频率、生成报告',
      language: 'python',
      dependencies: [],
      template: this.getLogAnalyzerTemplate(),
    },
    image_processor: {
      name: '图片批处理工具',
      description: '批量压缩、调整尺寸、添加水印、格式转换',
      language: 'python',
      dependencies: ['Pillow'],
      template: this.getImageProcessorTemplate(),
    },
    file_organizer: {
      name: '文件整理工具',
      description: '按类型/日期/大小自动整理文件',
      language: 'python',
      dependencies: [],
      template: this.getFileOrganizerTemplate(),
    },
    data_converter: {
      name: '数据格式转换工具',
      description: 'JSON/CSV/XML/YAML互转',
      language: 'python',
      dependencies: ['PyYAML'],
      template: this.getDataConverterTemplate(),
    },
    backup_tool: {
      name: '文件备份工具',
      description: '定时备份、增量备份、压缩归档',
      language: 'python',
      dependencies: [],
      template: this.getBackupToolTemplate(),
    },
    text_processor: {
      name: '文本处理工具',
      description: '批量查找替换、编码转换、格式化',
      language: 'python',
      dependencies: ['chardet'],
      template: this.getTextProcessorTemplate(),
    },
    api_tester: {
      name: 'API测试工具',
      description: '批量测试API接口、生成测试报告',
      language: 'python',
      dependencies: ['requests'],
      template: this.getAPITesterTemplate(),
    },
    port_scanner: {
      name: '端口扫描工具',
      description: '扫描主机开放端口',
      language: 'python',
      dependencies: [],
      template: this.getPortScannerTemplate(),
    },
    system_monitor: {
      name: '系统监控工具',
      description: '监控CPU、内存、磁盘使用情况',
      language: 'python',
      dependencies: ['psutil'],
      template: this.getSystemMonitorTemplate(),
    },
    custom: {
      name: '自定义工具',
      description: '根据需求自定义脚本',
      language: 'python',
      dependencies: [],
      template: this.getCustomTemplate(),
    },
  };

  canExecute(_context: ProjectContext): boolean {
    return true;
  }

  async execute(context: ProjectContext, params: SkillParams, reporter: SkillProgressReporter): Promise<SkillResult> {
    reporter.report('开始创建小工具...', 0);

    const userInput = params.userInput?.toLowerCase() || '';

    try {
      // 解析工具类型
      reporter.startSubTask('分析工具需求');
      const toolType = this.parseToolType(userInput);
      const toolConfig = this.toolTemplates[toolType];
      reporter.completeSubTask('分析工具需求', true);
      reporter.report(`识别为: ${toolConfig.name}`, 20);

      // 根据用户输入定制工具
      reporter.startSubTask('定制工具脚本');
      const customizedScript = this.customizeScript(toolConfig, userInput);
      reporter.completeSubTask('定制工具脚本', true);
      reporter.report('脚本定制完成', 50);

      // 保存脚本
      reporter.startSubTask('保存工具文件');
      const scriptPath = await this.saveScript(context.root, customizedScript, toolType, toolConfig.language);
      reporter.completeSubTask('保存工具文件', true);

      // 生成运行说明
      const runInstructions = this.generateRunInstructions(toolConfig, scriptPath);

      reporter.report('小工具创建完成', 100);

      return {
        success: true,
        message: `✅ ${toolConfig.name}已创建`,
        generatedFiles: [scriptPath],
        data: {
          toolType,
          toolConfig,
          scriptPath,
          runInstructions,
          dependencies: toolConfig.dependencies,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `工具创建失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private parseToolType(input: string): ToolType {
    if (input.includes('重命名') || input.includes('rename')) {
      return 'batch_rename';
    }
    if (input.includes('日志') || input.includes('log')) {
      return 'log_analyzer';
    }
    if (input.includes('图片') || input.includes('图像') || input.includes('image') || input.includes('压缩')) {
      return 'image_processor';
    }
    if (input.includes('整理') || input.includes('分类') || input.includes('organize')) {
      return 'file_organizer';
    }
    if (input.includes('转换') || input.includes('convert') || input.includes('json') || input.includes('csv')) {
      return 'data_converter';
    }
    if (input.includes('备份') || input.includes('backup')) {
      return 'backup_tool';
    }
    if (input.includes('文本') || input.includes('text') || input.includes('替换')) {
      return 'text_processor';
    }
    if (input.includes('api') || input.includes('接口') || input.includes('测试')) {
      return 'api_tester';
    }
    if (input.includes('端口') || input.includes('扫描') || input.includes('port')) {
      return 'port_scanner';
    }
    if (input.includes('监控') || input.includes('monitor') || input.includes('cpu') || input.includes('内存')) {
      return 'system_monitor';
    }
    return 'custom';
  }

  private customizeScript(config: ToolConfig, userInput: string): string {
    let script = config.template;
    
    // 添加用户需求注释
    script = script.replace(
      '# 用户需求: ',
      `# 用户需求: ${userInput || '通用工具'}`
    );
    
    // 添加生成时间
    script = script.replace(
      '# 生成时间: ',
      `# 生成时间: ${new Date().toISOString()}`
    );
    
    return script;
  }

  private async saveScript(root: string, content: string, toolType: string, language: string): Promise<string> {
    const toolsDir = path.join(root, '.ai-tools');
    
    if (!fs.existsSync(toolsDir)) {
      fs.mkdirSync(toolsDir, { recursive: true });
    }

    const ext = language === 'bash' ? 'sh' : language === 'node' ? 'js' : 'py';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${toolType}_${timestamp}.${ext}`;
    const filePath = path.join(toolsDir, fileName);

    fs.writeFileSync(filePath, content, 'utf-8');
    
    // 设置可执行权限
    if (process.platform !== 'win32') {
      fs.chmodSync(filePath, '755');
    }
    
    return filePath;
  }

  private generateRunInstructions(config: ToolConfig, scriptPath: string): string {
    let instructions = `
## 🔧 ${config.name}

### 工具说明
${config.description}

### 运行方式
`;

    if (config.dependencies && config.dependencies.length > 0) {
      instructions += `
\`\`\`bash
# 1. 安装依赖
pip install ${config.dependencies.join(' ')}

# 2. 运行脚本
`;
    } else {
      instructions += `
\`\`\`bash
# 运行脚本
`;
    }

    if (config.language === 'python') {
      instructions += `python "${scriptPath}"`;
    } else if (config.language === 'bash') {
      instructions += `bash "${scriptPath}"`;
    } else {
      instructions += `node "${scriptPath}"`;
    }

    instructions += `
\`\`\`

### 配置说明
打开脚本文件，修改配置区域的参数以适应您的需求。

### 注意事项
1. 首次运行前请检查并修改配置
2. 建议先在测试目录运行
3. 重要文件请先备份
`;

    return instructions;
  }

  // ==================== 工具模板 ====================

  private getBatchRenameTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量重命名工具
# 用户需求: 
# 生成时间: 
"""

import os
import re
from datetime import datetime
import argparse

# ==================== 配置区域 ====================
CONFIG = {
    'target_dir': '.',           # 目标目录
    'pattern': '*',              # 文件匹配模式
    'dry_run': True,             # 预览模式（不实际重命名）
    'recursive': False,          # 是否递归子目录
}

# 重命名规则
RENAME_RULES = {
    'mode': 'replace',           # 模式: replace/prefix/suffix/sequence/date
    'search': '',                # 查找内容（正则表达式）
    'replace': '',               # 替换内容
    'prefix': '',                # 前缀
    'suffix': '',                # 后缀
    'sequence_start': 1,         # 序号起始值
    'sequence_padding': 3,       # 序号填充位数
    'date_format': '%Y%m%d',     # 日期格式
}

# ==================== 重命名函数 ====================
def get_new_name(filename, index, rules):
    """根据规则生成新文件名"""
    name, ext = os.path.splitext(filename)
    
    if rules['mode'] == 'replace' and rules['search']:
        name = re.sub(rules['search'], rules['replace'], name)
    elif rules['mode'] == 'prefix':
        name = rules['prefix'] + name
    elif rules['mode'] == 'suffix':
        name = name + rules['suffix']
    elif rules['mode'] == 'sequence':
        seq = str(index + rules['sequence_start']).zfill(rules['sequence_padding'])
        name = f"{seq}_{name}"
    elif rules['mode'] == 'date':
        date_str = datetime.now().strftime(rules['date_format'])
        name = f"{date_str}_{name}"
    
    return name + ext

def batch_rename(config, rules):
    """批量重命名"""
    target_dir = config['target_dir']
    
    if not os.path.isdir(target_dir):
        print(f"❌ 目录不存在: {target_dir}")
        return
    
    files = []
    if config['recursive']:
        for root, _, filenames in os.walk(target_dir):
            for f in filenames:
                files.append(os.path.join(root, f))
    else:
        files = [os.path.join(target_dir, f) for f in os.listdir(target_dir) 
                 if os.path.isfile(os.path.join(target_dir, f))]
    
    print(f"找到 {len(files)} 个文件")
    print("-" * 50)
    
    renamed_count = 0
    for i, filepath in enumerate(sorted(files)):
        dirname = os.path.dirname(filepath)
        filename = os.path.basename(filepath)
        new_name = get_new_name(filename, i, rules)
        new_path = os.path.join(dirname, new_name)
        
        if filename != new_name:
            print(f"  {filename}")
            print(f"    -> {new_name}")
            
            if not config['dry_run']:
                try:
                    os.rename(filepath, new_path)
                    renamed_count += 1
                except Exception as e:
                    print(f"    ❌ 失败: {e}")
    
    print("-" * 50)
    if config['dry_run']:
        print("⚠️  预览模式，未实际重命名")
        print("   设置 dry_run = False 以执行重命名")
    else:
        print(f"✅ 已重命名 {renamed_count} 个文件")

# ==================== 主程序 ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='批量重命名工具')
    parser.add_argument('-d', '--dir', help='目标目录')
    parser.add_argument('-s', '--search', help='查找内容')
    parser.add_argument('-r', '--replace', help='替换内容')
    parser.add_argument('--execute', action='store_true', help='执行重命名')
    
    args = parser.parse_args()
    
    if args.dir:
        CONFIG['target_dir'] = args.dir
    if args.search:
        RENAME_RULES['search'] = args.search
    if args.replace:
        RENAME_RULES['replace'] = args.replace
    if args.execute:
        CONFIG['dry_run'] = False
    
    batch_rename(CONFIG, RENAME_RULES)
`;
  }

  private getLogAnalyzerTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
日志分析工具
# 用户需求: 
# 生成时间: 
"""

import os
import re
from collections import Counter, defaultdict
from datetime import datetime
import argparse

# ==================== 配置区域 ====================
CONFIG = {
    'log_file': 'app.log',       # 日志文件路径
    'output_file': 'log_report.txt',  # 报告输出路径
    'encoding': 'utf-8',         # 文件编码
}

# 日志级别正则
LOG_PATTERNS = {
    'error': r'\\b(ERROR|FATAL|CRITICAL)\\b',
    'warning': r'\\b(WARN|WARNING)\\b',
    'info': r'\\b(INFO)\\b',
    'debug': r'\\b(DEBUG)\\b',
}

# 时间戳正则（根据日志格式调整）
TIMESTAMP_PATTERN = r'(\\d{4}-\\d{2}-\\d{2}[T\\s]\\d{2}:\\d{2}:\\d{2})'

# ==================== 分析函数 ====================
def parse_log_line(line):
    """解析日志行"""
    result = {
        'timestamp': None,
        'level': 'unknown',
        'message': line.strip(),
    }
    
    # 提取时间戳
    ts_match = re.search(TIMESTAMP_PATTERN, line)
    if ts_match:
        try:
            result['timestamp'] = datetime.fromisoformat(ts_match.group(1).replace(' ', 'T'))
        except:
            pass
    
    # 识别日志级别
    for level, pattern in LOG_PATTERNS.items():
        if re.search(pattern, line, re.IGNORECASE):
            result['level'] = level
            break
    
    return result

def analyze_log(config):
    """分析日志文件"""
    log_file = config['log_file']
    
    if not os.path.isfile(log_file):
        print(f"❌ 文件不存在: {log_file}")
        return None
    
    stats = {
        'total_lines': 0,
        'level_counts': Counter(),
        'hourly_counts': defaultdict(int),
        'error_messages': [],
        'warning_messages': [],
    }
    
    print(f"分析日志文件: {log_file}")
    
    with open(log_file, 'r', encoding=config['encoding'], errors='ignore') as f:
        for line in f:
            stats['total_lines'] += 1
            parsed = parse_log_line(line)
            
            stats['level_counts'][parsed['level']] += 1
            
            if parsed['timestamp']:
                hour_key = parsed['timestamp'].strftime('%Y-%m-%d %H:00')
                stats['hourly_counts'][hour_key] += 1
            
            if parsed['level'] == 'error':
                stats['error_messages'].append(parsed['message'][:200])
            elif parsed['level'] == 'warning':
                stats['warning_messages'].append(parsed['message'][:200])
    
    return stats

def generate_report(stats, output_file):
    """生成分析报告"""
    report = []
    report.append("=" * 60)
    report.append("日志分析报告")
    report.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("=" * 60)
    
    report.append(f"\\n总行数: {stats['total_lines']}")
    
    report.append("\\n日志级别统计:")
    for level, count in sorted(stats['level_counts'].items()):
        pct = count / stats['total_lines'] * 100 if stats['total_lines'] > 0 else 0
        report.append(f"  {level.upper():10} : {count:8} ({pct:.1f}%)")
    
    report.append("\\n时间分布 (按小时):")
    for hour, count in sorted(stats['hourly_counts'].items())[-24:]:  # 最近24小时
        report.append(f"  {hour} : {count}")
    
    if stats['error_messages']:
        report.append(f"\\n错误日志示例 (前10条):")
        for msg in stats['error_messages'][:10]:
            report.append(f"  - {msg[:100]}...")
    
    report.append("\\n" + "=" * 60)
    
    report_text = "\\n".join(report)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report_text)
    
    print(report_text)
    print(f"\\n✅ 报告已保存至: {output_file}")

# ==================== 主程序 ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='日志分析工具')
    parser.add_argument('log_file', nargs='?', help='日志文件路径')
    parser.add_argument('-o', '--output', help='报告输出路径')
    
    args = parser.parse_args()
    
    if args.log_file:
        CONFIG['log_file'] = args.log_file
    if args.output:
        CONFIG['output_file'] = args.output
    
    stats = analyze_log(CONFIG)
    if stats:
        generate_report(stats, CONFIG['output_file'])
`;
  }

  private getImageProcessorTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片批处理工具
# 用户需求: 
# 生成时间: 
依赖: pip install Pillow
"""

import os
from PIL import Image
import argparse

# ==================== 配置区域 ====================
CONFIG = {
    'input_dir': '.',            # 输入目录
    'output_dir': './processed', # 输出目录
    'formats': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
}

# 处理选项
PROCESS_OPTIONS = {
    'resize': {
        'enabled': False,
        'width': 1920,
        'height': 1080,
        'keep_ratio': True,      # 保持宽高比
    },
    'compress': {
        'enabled': True,
        'quality': 85,           # JPEG质量 (1-100)
    },
    'convert': {
        'enabled': False,
        'format': 'JPEG',        # 目标格式
    },
    'watermark': {
        'enabled': False,
        'text': '© Copyright',
        'position': 'bottom-right',  # top-left/top-right/bottom-left/bottom-right/center
        'opacity': 128,          # 透明度 (0-255)
    },
}

# ==================== 处理函数 ====================
def process_image(img, options):
    """处理单张图片"""
    # 调整尺寸
    if options['resize']['enabled']:
        target_w = options['resize']['width']
        target_h = options['resize']['height']
        
        if options['resize']['keep_ratio']:
            img.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)
        else:
            img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # 添加水印
    if options['watermark']['enabled']:
        from PIL import ImageDraw, ImageFont
        
        draw = ImageDraw.Draw(img)
        text = options['watermark']['text']
        
        # 计算位置
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        img_w, img_h = img.size
        
        positions = {
            'top-left': (10, 10),
            'top-right': (img_w - text_w - 10, 10),
            'bottom-left': (10, img_h - text_h - 10),
            'bottom-right': (img_w - text_w - 10, img_h - text_h - 10),
            'center': ((img_w - text_w) // 2, (img_h - text_h) // 2),
        }
        
        pos = positions.get(options['watermark']['position'], positions['bottom-right'])
        draw.text(pos, text, fill=(255, 255, 255, options['watermark']['opacity']), font=font)
    
    return img

def batch_process(config, options):
    """批量处理图片"""
    input_dir = config['input_dir']
    output_dir = config['output_dir']
    
    if not os.path.isdir(input_dir):
        print(f"❌ 目录不存在: {input_dir}")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取图片文件
    files = [f for f in os.listdir(input_dir) 
             if os.path.splitext(f)[1].lower() in config['formats']]
    
    print(f"找到 {len(files)} 张图片")
    print("-" * 50)
    
    processed = 0
    for filename in files:
        input_path = os.path.join(input_dir, filename)
        
        try:
            with Image.open(input_path) as img:
                # 转换为RGB（如果需要保存为JPEG）
                if img.mode in ('RGBA', 'P') and options['convert'].get('format') == 'JPEG':
                    img = img.convert('RGB')
                
                # 处理图片
                processed_img = process_image(img.copy(), options)
                
                # 确定输出文件名和格式
                name, ext = os.path.splitext(filename)
                if options['convert']['enabled']:
                    ext = '.' + options['convert']['format'].lower()
                
                output_path = os.path.join(output_dir, name + ext)
                
                # 保存
                save_kwargs = {}
                if ext.lower() in ['.jpg', '.jpeg']:
                    save_kwargs['quality'] = options['compress']['quality']
                    save_kwargs['optimize'] = True
                
                processed_img.save(output_path, **save_kwargs)
                
                # 统计
                orig_size = os.path.getsize(input_path)
                new_size = os.path.getsize(output_path)
                ratio = (1 - new_size / orig_size) * 100 if orig_size > 0 else 0
                
                print(f"  ✓ {filename}")
                print(f"    {orig_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({ratio:.1f}% 节省)")
                processed += 1
                
        except Exception as e:
            print(f"  ❌ {filename}: {e}")
    
    print("-" * 50)
    print(f"✅ 处理完成: {processed}/{len(files)} 张图片")
    print(f"   输出目录: {output_dir}")

# ==================== 主程序 ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='图片批处理工具')
    parser.add_argument('-i', '--input', help='输入目录')
    parser.add_argument('-o', '--output', help='输出目录')
    parser.add_argument('-q', '--quality', type=int, help='压缩质量 (1-100)')
    parser.add_argument('-w', '--width', type=int, help='目标宽度')
    parser.add_argument('-H', '--height', type=int, help='目标高度')
    
    args = parser.parse_args()
    
    if args.input:
        CONFIG['input_dir'] = args.input
    if args.output:
        CONFIG['output_dir'] = args.output
    if args.quality:
        PROCESS_OPTIONS['compress']['quality'] = args.quality
    if args.width:
        PROCESS_OPTIONS['resize']['enabled'] = True
        PROCESS_OPTIONS['resize']['width'] = args.width
    if args.height:
        PROCESS_OPTIONS['resize']['enabled'] = True
        PROCESS_OPTIONS['resize']['height'] = args.height
    
    batch_process(CONFIG, PROCESS_OPTIONS)
`;
  }

  private getFileOrganizerTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件整理工具
# 用户需求: 
# 生成时间: 
"""

import os
import shutil
from datetime import datetime
from collections import defaultdict
import argparse

# ==================== 配置区域 ====================
CONFIG = {
    'source_dir': '.',           # 源目录
    'target_dir': './organized', # 目标目录
    'mode': 'type',              # 整理模式: type/date/size
    'dry_run': True,             # 预览模式
    'move': False,               # True=移动, False=复制
}

# 文件类型分类
FILE_CATEGORIES = {
    '文档': ['.doc', '.docx', '.pdf', '.txt', '.md', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx'],
    '图片': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff'],
    '视频': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
    '音频': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
    '压缩包': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
    '代码': ['.py', '.js', '.ts', '.java', '.c', '.cpp', '.h', '.go', '.rs', '.rb', '.php'],
    '数据': ['.json', '.xml', '.yaml', '.yml', '.csv', '.sql', '.db'],
    '可执行': ['.exe', '.msi', '.dmg', '.app', '.sh', '.bat'],
}

# 文件大小分类（字节）
SIZE_CATEGORIES = {
    '小文件 (<1MB)': (0, 1024 * 1024),
    '中等文件 (1-100MB)': (1024 * 1024, 100 * 1024 * 1024),
    '大文件 (>100MB)': (100 * 1024 * 1024, float('inf')),
}

# ==================== 整理函数 ====================
def get_category_by_type(ext):
    """根据扩展名获取分类"""
    ext = ext.lower()
    for category, extensions in FILE_CATEGORIES.items():
        if ext in extensions:
            return category
    return '其他'

def get_category_by_date(filepath):
    """根据修改日期获取分类"""
    mtime = os.path.getmtime(filepath)
    dt = datetime.fromtimestamp(mtime)
    return dt.strftime('%Y/%Y-%m')

def get_category_by_size(filepath):
    """根据文件大小获取分类"""
    size = os.path.getsize(filepath)
    for category, (min_size, max_size) in SIZE_CATEGORIES.items():
        if min_size <= size < max_size:
            return category
    return '其他'

def organize_files(config):
    """整理文件"""
    source_dir = config['source_dir']
    target_dir = config['target_dir']
    mode = config['mode']
    
    if not os.path.isdir(source_dir):
        print(f"❌ 目录不存在: {source_dir}")
        return
    
    # 获取所有文件
    files = []
    for item in os.listdir(source_dir):
        filepath = os.path.join(source_dir, item)
        if os.path.isfile(filepath):
            files.append(filepath)
    
    print(f"找到 {len(files)} 个文件")
    print(f"整理模式: {mode}")
    print("-" * 50)
    
    # 分类文件
    categories = defaultdict(list)
    for filepath in files:
        filename = os.path.basename(filepath)
        ext = os.path.splitext(filename)[1]
        
        if mode == 'type':
            category = get_category_by_type(ext)
        elif mode == 'date':
            category = get_category_by_date(filepath)
        elif mode == 'size':
            category = get_category_by_size(filepath)
        else:
            category = '未分类'
        
        categories[category].append(filepath)
    
    # 执行整理
    moved_count = 0
    for category, file_list in sorted(categories.items()):
        print(f"\\n📁 {category}: {len(file_list)} 个文件")
        
        category_dir = os.path.join(target_dir, category)
        
        if not config['dry_run']:
            os.makedirs(category_dir, exist_ok=True)
        
        for filepath in file_list:
            filename = os.path.basename(filepath)
            dest_path = os.path.join(category_dir, filename)
            
            print(f"   {filename}")
            
            if not config['dry_run']:
                try:
                    if config['move']:
                        shutil.move(filepath, dest_path)
                    else:
                        shutil.copy2(filepath, dest_path)
                    moved_count += 1
                except Exception as e:
                    print(f"   ❌ 失败: {e}")
    
    print("\\n" + "-" * 50)
    if config['dry_run']:
        print("⚠️  预览模式，未实际操作")
        print("   设置 dry_run = False 以执行操作")
    else:
        action = "移动" if config['move'] else "复制"
        print(f"✅ 已{action} {moved_count}/{len(files)} 个文件")

# ==================== 主程序 ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='文件整理工具')
    parser.add_argument('-s', '--source', help='源目录')
    parser.add_argument('-t', '--target', help='目标目录')
    parser.add_argument('-m', '--mode', choices=['type', 'date', 'size'], help='整理模式')
    parser.add_argument('--move', action='store_true', help='移动文件（默认复制）')
    parser.add_argument('--execute', action='store_true', help='执行操作')
    
    args = parser.parse_args()
    
    if args.source:
        CONFIG['source_dir'] = args.source
    if args.target:
        CONFIG['target_dir'] = args.target
    if args.mode:
        CONFIG['mode'] = args.mode
    if args.move:
        CONFIG['move'] = True
    if args.execute:
        CONFIG['dry_run'] = False
    
    organize_files(CONFIG)
`;
  }

  private getDataConverterTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据格式转换工具
# 用户需求: 
# 生成时间: 
依赖: pip install PyYAML
"""

import json
import csv
import xml.etree.ElementTree as ET
from xml.dom import minidom
import argparse
import os

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False
    print("⚠️ PyYAML未安装，YAML功能不可用")

# ==================== 转换函数 ====================
def json_to_csv(input_file, output_file):
    """JSON转CSV"""
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if isinstance(data, dict):
        data = [data]
    
    if not data:
        print("❌ 数据为空")
        return
    
    with open(output_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✅ 已转换: {output_file}")

def csv_to_json(input_file, output_file):
    """CSV转JSON"""
    data = []
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已转换: {output_file}")

def json_to_xml(input_file, output_file):
    """JSON转XML"""
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    def dict_to_xml(d, root_name='root'):
        root = ET.Element(root_name)
        
        def add_element(parent, data):
            if isinstance(data, dict):
                for key, value in data.items():
                    child = ET.SubElement(parent, str(key))
                    add_element(child, value)
            elif isinstance(data, list):
                for item in data:
                    child = ET.SubElement(parent, 'item')
                    add_element(child, item)
            else:
                parent.text = str(data) if data is not None else ''
        
        add_element(root, data)
        return root
    
    root = dict_to_xml(data)
    xml_str = minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(xml_str)
    
    print(f"✅ 已转换: {output_file}")

def json_to_yaml(input_file, output_file):
    """JSON转YAML"""
    if not HAS_YAML:
        print("❌ 请安装PyYAML: pip install PyYAML")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, allow_unicode=True, default_flow_style=False)
    
    print(f"✅ 已转换: {output_file}")

def yaml_to_json(input_file, output_file):
    """YAML转JSON"""
    if not HAS_YAML:
        print("❌ 请安装PyYAML: pip install PyYAML")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已转换: {output_file}")

# ==================== 主程序 ====================
CONVERTERS = {
    ('json', 'csv'): json_to_csv,
    ('csv', 'json'): csv_to_json,
    ('json', 'xml'): json_to_xml,
    ('json', 'yaml'): json_to_yaml,
    ('yaml', 'json'): yaml_to_json,
}

def convert(input_file, output_format):
    """自动检测并转换"""
    if not os.path.isfile(input_file):
        print(f"❌ 文件不存在: {input_file}")
        return
    
    input_ext = os.path.splitext(input_file)[1].lower().lstrip('.')
    if input_ext in ['yml']:
        input_ext = 'yaml'
    
    converter = CONVERTERS.get((input_ext, output_format))
    if not converter:
        print(f"❌ 不支持的转换: {input_ext} -> {output_format}")
        print(f"   支持的转换: {list(CONVERTERS.keys())}")
        return
    
    output_file = os.path.splitext(input_file)[0] + '.' + output_format
    converter(input_file, output_file)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='数据格式转换工具')
    parser.add_argument('input', help='输入文件')
    parser.add_argument('-f', '--format', required=True, 
                        choices=['json', 'csv', 'xml', 'yaml'],
                        help='输出格式')
    
    args = parser.parse_args()
    convert(args.input, args.format)
`;
  }

  private getBackupToolTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件备份工具
# 用户需求: 
# 生成时间: 
"""

import os
import shutil
import zipfile
import hashlib
from datetime import datetime
import json
import argparse

# ==================== 配置区域 ====================
CONFIG = {
    'source_dirs': ['.'],        # 要备份的目录列表
    'backup_dir': './backups',   # 备份存储目录
    'exclude_patterns': [        # 排除的文件/目录
        '__pycache__',
        '.git',
        'node_modules',
        '.venv',
        '*.pyc',
        '*.log',
    ],
    'compress': True,            # 是否压缩
    'incremental': False,        # 增量备份
    'max_backups': 10,           # 最大保留备份数
}

# ==================== 备份函数 ====================
def should_exclude(path, patterns):
    """检查是否应该排除"""
    name = os.path.basename(path)
    for pattern in patterns:
        if pattern.startswith('*'):
            if name.endswith(pattern[1:]):
                return True
        elif pattern in path:
            return True
    return False

def get_file_hash(filepath):
    """计算文件MD5"""
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            hasher.update(chunk)
    return hasher.hexdigest()

def collect_files(source_dirs, exclude_patterns):
    """收集要备份的文件"""
    files = []
    for source_dir in source_dirs:
        if not os.path.isdir(source_dir):
            print(f"⚠️ 目录不存在: {source_dir}")
            continue
        
        for root, dirs, filenames in os.walk(source_dir):
            # 排除目录
            dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), exclude_patterns)]
            
            for filename in filenames:
                filepath = os.path.join(root, filename)
                if not should_exclude(filepath, exclude_patterns):
                    files.append(filepath)
    
    return files

def create_backup(config):
    """创建备份"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_name = f"backup_{timestamp}"
    backup_dir = config['backup_dir']
    
    os.makedirs(backup_dir, exist_ok=True)
    
    # 收集文件
    files = collect_files(config['source_dirs'], config['exclude_patterns'])
    print(f"找到 {len(files)} 个文件")
    
    if not files:
        print("❌ 没有要备份的文件")
        return
    
    # 加载上次备份的哈希（用于增量备份）
    hash_file = os.path.join(backup_dir, 'last_backup_hashes.json')
    last_hashes = {}
    if config['incremental'] and os.path.isfile(hash_file):
        with open(hash_file, 'r') as f:
            last_hashes = json.load(f)
    
    # 过滤需要备份的文件
    current_hashes = {}
    files_to_backup = []
    for filepath in files:
        file_hash = get_file_hash(filepath)
        current_hashes[filepath] = file_hash
        
        if not config['incremental'] or last_hashes.get(filepath) != file_hash:
            files_to_backup.append(filepath)
    
    if config['incremental']:
        print(f"增量备份: {len(files_to_backup)} 个文件有变化")
    
    if not files_to_backup:
        print("✅ 所有文件都是最新的，无需备份")
        return
    
    # 创建备份
    if config['compress']:
        backup_path = os.path.join(backup_dir, f"{backup_name}.zip")
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for filepath in files_to_backup:
                zf.write(filepath)
                print(f"  + {filepath}")
    else:
        backup_path = os.path.join(backup_dir, backup_name)
        os.makedirs(backup_path, exist_ok=True)
        for filepath in files_to_backup:
            dest = os.path.join(backup_path, filepath)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy2(filepath, dest)
            print(f"  + {filepath}")
    
    # 保存当前哈希
    with open(hash_file, 'w') as f:
        json.dump(current_hashes, f)
    
    # 清理旧备份
    cleanup_old_backups(backup_dir, config['max_backups'])
    
    # 统计
    backup_size = os.path.getsize(backup_path) if config['compress'] else sum(
        os.path.getsize(os.path.join(backup_path, f)) 
        for f in os.listdir(backup_path)
    )
    
    print(f"\\n✅ 备份完成: {backup_path}")
    print(f"   文件数: {len(files_to_backup)}")
    print(f"   大小: {backup_size / 1024 / 1024:.2f} MB")

def cleanup_old_backups(backup_dir, max_backups):
    """清理旧备份"""
    backups = sorted([
        f for f in os.listdir(backup_dir) 
        if f.startswith('backup_') and (f.endswith('.zip') or os.path.isdir(os.path.join(backup_dir, f)))
    ])
    
    while len(backups) > max_backups:
        old_backup = backups.pop(0)
        old_path = os.path.join(backup_dir, old_backup)
        if os.path.isfile(old_path):
            os.remove(old_path)
        else:
            shutil.rmtree(old_path)
        print(f"  🗑️ 删除旧备份: {old_backup}")

# ==================== 主程序 ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='文件备份工具')
    parser.add_argument('-s', '--source', nargs='+', help='源目录')
    parser.add_argument('-d', '--dest', help='备份目录')
    parser.add_argument('-i', '--incremental', action='store_true', help='增量备份')
    parser.add_argument('--no-compress', action='store_true', help='不压缩')
    
    args = parser.parse_args()
    
    if args.source:
        CONFIG['source_dirs'] = args.source
    if args.dest:
        CONFIG['backup_dir'] = args.dest
    if args.incremental:
        CONFIG['incremental'] = True
    if args.no_compress:
        CONFIG['compress'] = False
    
    create_backup(CONFIG)
`;
  }

  private getTextProcessorTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文本处理工具
# 用户需求: 
# 生成时间: 
依赖: pip install chardet (可选，用于编码检测)
"""

import os
import re
import argparse

try:
    import chardet
    HAS_CHARDET = True
except ImportError:
    HAS_CHARDET = False

# ==================== 配置区域 ====================
CONFIG = {
    'target_dir': '.',
    'file_patterns': ['*.txt', '*.md', '*.csv'],
    'recursive': False,
    'dry_run': True,
}

# 处理选项
PROCESS_OPTIONS = {
    'find_replace': {
        'enabled': False,
        'rules': [
            # {'find': '旧内容', 'replace': '新内容', 'regex': False},
        ],
    },
    'encoding': {
        'enabled': False,
        'target_encoding': 'utf-8',
    },
    'line_endings': {
        'enabled': False,
        'target': 'unix',  # unix(LF) / windows(CRLF)
    },
    'trim': {
        'enabled': False,
        'trailing_whitespace': True,
        'empty_lines': True,
    },
}

# ==================== 处理函数 ====================
def detect_encoding(filepath):
    """检测文件编码"""
    if not HAS_CHARDET:
        return 'utf-8'
    
    with open(filepath, 'rb') as f:
        raw = f.read(10000)
    result = chardet.detect(raw)
    return result['encoding'] or 'utf-8'

def process_text(content, options):
    """处理文本内容"""
    modified = False
    
    # 查找替换
    if options['find_replace']['enabled']:
        for rule in options['find_replace']['rules']:
            if rule.get('regex'):
                new_content = re.sub(rule['find'], rule['replace'], content)
            else:
                new_content = content.replace(rule['find'], rule['replace'])
            if new_content != content:
                modified = True
                content = new_content
    
    # 处理行尾
    if options['line_endings']['enabled']:
        if options['line_endings']['target'] == 'unix':
            new_content = content.replace('\\r\\n', '\\n')
        else:
            new_content = content.replace('\\r\\n', '\\n').replace('\\n', '\\r\\n')
        if new_content != content:
            modified = True
            content = new_content
    
    # 清理空白
    if options['trim']['enabled']:
        lines = content.split('\\n')
        
        if options['trim']['trailing_whitespace']:
            lines = [line.rstrip() for line in lines]
            modified = True
        
        if options['trim']['empty_lines']:
            # 移除连续空行
            new_lines = []
            prev_empty = False
            for line in lines:
                is_empty = len(line.strip()) == 0
                if not (is_empty and prev_empty):
                    new_lines.append(line)
                prev_empty = is_empty
            lines = new_lines
            modified = True
        
        content = '\\n'.join(lines)
    
    return content, modified

def batch_process(config, options):
    """批量处理文本文件"""
    import fnmatch
    
    target_dir = config['target_dir']
    
    if not os.path.isdir(target_dir):
        print(f"❌ 目录不存在: {target_dir}")
        return
    
    # 收集文件
    files = []
    if config['recursive']:
        for root, _, filenames in os.walk(target_dir):
            for pattern in config['file_patterns']:
                for filename in fnmatch.filter(filenames, pattern):
                    files.append(os.path.join(root, filename))
    else:
        for filename in os.listdir(target_dir):
            filepath = os.path.join(target_dir, filename)
            if os.path.isfile(filepath):
                for pattern in config['file_patterns']:
                    if fnmatch.fnmatch(filename, pattern):
                        files.append(filepath)
                        break
    
    print(f"找到 {len(files)} 个文件")
    print("-" * 50)
    
    processed = 0
    for filepath in files:
        try:
            # 检测编码
            encoding = detect_encoding(filepath)
            
            # 读取内容
            with open(filepath, 'r', encoding=encoding, errors='replace') as f:
                content = f.read()
            
            # 处理内容
            new_content, modified = process_text(content, options)
            
            # 转换编码
            target_encoding = encoding
            if options['encoding']['enabled']:
                target_encoding = options['encoding']['target_encoding']
                if encoding != target_encoding:
                    modified = True
            
            if modified:
                print(f"  ✓ {filepath}")
                if encoding != target_encoding:
                    print(f"    编码: {encoding} -> {target_encoding}")
                
                if not config['dry_run']:
                    with open(filepath, 'w', encoding=target_encoding) as f:
                        f.write(new_content)
                processed += 1
            else:
                print(f"  - {filepath} (无变化)")
                
        except Exception as e:
            print(f"  ❌ {filepath}: {e}")
    
    print("-" * 50)
    if config['dry_run']:
        print("⚠️  预览模式，未实际修改")
    else:
        print(f"✅ 已处理 {processed} 个文件")

# ==================== 主程序 ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='文本处理工具')
    parser.add_argument('-d', '--dir', help='目标目录')
    parser.add_argument('-f', '--find', help='查找内容')
    parser.add_argument('-r', '--replace', help='替换内容')
    parser.add_argument('-e', '--encoding', help='目标编码')
    parser.add_argument('--execute', action='store_true', help='执行修改')
    
    args = parser.parse_args()
    
    if args.dir:
        CONFIG['target_dir'] = args.dir
    if args.find:
        PROCESS_OPTIONS['find_replace']['enabled'] = True
        PROCESS_OPTIONS['find_replace']['rules'].append({
            'find': args.find,
            'replace': args.replace or '',
            'regex': False,
        })
    if args.encoding:
        PROCESS_OPTIONS['encoding']['enabled'] = True
        PROCESS_OPTIONS['encoding']['target_encoding'] = args.encoding
    if args.execute:
        CONFIG['dry_run'] = False
    
    batch_process(CONFIG, PROCESS_OPTIONS)
`;
  }

  private getAPITesterTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API测试工具
# 用户需求: 
# 生成时间: 
依赖: pip install requests
"""

import json
import time
from datetime import datetime
import argparse

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("❌ 请安装requests: pip install requests")

# ==================== 配置区域 ====================
API_TESTS = [
    {
        'name': '示例GET请求',
        'method': 'GET',
        'url': 'https://httpbin.org/get',
        'headers': {},
        'params': {'key': 'value'},
        'expected_status': 200,
    },
    {
        'name': '示例POST请求',
        'method': 'POST',
        'url': 'https://httpbin.org/post',
        'headers': {'Content-Type': 'application/json'},
        'body': {'message': 'Hello'},
        'expected_status': 200,
    },
]

CONFIG = {
    'timeout': 30,
    'retry': 2,
    'delay': 1,  # 请求间隔（秒）
    'verbose': True,
}

# ==================== 测试函数 ====================
def run_test(test_case, config):
    """执行单个测试"""
    result = {
        'name': test_case['name'],
        'success': False,
        'status_code': None,
        'response_time': None,
        'error': None,
    }
    
    method = test_case.get('method', 'GET').upper()
    url = test_case['url']
    headers = test_case.get('headers', {})
    params = test_case.get('params', {})
    body = test_case.get('body')
    expected_status = test_case.get('expected_status', 200)
    
    for attempt in range(config['retry'] + 1):
        try:
            start_time = time.time()
            
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=config['timeout'])
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=body, timeout=config['timeout'])
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=body, timeout=config['timeout'])
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=config['timeout'])
            else:
                raise ValueError(f"不支持的方法: {method}")
            
            result['response_time'] = (time.time() - start_time) * 1000  # ms
            result['status_code'] = response.status_code
            result['success'] = response.status_code == expected_status
            
            if config['verbose']:
                print(f"  响应状态: {response.status_code}")
                print(f"  响应时间: {result['response_time']:.0f}ms")
            
            break
            
        except Exception as e:
            result['error'] = str(e)
            if attempt < config['retry']:
                print(f"  重试 ({attempt + 1}/{config['retry']})...")
                time.sleep(1)
            else:
                print(f"  ❌ 失败: {e}")
    
    return result

def run_all_tests(tests, config):
    """执行所有测试"""
    print("=" * 60)
    print("API测试报告")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    results = []
    passed = 0
    failed = 0
    
    for i, test in enumerate(tests, 1):
        print(f"\\n[{i}/{len(tests)}] {test['name']}")
        print(f"  {test.get('method', 'GET')} {test['url']}")
        
        result = run_test(test, config)
        results.append(result)
        
        if result['success']:
            passed += 1
            print("  ✅ 通过")
        else:
            failed += 1
            print("  ❌ 失败")
        
        if config['delay'] and i < len(tests):
            time.sleep(config['delay'])
    
    # 汇总
    print("\\n" + "=" * 60)
    print(f"测试完成: {passed}/{len(tests)} 通过")
    
    if results:
        avg_time = sum(r['response_time'] or 0 for r in results) / len(results)
        print(f"平均响应时间: {avg_time:.0f}ms")
    
    print("=" * 60)
    
    return results

# ==================== 主程序 ====================
if __name__ == "__main__":
    if not HAS_REQUESTS:
        exit(1)
    
    parser = argparse.ArgumentParser(description='API测试工具')
    parser.add_argument('-u', '--url', help='测试URL')
    parser.add_argument('-m', '--method', default='GET', help='请求方法')
    parser.add_argument('-d', '--data', help='请求数据(JSON)')
    
    args = parser.parse_args()
    
    if args.url:
        # 单个测试
        test = {
            'name': '命令行测试',
            'method': args.method,
            'url': args.url,
        }
        if args.data:
            test['body'] = json.loads(args.data)
        
        API_TESTS = [test]
    
    run_all_tests(API_TESTS, CONFIG)
`;
  }

  private getPortScannerTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
端口扫描工具
# 用户需求: 
# 生成时间: 
"""

import socket
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse

# ==================== 配置区域 ====================
CONFIG = {
    'host': 'localhost',
    'ports': range(1, 1025),     # 扫描端口范围
    'timeout': 1,                 # 超时时间（秒）
    'threads': 100,               # 并发线程数
}

# 常见端口服务
COMMON_PORTS = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    445: 'SMB',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    6379: 'Redis',
    8080: 'HTTP-Alt',
    27017: 'MongoDB',
}

# ==================== 扫描函数 ====================
def scan_port(host, port, timeout):
    """扫描单个端口"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return port, result == 0
    except:
        return port, False

def scan_host(config):
    """扫描主机端口"""
    host = config['host']
    ports = list(config['ports'])
    
    print(f"扫描主机: {host}")
    print(f"端口范围: {ports[0]}-{ports[-1]}")
    print(f"线程数: {config['threads']}")
    print("-" * 50)
    
    open_ports = []
    scanned = 0
    
    with ThreadPoolExecutor(max_workers=config['threads']) as executor:
        futures = {
            executor.submit(scan_port, host, port, config['timeout']): port 
            for port in ports
        }
        
        for future in as_completed(futures):
            port, is_open = future.result()
            scanned += 1
            
            if is_open:
                service = COMMON_PORTS.get(port, 'unknown')
                open_ports.append((port, service))
                print(f"  ✓ 端口 {port:5} 开放 ({service})")
            
            # 进度显示
            if scanned % 100 == 0:
                print(f"  已扫描: {scanned}/{len(ports)}", end='\\r')
    
    print("\\n" + "-" * 50)
    print(f"扫描完成: {len(ports)} 个端口")
    print(f"开放端口: {len(open_ports)} 个")
    
    if open_ports:
        print("\\n开放端口列表:")
        for port, service in sorted(open_ports):
            print(f"  {port:5} - {service}")
    
    return open_ports

# ==================== 主程序 ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='端口扫描工具')
    parser.add_argument('host', nargs='?', default='localhost', help='目标主机')
    parser.add_argument('-p', '--ports', help='端口范围，如: 1-1024 或 80,443,8080')
    parser.add_argument('-t', '--threads', type=int, help='线程数')
    
    args = parser.parse_args()
    
    CONFIG['host'] = args.host
    
    if args.ports:
        if '-' in args.ports:
            start, end = map(int, args.ports.split('-'))
            CONFIG['ports'] = range(start, end + 1)
        elif ',' in args.ports:
            CONFIG['ports'] = [int(p) for p in args.ports.split(',')]
    
    if args.threads:
        CONFIG['threads'] = args.threads
    
    scan_host(CONFIG)
`;
  }

  private getSystemMonitorTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
系统监控工具
# 用户需求: 
# 生成时间: 
依赖: pip install psutil
"""

import time
from datetime import datetime
import argparse

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("❌ 请安装psutil: pip install psutil")

# ==================== 配置区域 ====================
CONFIG = {
    'interval': 2,       # 刷新间隔（秒）
    'duration': 0,       # 监控时长（秒），0表示持续监控
    'show_processes': 5, # 显示top N进程
}

# ==================== 监控函数 ====================
def get_size(bytes):
    """格式化字节大小"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024:
            return f"{bytes:.1f}{unit}"
        bytes /= 1024

def get_system_info():
    """获取系统信息"""
    info = {}
    
    # CPU
    info['cpu_percent'] = psutil.cpu_percent(interval=1)
    info['cpu_count'] = psutil.cpu_count()
    info['cpu_freq'] = psutil.cpu_freq()
    
    # 内存
    mem = psutil.virtual_memory()
    info['mem_total'] = mem.total
    info['mem_used'] = mem.used
    info['mem_percent'] = mem.percent
    
    # 磁盘
    disk = psutil.disk_usage('/')
    info['disk_total'] = disk.total
    info['disk_used'] = disk.used
    info['disk_percent'] = disk.percent
    
    # 网络
    net = psutil.net_io_counters()
    info['net_sent'] = net.bytes_sent
    info['net_recv'] = net.bytes_recv
    
    return info

def get_top_processes(n):
    """获取CPU占用最高的进程"""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            processes.append(proc.info)
        except:
            pass
    
    return sorted(processes, key=lambda x: x['cpu_percent'] or 0, reverse=True)[:n]

def print_monitor(info, processes, prev_net=None):
    """打印监控信息"""
    # 清屏
    print("\\033[2J\\033[H", end='')
    
    print("=" * 60)
    print(f"系统监控 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # CPU
    print(f"\\n📊 CPU")
    print(f"   使用率: {info['cpu_percent']:5.1f}%")
    print(f"   核心数: {info['cpu_count']}")
    if info['cpu_freq']:
        print(f"   频率: {info['cpu_freq'].current:.0f} MHz")
    
    # 进度条
    bar_width = 30
    filled = int(bar_width * info['cpu_percent'] / 100)
    bar = '█' * filled + '░' * (bar_width - filled)
    print(f"   [{bar}] {info['cpu_percent']:.1f}%")
    
    # 内存
    print(f"\\n💾 内存")
    print(f"   使用: {get_size(info['mem_used'])} / {get_size(info['mem_total'])}")
    filled = int(bar_width * info['mem_percent'] / 100)
    bar = '█' * filled + '░' * (bar_width - filled)
    print(f"   [{bar}] {info['mem_percent']:.1f}%")
    
    # 磁盘
    print(f"\\n💿 磁盘")
    print(f"   使用: {get_size(info['disk_used'])} / {get_size(info['disk_total'])}")
    filled = int(bar_width * info['disk_percent'] / 100)
    bar = '█' * filled + '░' * (bar_width - filled)
    print(f"   [{bar}] {info['disk_percent']:.1f}%")
    
    # 网络
    print(f"\\n🌐 网络")
    print(f"   总发送: {get_size(info['net_sent'])}")
    print(f"   总接收: {get_size(info['net_recv'])}")
    if prev_net:
        sent_speed = (info['net_sent'] - prev_net[0]) / CONFIG['interval']
        recv_speed = (info['net_recv'] - prev_net[1]) / CONFIG['interval']
        print(f"   发送速度: {get_size(sent_speed)}/s")
        print(f"   接收速度: {get_size(recv_speed)}/s")
    
    # 进程
    if processes:
        print(f"\\n📋 Top {len(processes)} 进程")
        print(f"   {'PID':>7} {'CPU%':>6} {'MEM%':>6} 名称")
        for proc in processes:
            print(f"   {proc['pid']:>7} {proc['cpu_percent'] or 0:>5.1f}% {proc['memory_percent'] or 0:>5.1f}% {proc['name'][:30]}")
    
    print("\\n" + "-" * 60)
    print("按 Ctrl+C 退出")

def monitor(config):
    """持续监控"""
    start_time = time.time()
    prev_net = None
    
    try:
        while True:
            info = get_system_info()
            processes = get_top_processes(config['show_processes'])
            print_monitor(info, processes, prev_net)
            
            prev_net = (info['net_sent'], info['net_recv'])
            
            if config['duration'] > 0:
                if time.time() - start_time > config['duration']:
                    print("\\n监控时间到，退出...")
                    break
            
            time.sleep(config['interval'])
            
    except KeyboardInterrupt:
        print("\\n\\n监控已停止")

# ==================== 主程序 ====================
if __name__ == "__main__":
    if not HAS_PSUTIL:
        exit(1)
    
    parser = argparse.ArgumentParser(description='系统监控工具')
    parser.add_argument('-i', '--interval', type=int, help='刷新间隔（秒）')
    parser.add_argument('-d', '--duration', type=int, help='监控时长（秒）')
    parser.add_argument('-n', '--top', type=int, help='显示top N进程')
    
    args = parser.parse_args()
    
    if args.interval:
        CONFIG['interval'] = args.interval
    if args.duration:
        CONFIG['duration'] = args.duration
    if args.top:
        CONFIG['show_processes'] = args.top
    
    monitor(CONFIG)
`;
  }

  private getCustomTemplate(): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自定义工具脚本
# 用户需求: 
# 生成时间: 
"""

import os
import sys
import argparse

# ==================== 配置区域 ====================
CONFIG = {
    # 在这里添加配置项
}

# ==================== 主要功能 ====================
def main():
    """主函数"""
    print("自定义工具已启动")
    print("-" * 50)
    
    # 在这里添加主要逻辑
    
    print("-" * 50)
    print("✅ 执行完成")

# ==================== 主程序 ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='自定义工具')
    # 添加命令行参数
    # parser.add_argument('-i', '--input', help='输入')
    
    args = parser.parse_args()
    main()
`;
  }
}
