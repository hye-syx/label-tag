import { jsPDF } from 'jspdf';
import { ProductData } from '@/types';
import { MicrosoftYaHeiFont } from '@/assets/fonts/msyh';

interface StyleLabels {
  chinese: boolean;
  english: boolean;
  silver: boolean;
}

interface LabelConfig {
  spareQuantity: number;
  fontSize: number;
  styles: StyleLabels;
}

interface LabelData {
  productName: string;
  orderNumber: string;
  productCode: string;
  quantity: string;
  remarks: string;
}

// 款式名称映射
const STYLE_NAMES: Record<string, string> = {
  chinese: '中文吊牌',
  english: '英文吊牌',
  silver: '烫银吊牌'
};

class LabelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpi: number;
  private offCanvas: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  // 标签尺寸（mm）
  private readonly LABEL_WIDTH = 90;
  private readonly LABEL_HEIGHT = 50;

  // 表格布局（mm）
  private readonly COL1_WIDTH = 20; // 左列宽度
  private readonly COL2_WIDTH = 70; // 右列宽度
  private readonly ROW_HEIGHT = 10; // 行高
  private readonly LINE_WIDTH = 0.567; // pt

  // PDF 渲染内容记录
  private pdfRenderContents: any[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpi = window.devicePixelRatio || 1;

    // 调整主 canvas 尺寸
    this.canvas.width = this.canvas.clientWidth * this.dpi;
    this.canvas.height = this.canvas.clientHeight * this.dpi;

    // 创建离屏 canvas
    this.offCanvas = document.createElement('canvas');
    this.offCanvas.width = this.mmToPx(this.LABEL_WIDTH);
    this.offCanvas.height = this.mmToPx(this.LABEL_HEIGHT);
    this.offCtx = this.offCanvas.getContext('2d')!;

    this.init();
  }

  /**
   * 单位转换：mm 转 px
   */
  private mmToPx(mm: number): number {
    return mm * (this.dpi * 96) / 25.4;
  }

  /**
   * 单位转换：px 转 mm
   */
  private pxToMm(px: number): number {
    return px * 25.4 / 96;
  }

  /**
   * 单位转换：px 转 pt
   */
  private pxToPt(px: number): number {
    return px * 0.75;
  }

  /**
   * 初始化 canvas
   */
  private init(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255,255,255,.2)';
    this.ctx.font = 'bold 80px Arial';
    const text = '标签预览';
    const metrics = this.ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 80;
    const x = (this.canvas.width - textWidth) / 2;
    const y = (this.canvas.height + textHeight / 2) / 2;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  /**
   * 渲染单个标签预览
   */
  render(labelData: LabelData, fontSize: number = 10): void {
    this.pdfRenderContents = [];

    // 清空离屏 canvas
    this.offCtx.clearRect(0, 0, this.offCanvas.width, this.offCanvas.height);
    this.offCtx.fillStyle = 'white';
    this.offCtx.fillRect(0, 0, this.offCanvas.width, this.offCanvas.height);

    // 绘制表格
    this.drawTable(labelData, fontSize);

    // 将离屏 canvas 绘制到主 canvas
    this.drawToMainCanvas();
  }

  /**
   * 绘制表格
   */
  private drawTable(labelData: LabelData, fontSize: number): void {
    const lineWidthPx = (this.LINE_WIDTH / 72) * 96; // pt 转 px

    this.offCtx.strokeStyle = 'black';
    this.offCtx.lineWidth = lineWidthPx;
    this.offCtx.font = `${fontSize}px Arial, sans-serif`;
    this.offCtx.fillStyle = 'black';

    const col1WidthPx = this.mmToPx(this.COL1_WIDTH) / this.dpi;
    const col2WidthPx = this.mmToPx(this.COL2_WIDTH) / this.dpi;
    const rowHeightPx = this.mmToPx(this.ROW_HEIGHT) / this.dpi;

    const rows = [
      { label: '品 名', value: labelData.productName },
      { label: '订单号', value: labelData.orderNumber },
      { label: '货 号', value: labelData.productCode },
      { label: '数 量', value: labelData.quantity },
      { label: '备 注', value: labelData.remarks }
    ];

    rows.forEach((row, index) => {
      const y = index * rowHeightPx;

      // 绘制单元格边框
      this.offCtx.strokeRect(0, y, col1WidthPx, rowHeightPx);
      this.offCtx.strokeRect(col1WidthPx, y, col2WidthPx, rowHeightPx);

      // 记录边框到 PDF 渲染内容
      this.pdfRenderContents.push({
        type: 'rect',
        x: 0,
        y: y,
        w: col1WidthPx,
        h: rowHeightPx
      });
      this.pdfRenderContents.push({
        type: 'rect',
        x: col1WidthPx,
        y: y,
        w: col2WidthPx,
        h: rowHeightPx
      });

      // 绘制左列文本（居中）
      this.offCtx.textAlign = 'center';
      this.offCtx.textBaseline = 'middle';
      const labelX = col1WidthPx / 2;
      const labelY = y + rowHeightPx / 2;
      this.offCtx.fillText(row.label, labelX, labelY);

      this.pdfRenderContents.push({
        type: 'text',
        text: row.label,
        x: labelX,
        y: labelY,
        fontSize: fontSize,
        align: 'center'
      });

      // 绘制右列文本（左对齐，带边距）
      this.offCtx.textAlign = 'left';
      const valueX = col1WidthPx + 2;
      const valueY = y + rowHeightPx / 2;

      // 处理文字换行
      const maxWidth = col2WidthPx - 4;
      this.wrapText(row.value, valueX, valueY, maxWidth, fontSize, rowHeightPx);
    });
  }

  /**
   * 文字自动换行
   */
  private wrapText(text: string, x: number, y: number, maxWidth: number, fontSize: number, rowHeight: number): void {
    const words = text.split('');
    let line = '';
    const lines: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = this.offCtx.measureText(testLine);

      if (metrics.width > maxWidth && line.length > 0) {
        lines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // 计算起始 y 坐标，使多行文本垂直居中
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;
      this.offCtx.fillText(line, x, lineY);

      this.pdfRenderContents.push({
        type: 'text',
        text: line,
        x: x,
        y: lineY,
        fontSize: fontSize,
        align: 'left'
      });
    });
  }

  /**
   * 绘制到主 canvas
   */
  private drawToMainCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const scale = Math.min(
      this.canvas.width / this.offCanvas.width,
      this.canvas.height / this.offCanvas.height
    );

    const offsetX = (this.canvas.width - this.offCanvas.width * scale) / 2;
    const offsetY = (this.canvas.height - this.offCanvas.height * scale) / 2;

    // 绘制阴影
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 5;
    this.ctx.shadowOffsetY = 5;
    this.ctx.fillRect(offsetX, offsetY, this.offCanvas.width * scale, this.offCanvas.height * scale);

    // 绘制离屏 canvas
    this.ctx.save();
    this.ctx.shadowColor = 'transparent';
    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);
    this.ctx.drawImage(this.offCanvas, 0, 0);
    this.ctx.restore();
  }

  /**
   * 导出为 PDF
   */
  exportToPDF(products: ProductData[], config: LabelConfig): void {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [this.LABEL_WIDTH, this.LABEL_HEIGHT],
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    // 添加微软雅黑字体
    pdf.addFileToVFS('msyh.ttf', MicrosoftYaHeiFont);
    pdf.addFont('msyh.ttf', 'Microsoft YaHei', 'normal');
    pdf.setFont('Microsoft YaHei');

    let isFirstPage = true;
    const enabledStyles = this.getEnabledStyles(config.styles);

    // 遍历每个产品
    products.forEach((product) => {
      // 按 5000 分包
      const packages = this.splitByQuantity(product.quantity);

      // 为每个分包生成标签
      packages.forEach((packageQty) => {
        enabledStyles.forEach((style) => {
          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;

          const labelData = this.prepareLabelData(product, packageQty, style, false);
          this.drawLabelToPDF(pdf, labelData, config.fontSize);
        });
      });

      // 生成备品标签
      enabledStyles.forEach((style) => {
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        const labelData = this.prepareLabelData(product, config.spareQuantity, style, true);
        this.drawLabelToPDF(pdf, labelData, config.fontSize);
      });
    });

    // 生成文件名
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const filename = `${dateStr}_华旺标签.pdf`;

    pdf.save(filename);
  }

  /**
   * 准备标签数据
   */
  private prepareLabelData(
    product: ProductData,
    quantity: number,
    style: string,
    isSpare: boolean
  ): LabelData {
    const styleName = STYLE_NAMES[style];
    const productName = isSpare
      ? `${product.productName}-${styleName}-备品`
      : `${product.productName}-${styleName}`;

    const quantityStr = quantity > 0 ? `${quantity}张` : '';

    return {
      productName,
      orderNumber: product.orderNumber,
      productCode: product.productCode,
      quantity: quantityStr,
      remarks: product.remarks
    };
  }

  /**
   * 获取启用的款式列表
   */
  private getEnabledStyles(styles: StyleLabels): string[] {
    const enabled: string[] = [];
    if (styles.chinese) enabled.push('chinese');
    if (styles.english) enabled.push('english');
    if (styles.silver) enabled.push('silver');
    return enabled;
  }

  /**
   * 按 5000 分包
   */
  private splitByQuantity(totalQuantity: number): number[] {
    const packages: number[] = [];
    let remaining = totalQuantity;

    while (remaining > 0) {
      const packageQty = Math.min(remaining, 5000);
      packages.push(packageQty);
      remaining -= packageQty;
    }

    return packages;
  }

  /**
   * 绘制标签到 PDF
   */
  private drawLabelToPDF(pdf: jsPDF, labelData: LabelData, fontSize: number): void {
    const lineWidthMm = (this.LINE_WIDTH / 72) * 25.4; // pt 转 mm

    pdf.setLineWidth(lineWidthMm);
    pdf.setFontSize(fontSize);

    const rows = [
      { label: '品 名', value: labelData.productName },
      { label: '订单号', value: labelData.orderNumber },
      { label: '货 号', value: labelData.productCode },
      { label: '数 量', value: labelData.quantity },
      { label: '备 注', value: labelData.remarks }
    ];

    rows.forEach((row, index) => {
      const y = index * this.ROW_HEIGHT;

      // 绘制单元格边框
      pdf.rect(0, y, this.COL1_WIDTH, this.ROW_HEIGHT);
      pdf.rect(this.COL1_WIDTH, y, this.COL2_WIDTH, this.ROW_HEIGHT);

      // 绘制左列文本（居中）
      const labelX = this.COL1_WIDTH / 2;
      const labelY = y + this.ROW_HEIGHT / 2 + fontSize * 0.1;
      pdf.text(row.label, labelX, labelY, { align: 'center' });

      // 绘制右列文本（左对齐）
      const valueX = this.COL1_WIDTH + 1;
      const valueY = y + this.ROW_HEIGHT / 2 + fontSize * 0.1;

      if (row.value) {
        // 处理文字换行
        const maxWidth = this.COL2_WIDTH - 2;
        const lines = pdf.splitTextToSize(row.value, maxWidth);
        pdf.text(lines, valueX, valueY, { baseline: 'middle' });
      }
    });
  }
}

export default LabelRenderer;
