import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download, ExternalLink } from "lucide-react";

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
  if (media.length === 0) return null;

  const currentMedia = media[currentIndex];

  const handlePrevious = () => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : media.length - 1);
  };

  const handleNext = () => {
    onIndexChange(currentIndex < media.length - 1 ? currentIndex + 1 : 0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentMedia.file_url;
    link.download = `media-${currentMedia.id}`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-[95vh] flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 z-50 text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="h-6 w-6" />
          </Button>

          {currentMedia.file_type === 'photo' ? (
            <img
              src={currentMedia.file_url}
              alt="Media"
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
              <p className="text-white/60 mb-6">
                Este vídeo está hospedado no Google Drive
              </p>
              <Button
                size="lg"
                onClick={() => window.open(currentMedia.file_url, '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Abrir no Google Drive
              </Button>
            </div>
          ) : (
            <video
              src={currentMedia.file_url}
              controls
              className="max-w-full max-h-full"
              autoPlay
            />
          )}

          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                {currentIndex + 1} / {media.length}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;