import * as XLSX from 'xlsx';
import { ProductData } from '@/types';

// 定义关键字映射
const COLUMN_KEYWORDS = {
    productName: ['产品名称', '品名', '商品名称',
        '货品名称'],
    orderNumber: ['订单编号'],
    productCode: ['产品编号', '货号', '商品编号', '款号'],
    quantity: ['数量', '件数', '总数'],
    remarks: ['批次', '备注', '说明', '批号']
};

// 查找关键字所在的单元格位置
const findKeywordPosition = (worksheet: XLSX.WorkSheet,
    keywords: string[]): { row: number, col: number } | null => {
    const range = XLSX.utils.decode_range(worksheet['!ref']
        || 'A1:Z100');

    for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({
                r: row,
                c: col
            });
            const cell = worksheet[cellAddress];

            if (cell && cell.v) {
                const cellValue = cell.v.toString().trim();
                for (const keyword of keywords) {
                    if (cellValue === keyword) {
                        return { row, col };
                    }
                }
            }
        }
    }
    return null;
};

const getCellValue = (worksheet: XLSX.WorkSheet, row: number,
    col: number): string => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];

    return cell && cell.v ? cell.v.toString().trim() : '';
};

const parseQuantity = (value: string): number => {
    const normalizedValue = value.replace(/,/g, '');
    const parsedValue = parseInt(normalizedValue, 10);

    return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

// 按行提取数据，避免单列空值导致字段错位
const extractRowData = (worksheet: XLSX.WorkSheet, positions: {
    productName: { row: number, col: number };
    orderNumber: { row: number, col: number };
    productCode: { row: number, col: number };
    quantity: { row: number, col: number };
    remarks: { row: number, col: number };
}): ProductData[] => {
    const range = XLSX.utils.decode_range(worksheet['!ref']
        || 'A1:Z100');
    const products: ProductData[] = [];
    const startRow = Math.max(
        positions.productName.row,
        positions.orderNumber.row,
        positions.productCode.row,
        positions.quantity.row,
        positions.remarks.row
    ) + 1;

    for (let row = startRow; row <= range.e.r; row++) {
        const productName = getCellValue(worksheet, row,
            positions.productName.col);
        const orderNumber = getCellValue(worksheet, row,
            positions.orderNumber.col);
        const productCode = getCellValue(worksheet, row,
            positions.productCode.col);
        const quantity = getCellValue(worksheet, row,
            positions.quantity.col);
        const remarks = getCellValue(worksheet, row,
            positions.remarks.col);

        const isEmptyRow = !productName && !orderNumber &&
            !productCode && !quantity && !remarks;

        if (isEmptyRow) {
            continue;
        }

        products.push({
            id: `product-${products.length + 1}`,
            productName,
            orderNumber,
            productCode,
            quantity: parseQuantity(quantity),
            remarks
        });
    }

    return products;
};

export const parseExcelFile = async (file: File):
    Promise<ProductData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, {
                    type: 'binary'
                });

                // 获取第一个工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // 查找各关键字的位置
                const productNamePos =
                    findKeywordPosition(worksheet,
                        COLUMN_KEYWORDS.productName);
                const orderNumberPos =
                    findKeywordPosition(worksheet,
                        COLUMN_KEYWORDS.orderNumber);
                const productCodePos =
                    findKeywordPosition(worksheet,
                        COLUMN_KEYWORDS.productCode);
                const quantityPos = findKeywordPosition(worksheet,
                    COLUMN_KEYWORDS.quantity);
                const remarksPos = findKeywordPosition(worksheet,
                    COLUMN_KEYWORDS.remarks);

                console.log('关键字位置:', {
                    productName: productNamePos,
                    orderNumber: orderNumberPos,
                    productCode: productCodePos,
                    quantity: quantityPos,
                    remarks: remarksPos
                });

                // 检查必需的列是否找到
                if (!productNamePos) {
                    throw new Error('未找到产品名称列，请检查表格是否包含：产品名称、品名等关键字');
                }
                if (!orderNumberPos) {
                    throw new Error('未找到订单编号列，请检查表格是否包含：订单编号');
                }
                if (!productCodePos) {
                    throw new Error('未找到货号列，请检查表格是否包含：产品编号、货号、商品编号、款号等关键字');
                }
                if (!remarksPos) {
                    throw new Error('未找到批次列，请检查表格是否包含：批次、备注、说明、批号等关键字');
                }
                if (!quantityPos) {
                    throw new Error('未找到数量列，请检查表格是否包含：数量、件数、总数等关键字');
                }

                const products = extractRowData(worksheet, {
                    productName: productNamePos,
                    orderNumber: orderNumberPos,
                    productCode: productCodePos,
                    quantity: quantityPos,
                    remarks: remarksPos
                });

                if (products.length === 0) {
                    throw new Error('未找到有效的产品数据');
                }

                resolve(products);
            } catch (error) {
                reject(new Error(error instanceof Error ?
                    error.message : 'Excel文件解析失败'));
            }
        };

        reader.onerror = () => {
            reject(new Error('文件读取失败'));
        };

        reader.readAsBinaryString(file);
    });
};
