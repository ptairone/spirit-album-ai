import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface Media {
  id: string;
  file_url: string;
  file_type: string;
  thumbnail_url: string;
  is_external?: boolean;
  name?: string;
  description?: string;
}

interface MediaViewerProps {
  media: Media[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

const MediaViewer = ({ media, currentIndex, open, onOpenChange, onIndexChange }: MediaViewerProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  if (media.length === 0) return null;

  const currentMedia = media[currentIndex];

  const handlePrevious = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : media.length - 1);
  };

  const handleNext = () => {
    onIndexChange(currentIndex < media.length - 1 ? currentIndex + 1 : 0);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      toast.loading("Baixando foto...");
      
      const response = await fetch(currentMedia.file_url);
      const blob = await response.blob();
      
      // Extract filename from URL or use a default
      const urlParts = currentMedia.file_url.split('/');
      const filename = currentMedia.name || urlParts[urlParts.length - 1] || `foto-${currentMedia.id}.jpg`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("Download concluído!");
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao baixar a foto");
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, media.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-[95vh] flex flex-col">
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-center justify-center p-16">
            {currentMedia.file_type === 'photo' ? (
              <img
                src={currentMedia.file_url}
                alt={currentMedia.name || "Foto"}
                className="max-w-full max-h-full object-contain"
              />
            ) : currentMedia.is_external ? (
              <div className="max-w-2xl mx-auto p-8 bg-white/10 rounded-lg text-center">
                <ExternalLink className="h-16 w-16 text-white mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  {currentMedia.name || 'Vídeo Externo'}
                </h3>
                {currentMedia.description && (
                  <p className="text-white/80 mb-6">{currentMedia.description}</p>
                )}
                <p className="text-white/60 mb-4">
                  Este vídeo está hospedado no Google Drive
                </p>
                <p className="text-white/50 text-sm mb-6">
                  Nota: O arquivo precisa estar público no Google Drive para download direto
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {isDownloading ? "Baixando..." : "Baixar Vídeo"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open(currentMedia.file_url, '_blank')}
                    className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Abrir no Drive
                  </Button>
                </div>
              </div>
            ) : (
              <video
                src={currentMedia.file_url}
                controls
                className="max-w-full max-h-full"
                autoPlay
              />
            )}

            {/* Navigation Arrows */}
            {media.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 transition-colors"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 transition-colors"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>

          {/* Bottom Toolbar */}
          <div className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between gap-4">
              {/* Photo Counter */}
              {media.length > 1 && (
                <div className="text-white/90 text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
                  Foto {currentIndex + 1} de {media.length}
                </div>
              )}
              
              {/* Spacer */}
              <div className="flex-1" />

              {/* Download Button - Highlighted */}
              {currentMedia.file_type === 'photo' && (
                <Button
                  size="lg"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg transition-all hover:scale-105"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {isDownloading ? "Baixando..." : "Baixar Foto"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;