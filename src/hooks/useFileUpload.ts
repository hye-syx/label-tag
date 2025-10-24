import { useState, useCallback } from 'react';
  import { useRouter } from 'next/navigation';
  import { UploadStatus, ExcelFile } from '@/types';
  import { parseExcelFile } from '@/lib/excelParser';

  export const useFileUpload = () => {
    const [uploadStatus, setUploadStatus] =
  useState<UploadStatus>({
      status: 'idle'
    });
    const router = useRouter();

    const handleFileSelect = useCallback(async (files:
  FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];

      // 验证文件类型
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setUploadStatus({
          status: 'error',
          message: '请选择 Excel 文件（.xlsx 或 .xls 格式）'
        });
        return;
      }

      setUploadStatus({ status: 'uploading' });

      try {
        // 解析Excel文件
        const products = await parseExcelFile(file);

        // 将数据存储到localStorage以便标签页面使用
        localStorage.setItem('labelData',
  JSON.stringify(products));

        setUploadStatus({
          status: 'success',
          message: `成功解析 ${products.length} 条产品数据`,
          data: products
        });

        // 延迟一下让用户看到成功状态，然后自动跳转
        setTimeout(() => {
          router.push('/labels');
        }, 1000);

      } catch (error) {
        setUploadStatus({
          status: 'error',
          message: error instanceof Error ? error.message :
  '文件解析失败'
        });
      }
    }, [router]);

    const resetUpload = useCallback(() => {
      setUploadStatus({ status: 'idle' });
    }, []);

    return {
      uploadStatus,
      handleFileSelect,
      resetUpload
    };
  };