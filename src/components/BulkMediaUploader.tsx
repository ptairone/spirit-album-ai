import { useState, useCallback } from "react";
import { X, Upload, Image, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MediaFile {
  file: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  error?: string;
  name?: string;
  description?: string;
}

interface BulkMediaUploaderProps {
  onFilesChange: (files: File[], metadata?: { name?: string; description?: string }[]) => void;
  selectedFiles: File[];
  metadata?: { name?: string; description?: string }[];
}

const BulkMediaUploader = ({ onFilesChange, selectedFiles, metadata = [] }: BulkMediaUploaderProps) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const createPreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  };

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newMediaFiles = Array.from(files).map(file => ({
      file,
      preview: createPreview(file),
      progress: 0,
      uploaded: false
    }));

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
    
    const allFiles = [...selectedFiles, ...Array.from(files)];
    onFilesChange(allFiles);
  }, [selectedFiles, onFilesChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });

    const newSelectedFiles = [...selectedFiles];
    const newMetadata = [...metadata];
    newSelectedFiles.splice(index, 1);
    newMetadata.splice(index, 1);
    onFilesChange(newSelectedFiles, newMetadata);
  };

  const updateMetadata = (index: number, field: 'name' | 'description', value: string) => {
    setMediaFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    const newMetadata = [...metadata];
    newMetadata[index] = { ...newMetadata[index], [field]: value };
    onFilesChange(selectedFiles, newMetadata);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-accent/5'
        }`}
      >
        <input
          type="file"
          id="bulk-upload"
          accept="image/*,video/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="bulk-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-1">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-sm text-muted-foreground">
            Suporta múltiplas fotos e vídeos (máx. 100MB por arquivo)
          </p>
        </label>
      </div>

      {/* Files Grid */}
      {mediaFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {mediaFiles.length} arquivo(s) selecionado(s)
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                mediaFiles.forEach(mf => {
                  if (mf.preview) URL.revokeObjectURL(mf.preview);
                });
                setMediaFiles([]);
                onFilesChange([]);
              }}
            >
              Limpar tudo
            </Button>
          </div>

          <div className="space-y-4">
            {mediaFiles.map((mediaFile, index) => (
              <Card key={index} className="p-4">
                <div className="flex gap-4">
                  {/* Preview */}
                  <div className="relative group flex-shrink-0">
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                      {mediaFile.file.type.startsWith('image/') ? (
                        <img
                          src={mediaFile.preview}
                          alt={mediaFile.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground px-2 text-center">
                            Vídeo
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Metadata form - only for videos */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      {mediaFile.file.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Video className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(mediaFile.file.size)}
                      </span>
                    </div>

                    {mediaFile.file.type.startsWith('video/') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`} className="text-sm">
                            Nome do vídeo
                          </Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="Ex: Momento da chegada"
                            value={mediaFile.name || ''}
                            onChange={(e) => updateMetadata(index, 'name', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`description-${index}`} className="text-sm">
                            Descrição
                          </Label>
                          <Textarea
                            id={`description-${index}`}
                            placeholder="Descreva o momento do vídeo..."
                            rows={2}
                            value={mediaFile.description || ''}
                            onChange={(e) => updateMetadata(index, 'description', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {mediaFile.file.type.startsWith('image/') && (
                      <p className="text-sm text-muted-foreground italic">
                        {mediaFile.file.name}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkMediaUploader;
