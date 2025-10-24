const fs = require('fs');
const path = require('path');

// 读取字体文件
const fontPath = path.join(__dirname, '../src/assets/fonts/Microsoft Ya Hei.ttf');
const outputPath = path.join(__dirname, '../src/assets/fonts/msyh.js');

// 读取字体文件并转换为 base64
const fontBuffer = fs.readFileSync(fontPath);
const base64Font = fontBuffer.toString('base64');

// 生成 jsPDF 可用的字体文件
const fontModule = `// 微软雅黑字体
export const MicrosoftYaHeiFont = '${base64Font}';
`;

fs.writeFileSync(outputPath, fontModule);

console.log('✅ 字体转换成功！');
console.log('📁 输出文件:', outputPath);
console.log('📦 文件大小:', (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2), 'MB');
