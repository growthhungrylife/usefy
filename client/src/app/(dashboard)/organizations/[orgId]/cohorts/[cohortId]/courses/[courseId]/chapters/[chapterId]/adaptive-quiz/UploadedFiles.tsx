import { useState, useEffect } from 'react';
import { Document, Page, } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { FileText, X, Loader2 } from "lucide-react";
import * as pdfjs from "pdfjs-dist"
import "pdfjs-dist/build/pdf.worker.min.mjs";
import PDFViewerModal from '@/components/PDFViewerModal';
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { useMemo } from 'react';

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`
}
else {
  pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.min.mjs"
}


interface UploadedFilesProps {
  files: Array<{
    fileId: string;
    title: string;
    description?: string;
    fileUrl: string;
  }>;
}

const UploadedFiles = ({ files }: UploadedFilesProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const documentOptions = useMemo(() => ({
    httpHeaders: {
      'Access-Control-Allow-Origin': '*',
    },
  }), []);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setIsLoading(false);
    setError(null);
    setNumPages(numPages);
  };

  const handleDocumentLoadError = (error: Error) => {
    setIsLoading(false);
    setError('Failed to load PDF. Please check the file URL.');
    console.error('PDF load error:', error);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 mt-5">
        <FileText className="w-5 h-5" /> Study Materials ({files.length})
      </h3>

      <div className="grid gap-4">
        {files.map((file) => (
          <div key={file.fileId} className="border rounded-lg p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{file.title}</h4>
                {file.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {file.description}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (file.fileUrl) {
                    setError(null);
                    setIsLoading(true);
                    setSelectedFile(file.fileUrl);
                  }
                }}
              >
                View PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      <PDFViewerModal isOpen={!!selectedFile} onClose={() => setSelectedFile(null)}>
        <div className="bg-background rounded-lg p-6 h-auto max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              {files.find(f => f.fileUrl === selectedFile)?.title}
            </h3>
            <Button
              className='w-15 h-15'
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-10 h-10" />
            </Button>
          </div>

          <div className="relative flex-1 overflow-auto">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}

            {error && (
              <div className="text-center p-8 text-red-500">
                {error}
              </div>
            )}

            {selectedFile && !error && (
              <Document
              file={selectedFile}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              options={documentOptions}
              className="pdf-viewer"
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  className="border rounded bg-white"
                  loading={(
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                />
              </Document>
            )}

            {!isLoading && !error && (
              <div className="sticky bottom-0 bg-background border-t pt-4 mt-4 z-50">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-gray-800">
                    <Button
                      variant="outline"
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                      disabled={pageNumber >= numPages}
                    >
                      Next
                    </Button>
                  </div>

                  <span className="text-sm text-gray-800 mt-2 mr-7">
                    Page {pageNumber} of {numPages}
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-gray-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                      >
                        -
                      </Button>
                      <span className="text-sm w-12 mt-2 text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(s => Math.min(2, s + 0.25))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PDFViewerModal>
    </div>
  );
};

export default UploadedFiles;
