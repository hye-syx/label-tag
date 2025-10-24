
'use client';

import { useRef } from 'react';
import {
  Upload, FileSpreadsheet, AlertCircle,
  CheckCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from
  '@/components/ui/card';
import { useFileUpload } from '@/hooks/useFileUpload';
import router from 'next/router';

export default function Home() {
  const { uploadStatus, handleFileSelect, resetUpload }
    = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e:
    React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex 
items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-black 
text-center">华旺标签生成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium 
mb-4">拖拽文件到此处</h2>
            <p className="text-sm text-gray-600 mb-6">
              适用 Excel 文件<br />
              支持 xlsx 或 xls 格式
            </p>

            <div
              className="border-2 border-dashed 
border-gray-300 rounded-lg p-12 hover:border-blue-400 
transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={handleButtonClick}
            >
              {uploadStatus.status === 'uploading' ? (
                <Loader2 className="w-16 h-16 
text-blue-500 mx-auto mb-4 animate-spin" />
              ) : uploadStatus.status === 'success' ? (
                <CheckCircle className="w-16 h-16 
text-green-500 mx-auto mb-4" />
              ) : uploadStatus.status === 'error' ? (
                <AlertCircle className="w-16 h-16 
text-red-500 mx-auto mb-4" />
              ) : (
                <Upload className="w-16 h-16 
text-gray-400 mx-auto mb-4" />
              )}

              <p className="text-sm text-gray-500 mb-4">
                {uploadStatus.message ||
                  '文件不符合等号上传格式'}
              </p>

              <Button
                size="lg"
                className="bg-gray-800 
hover:bg-gray-700"
                disabled={uploadStatus.status ===
                  'uploading'}
              >
                {uploadStatus.status === 'uploading' ?
                  '上传中...' : '选择文件'}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
