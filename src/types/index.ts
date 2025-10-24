 // 产品数据接口 - 根据实际需求调整
 export interface ProductData {
    id?: string;
    productName: string;    // 品名 ← 产品名称
    orderNumber: string;    // 订单号 ← 订单编号  
    productCode: string;    // 货号 ← 产品编号
    quantity: number;       // 数量 ← 拆分后每张对应数量或者部数量
    remarks: string;        // 备注 ← 批次
  }

  // 文件上传状态
  export interface UploadStatus {
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
    data?: ProductData[];
  }

  // Excel 文件信息
  export interface ExcelFile {
    file: File;
    name: string;
    size: number;
  }