import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, onClose, pdfUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-4 w-11/12 h-11/12 relative">
        <Button variant="ghost" className="absolute top-2 right-2" onClick={onClose}>
          <X size={24} />
        </Button>
        <iframe src={pdfUrl} className="w-full h-full" title="Report PDF" />
      </div>
    </div>
  );
};

export default PdfViewerModal;