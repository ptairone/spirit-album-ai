import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, Image as ImageIcon, Video as VideoIcon, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import MediaViewer from "@/components/MediaViewer";
import AIPhotoSearch from "@/components/AIPhotoSearch";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  cover_image_url: string;
}

interface Media {
  id: string;
  file_url: string;
  file_type: string;
  thumbnail_url: string;
  created_at: string;
  is_external?: boolean;
  name?: string;
  description?: string;
}

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventAndMedia();
    }
  }, [id]);

  const fetchEventAndMedia = async () => {
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    const { data: mediaData } = await supabase
      .from('media')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false });

    if (eventData) setEvent(eventData);
    if (mediaData) {
      setMedia(mediaData);
      setFilteredMedia(mediaData);
    }
    setLoading(false);
  };

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMedia(prev =>
      prev.includes(mediaId)
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedMedia.length === 0) {
      toast.error("Selecione pelo menos uma mídia para baixar");
      return;
    }

    toast.success(`Baixando ${selectedMedia.length} arquivo(s)...`);
    
    for (const mediaId of selectedMedia) {
      const item = media.find(m => m.id === mediaId);
      if (item) {
        const link = document.createElement('a');
        link.href = item.file_url;
        link.download = `media-${mediaId}`;
        link.click();
      }
    }
  };

  const openViewer = (index: number) => {
    setCurrentMediaIndex(index);
    setViewerOpen(true);
  };

  const handleSearchResults = (mediaIds: string[]) => {
    if (mediaIds.length === 0) {
      setFilteredMedia(media);
      setIsFiltering(false);
    } else {
      const filtered = media.filter(m => mediaIds.includes(m.id));
      setFilteredMedia(filtered);
      setIsFiltering(true);
    }
  };

  const clearFilter = () => {
    setFilteredMedia(media);
    setIsFiltering(false);
  };

  const photos = filteredMedia.filter(m => m.file_type === 'photo');
  const videos = filteredMedia.filter(m => m.file_type === 'video');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-muted-foreground">Evento não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
          <p className="text-muted-foreground mb-2">{event.description}</p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(event.event_date), "d 'de' MMMM, yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>

        {id && <AIPhotoSearch eventId={id} onSearchResults={handleSearchResults} />}

        {isFiltering && (
          <Card className="p-4 mb-6 animate-fade-in bg-accent/10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Mostrando {filteredMedia.length} foto(s) da busca
              </p>
              <Button variant="outline" size="sm" onClick={clearFilter}>
                Limpar Filtro
              </Button>
            </div>
          </Card>
        )}

        {selectedMedia.length > 0 && (
          <Card className="p-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm font-medium">
                {selectedMedia.length} mídia(s) selecionada(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMedia([])}
                >
                  Limpar Seleção
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadSelected}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Selecionadas
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Fotos ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" />
              Vídeos ({videos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            {photos.length === 0 ? (
              <Card className="text-center py-12 animate-fade-in">
                <div className="flex flex-col items-center space-y-4">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    {isFiltering ? 'Nenhuma foto encontrada com essa busca' : 'Nenhuma foto adicionada ainda'}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((item, index) => (
                  <div
                    key={item.id}
                    className={`relative group cursor-pointer animate-fade-in ${
                      selectedMedia.includes(item.id) ? 'ring-2 ring-primary' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      className="aspect-square overflow-hidden rounded-lg bg-muted"
                      onClick={() => openViewer(media.indexOf(item))}
                    >
                      <img
                        src={item.thumbnail_url || item.file_url}
                        alt="Media"
                        className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMediaSelection(item.id);
                      }}
                      className={`absolute top-2 right-2 w-6 h-6 rounded border-2 transition-smooth ${
                        selectedMedia.includes(item.id)
                          ? 'bg-primary border-primary'
                          : 'bg-white/80 border-white/80 hover:bg-primary hover:border-primary'
                      }`}
                    >
                      {selectedMedia.includes(item.id) && (
                        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos">
            {videos.length === 0 ? (
              <Card className="text-center py-12 animate-fade-in">
                <div className="flex flex-col items-center space-y-4">
                  <VideoIcon className="h-16 w-16 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    Nenhum vídeo adicionado ainda
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((item, index) => (
                  <div
                    key={item.id}
                    className={`relative group cursor-pointer animate-fade-in ${
                      selectedMedia.includes(item.id) ? 'ring-2 ring-primary' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      className="aspect-square overflow-hidden rounded-lg bg-muted"
                      onClick={() => {
                        if (item.is_external) {
                          window.open(item.file_url, '_blank');
                        } else {
                          openViewer(media.indexOf(item));
                        }
                      }}
                    >
                      {item.is_external ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white">
                          <ExternalLink className="h-12 w-12 mb-2" />
                          <p className="text-xs font-medium text-center break-words">{item.name || 'Vídeo Externo'}</p>
                          <p className="text-xs opacity-80 mt-1">Google Drive</p>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <VideoIcon className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMediaSelection(item.id);
                      }}
                      className={`absolute top-2 right-2 w-6 h-6 rounded border-2 transition-smooth ${
                        selectedMedia.includes(item.id)
                          ? 'bg-primary border-primary'
                          : 'bg-white/80 border-white/80 hover:bg-primary hover:border-primary'
                      }`}
                    >
                      {selectedMedia.includes(item.id) && (
                        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MediaViewer
        media={media}
        currentIndex={currentMediaIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onIndexChange={setCurrentMediaIndex}
      />
    </div>
  );
};

export default EventDetail;