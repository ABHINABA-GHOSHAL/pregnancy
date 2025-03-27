import React, { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FileUp, Upload, Image as ImageIcon, Loader2 } from "lucide-react";

interface UltrasoundImage {
  id: string;
  file: File;
  preview: string;
}

interface UltrasoundImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
}

const UltrasoundImageUploader: React.FC<UltrasoundImageUploaderProps> = ({ onImageUpload }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UltrasoundImage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{
    error?: string;
    orientation?: { prediction: string; confidence: number };
    plane?: { prediction: string; confidence: number };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (!file.type.match('image/(jpeg|jpg|png|gif)')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPEG, PNG, or GIF).",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      const newImage: UltrasoundImage = {
        id: Date.now().toString(),
        file,
        preview: URL.createObjectURL(file)
      };
      setSelectedImage(newImage);
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
      const file = e.dataTransfer.files[0];
      
      if (!file.type.match('image/(jpeg|jpg|png|gif)')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPEG, PNG, or GIF).",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      const newImage: UltrasoundImage = {
        id: Date.now().toString(),
        file,
        preview: URL.createObjectURL(file)
      };
      setSelectedImage(newImage);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please select an ultrasound image to upload.",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      const imageUrl = await uploadFile(selectedImage.file);
      onImageUpload(imageUrl);
      toast({
        title: "Upload successful",
        description: "Your ultrasound image has been uploaded successfully."
      });
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive"
      });
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast({ title: "No image selected", description: "Please select an ultrasound image to analyze.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setPredictionResult(null);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage.file);
      console.log("Sending POST request to /predict");
      const response = await fetch('http://localhost:3000/predict', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Prediction request failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setPredictionResult({
        orientation: { prediction: result.orientation.prediction, confidence: result.orientation.confidence },
        plane: { prediction: result.plane.prediction, confidence: result.plane.confidence }
      });
      toast({ title: "Analysis complete", description: "Your ultrasound image has been analyzed successfully." });
    } catch (error) {
      setPredictionResult({ error: `Failed to analyze the image: ${error.message}` });
      toast({ title: "Analysis failed", description: "There was an error analyzing your image. Please try again.", variant: "destructive" });
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedImage ? (
          <div className="flex flex-col items-center space-y-3 w-full">
            <div className="relative w-full max-w-xs overflow-hidden rounded-lg shadow-md">
              <img 
                src={selectedImage?.preview} 
                alt="Ultrasound preview" 
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="text-sm font-medium">{selectedImage.file.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedImage.file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <ImageIcon className="text-gray-400 mb-2" size={32} />
            <p className="text-gray-600 font-medium">Drag and drop ultrasound image here</p>
            <p className="text-gray-500 text-sm">JPG, JPEG, PNG, GIF • Max 10MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse images
        </Button>
        <Button
          onClick={analyzeImage}
          disabled={!selectedImage || analyzing}
          className="flex-1 materna-button"
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Analyze Image
            </span>
          )}
        </Button>
      </div>
      
      {predictionResult && (
        <Card className="p-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
          {predictionResult.error ? (
            <p className="text-red-500">{predictionResult.error}</p>
          ) : (
            <div className="space-y-3">
              {predictionResult.orientation && (
                <div>
                  <p className="font-medium">Fetus Orientation:</p>
                  <p className="text-sm">
                    <span className="font-semibold">{predictionResult.orientation.prediction}</span> 
                    <span className="text-gray-500 ml-2">({predictionResult.orientation.confidence.toFixed(2)}% confidence)</span>
                  </p>
                </div>
              )}
              {predictionResult.plane && (
                <div>
                  <p className="font-medium">Ultrasound Plane:</p>
                  <p className="text-sm">
                    <span className="font-semibold">{predictionResult.plane.prediction}</span> 
                    <span className="text-gray-500 ml-2">({predictionResult.plane.confidence.toFixed(2)}% confidence)</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default UltrasoundImageUploader;