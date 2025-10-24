'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductData } from '@/types';
import LabelRenderer from '@/lib/LabelRenderer';

interface LabelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: ProductData[];
}

export function LabelSettingsDialog({
  open,
  onOpenChange,
  selectedProducts,
}: LabelSettingsDialogProps) {
  const [spareQuantity, setSpareQuantity] = useState(200);
  const [fontSize, setFontSize] = useState(10);
  const [styles, setStyles] = useState({
    chinese: true,
    english: true,
    silver: true,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<LabelRenderer | null>(null);

  // 当弹窗打开时重置所有状态
  useEffect(() => {
    if (!open) {
      // 弹窗关闭后重置状态，为下次打开做准备
      setTimeout(() => {
        setSpareQuantity(200);
        setFontSize(10);
        setStyles({
          chinese: true,
          english: true,
          silver: true,
        });
      }, 300); // 等待关闭动画完成
    }
  }, [open]);

  // 初始化 Canvas 渲染器
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new LabelRenderer(canvasRef.current);
    }
  }, []);

  // 计算逻辑
  const calculateLabels = () => {
    const totalQuantity = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
    const enabledStyles = Object.values(styles).filter(Boolean).length;

    // 常规标签：按 5000 分包
    const regularLabels = Math.ceil(totalQuantity / 5000);

    // 备品标签：每个产品 1 张
    const spareLabels = selectedProducts.length;

    // 总标签数
    const totalLabels = (regularLabels + spareLabels) * enabledStyles;

    return {
      selectedCount: selectedProducts.length,
      enabledStyles,
      regularLabels: regularLabels * enabledStyles,
      spareLabels: spareLabels * enabledStyles,
      totalLabels,
    };
  };

  const stats = calculateLabels();

  const handleStyleChange = (style: 'chinese' | 'english' | 'silver') => {
    setStyles(prev => ({ ...prev, [style]: !prev[style] }));
  };

  // 预览第一个产品的第一个款式
  const handlePreview = () => {
    if (!rendererRef.current || selectedProducts.length === 0) return;

    const firstProduct = selectedProducts[0];
    const firstStyle = styles.chinese ? 'chinese' : styles.english ? 'english' : 'silver';
    const styleName = firstStyle === 'chinese' ? '中文吊牌' : firstStyle === 'english' ? '英文吊牌' : '烫银吊牌';

    const labelData = {
      productName: `${firstProduct.productName}-${styleName}`,
      orderNumber: firstProduct.orderNumber,
      productCode: firstProduct.productCode,
      quantity: `${firstProduct.quantity}张`,
      remarks: firstProduct.remarks
    };

    rendererRef.current.render(labelData, fontSize);
  };

  const handleConfirm = () => {
    if (!rendererRef.current) return;

    rendererRef.current.exportToPDF(selectedProducts, {
      spareQuantity,
      fontSize,
      styles
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">生成标签设置</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[400px_1fr] gap-6 h-full overflow-hidden">
          {/* 左侧：设置区域 */}
          <div className="space-y-4 overflow-y-auto pr-2">
            {/* 提示信息 */}
            <p className="text-sm text-gray-600">
              配置标签生成参数，系统暂且自动拆分超过 5000 数量的标签
            </p>

          {/* 备品数量 */}
          <div className="space-y-2">
            <Label htmlFor="spare-quantity">
              备品数量 <span className="text-gray-500">(每个产品款式)</span>
            </Label>
            <Input
              id="spare-quantity"
              type="number"
              value={spareQuantity}
              onChange={(e) => setSpareQuantity(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              每个产品的备件默认式都会生成一张备品标签
            </p>
          </div>

          {/* 标签字体大小 */}
          <div className="space-y-2">
            <Label htmlFor="font-size">标签字体大小</Label>
            <Input
              id="font-size"
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 选择标签款式 */}
          <div className="space-y-2">
            <Label>选择标签款式</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chinese"
                  checked={styles.chinese}
                  onCheckedChange={() => handleStyleChange('chinese')}
                />
                <label htmlFor="chinese" className="text-sm cursor-pointer">
                  中文吊牌
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="english"
                  checked={styles.english}
                  onCheckedChange={() => handleStyleChange('english')}
                />
                <label htmlFor="english" className="text-sm cursor-pointer">
                  英文吊牌
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="silver"
                  checked={styles.silver}
                  onCheckedChange={() => handleStyleChange('silver')}
                />
                <label htmlFor="silver" className="text-sm cursor-pointer">
                  烫银吊牌
                </label>
              </div>
            </div>
          </div>

          {/* 生成摘要 */}
          <div className="bg-gray-50 p-4 rounded space-y-2">
            <h3 className="font-medium text-sm">生成摘要</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>选择产品：{stats.selectedCount}</div>
              <div>启用款式：{stats.enabledStyles}</div>
              <div>常规标签：{stats.regularLabels} 张</div>
              <div>备品标签：{stats.spareLabels} 张</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="w-full"
            >
              刷新预览
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-black hover:bg-gray-800 text-white w-full"
              disabled={stats.enabledStyles === 0}
            >
              确认生成
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              取消
            </Button>
          </div>
          </div>

          {/* 右侧：预览区域 */}
          <div className="flex flex-col h-full">
            <div className="flex-1 border rounded-lg bg-gray-50 flex flex-col overflow-hidden">
              <div className="p-4 border-b bg-white">
                <h3 className="font-medium">预览</h3>
              </div>
              <div className="flex-1 p-4 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
