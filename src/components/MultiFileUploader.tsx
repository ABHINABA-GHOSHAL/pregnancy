
import React, { useRef, useState } from "react";
import { FileUp, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ReportFile {
  id: string;
  file: File;
  preview: string;
}

interface MultiFileUploaderProps {
  selectedFiles: ReportFile[];
  onFilesChange: (files: ReportFile[]) => void;
  maxFiles?: number;
  category: string;
  usedSlots: number;
}

const MultiFileUploader: React.FC<MultiFileUploaderProps> = ({
  selectedFiles,
  onFilesChange,
  maxFiles = 10,
  category,
  usedSlots
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const availableSlots = maxFiles - usedSlots;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const filesToAdd = filesArray.slice(0, availableSlots);
      
      const newFiles: ReportFile[] = filesToAdd.map(file => ({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file)
      }));
      
      onFilesChange([...selectedFiles, ...newFiles]);
    }
    
    // Reset input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const filesToAdd = filesArray.slice(0, availableSlots);
      
      const newFiles: ReportFile[] = filesToAdd.map(file => ({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file)
      }));
      
      onFilesChange([...selectedFiles, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = selectedFiles.filter(file => file.id !== id);
    onFilesChange(updatedFiles);
  };

  const remainingSlots = maxFiles - (usedSlots + selectedFiles.length);

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <Label>Upload Reports ({maxFiles - usedSlots} slots available)</Label>
        <span className="text-sm text-gray-500">
          {usedSlots} existing reports / {selectedFiles.length} selected / {maxFiles} limit
        </span>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {selectedFiles.map(file => (
            <div key={file.id} className="border rounded-md p-3 relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-100 hover:bg-red-200"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-3 w-3 text-red-500" />
              </Button>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <FileUp className="text-blue-500" size={20} />
                </div>
                <p className="text-sm font-medium truncate w-full text-center">{file.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {availableSlots > 0 && (
        <>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
              dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400",
              selectedFiles.length >= availableSlots && "opacity-50 pointer-events-none"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center space-y-2">
              <Upload className="text-gray-400 mb-2" size={32} />
              <p className="text-gray-600 font-medium">
                {remainingSlots > 0
                  ? `Drag and drop up to ${remainingSlots} more files`
                  : "Maximum files reached"}
              </p>
              <p className="text-gray-500 text-sm">Limit 200MB per file • PDF, JPG, JPEG, PNG</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileInputChange}
              multiple
              disabled={remainingSlots <= 0}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={remainingSlots <= 0}
          >
            Browse files
          </Button>
        </>
      )}
    </div>
  );
};

export default MultiFileUploader;
