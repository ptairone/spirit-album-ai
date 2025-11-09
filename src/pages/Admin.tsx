import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Upload, Loader2, CheckCircle2, ImagePlus, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import BulkMediaUploader from "@/components/BulkMediaUploader";
import { ExternalVideoManager, ExternalVideo } from "@/components/ExternalVideoManager";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Create event dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);

  // Existing events state
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadMediaFiles, setUploadMediaFiles] = useState<File[]>([]);
  const [uploadMediaMetadata, setUploadMediaMetadata] = useState<{ name?: string; description?: string }[]>([]);
  const [uploadExternalVideos, setUploadExternalVideos] = useState<ExternalVideo[]>([]);

  useEffect(() => {
    checkAdminAccess();
    fetchEvents();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!userRole) {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      toast.error("Erro ao carregar eventos");
      return;
    }

    setEvents(data || []);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast.error("Erro ao excluir evento");
      return;
    }

    toast.success("Evento excluído com sucesso");
    fetchEvents();
  };

  const openUploadDialog = (event: any) => {
    setSelectedEvent(event);
    setUploadMediaFiles([]);
    setUploadMediaMetadata([]);
    setUploadExternalVideos([]);
    setIsUploadDialogOpen(true);
  };

  const handleUploadToExistingEvent = async () => {
    if (!selectedEvent || (uploadMediaFiles.length === 0 && uploadExternalVideos.length === 0)) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const totalItems = uploadMediaFiles.length + uploadExternalVideos.length;
      toast.info(`Enviando ${totalItems} item(s)...`);
      
      let fileSuccessCount = 0;
      let fileErrorCount = 0;

      // Upload files
      for (let i = 0; i < uploadMediaFiles.length; i++) {
        const file = uploadMediaFiles[i];
        
        try {
          const fileExt = file.name.split('.').pop();
          const filePath = `${selectedEvent.id}/${Date.now()}-${file.name}`;
          
          const { data: fileData, error: uploadError } = await supabase.storage
            .from('event-media')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('event-media')
            .getPublicUrl(fileData.path);

          const fileType = file.type.startsWith('video/') ? 'video' : 'photo';
          const meta = uploadMediaMetadata[i] || {};

          await supabase
            .from('media')
            .insert({
              event_id: selectedEvent.id,
              file_url: publicUrl,
              file_type: fileType,
              file_size: file.size,
              uploaded_by: session.user.id,
              name: meta.name || null,
              description: meta.description || null
            });

          fileSuccessCount++;
        } catch (error) {
          console.error(`Erro ao enviar ${file.name}:`, error);
          fileErrorCount++;
        }
      }

      // Insert external videos from Google Drive
      if (uploadExternalVideos.length > 0) {
        try {
          const externalVideoInserts = uploadExternalVideos.map(video => ({
            event_id: selectedEvent.id,
            file_url: video.driveLink,
            file_type: 'video',
            uploaded_by: session.user.id,
            name: video.name,
            description: video.description || null,
            is_external: true
          }));

          await supabase.from('media').insert(externalVideoInserts);
          toast.success(`${uploadExternalVideos.length} vídeo(s) do Google Drive adicionado(s)!`);
        } catch (error) {
          console.error('Erro ao adicionar vídeos externos:', error);
          toast.error('Erro ao adicionar vídeos do Google Drive');
        }
      }

      if (fileSuccessCount > 0) {
        toast.success(`${fileSuccessCount} arquivo(s) enviado(s) com sucesso!`);
      }
      if (fileErrorCount > 0) {
        toast.error(`${fileErrorCount} arquivo(s) falharam no upload`);
      }

      setIsUploadDialogOpen(false);
      setUploadMediaFiles([]);
      setUploadMediaMetadata([]);
      setUploadExternalVideos([]);
      setSelectedEvent(null);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erro ao enviar mídias");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      let coverImageUrl = "";

      // Upload cover image if exists
      if (coverImage) {
        const coverExt = coverImage.name.split('.').pop();
        const coverPath = `${Date.now()}-cover.${coverExt}`;
        
        const { data: coverData, error: coverError } = await supabase.storage
          .from('event-media')
          .upload(coverPath, coverImage);

        if (coverError) throw coverError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-media')
          .getPublicUrl(coverData.path);
        
        coverImageUrl = publicUrl;
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title,
          description,
          event_date: eventDate,
          cover_image_url: coverImageUrl,
          created_by: session.user.id
        })
        .select()
        .single();

      if (eventError) throw eventError;

      toast.success("Evento criado com sucesso!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setEventDate("");
      setCoverImage(null);
      setIsCreateDialogOpen(false);
      
      // Refresh events list
      fetchEvents();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erro ao criar evento");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Eventos Criados</h1>
            <p className="text-muted-foreground">
              Gerencie os eventos e suas mídias
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
            <Calendar className="mr-2 h-5 w-5" />
            Criar Novo Evento
          </Button>
        </div>

        {events.length > 0 ? (
          <div className="space-y-4 animate-fade-in">
            {events.map((event) => (
              <Card key={event.id} className="shadow-medium hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {format(new Date(event.event_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openUploadDialog(event)}
                      >
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Adicionar Mídias
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-medium animate-fade-in">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro evento para começar
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Criar Primeiro Evento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Evento</DialogTitle>
            <DialogDescription>
              Preencha as informações básicas do evento
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Evento *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Batismo - Janeiro 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o evento..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Data do Evento *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Imagem de Capa</Label>
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
              />
              {coverImage && (
                <p className="text-sm text-muted-foreground">
                  Selecionado: {coverImage.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Criar Evento
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload to Existing Event Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Mídias</DialogTitle>
            <DialogDescription>
              Envie fotos, vídeos e links do Google Drive para {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Upload de Fotos e Vídeos</Label>
              <BulkMediaUploader
                onFilesChange={(files, meta) => {
                  setUploadMediaFiles(files);
                  setUploadMediaMetadata(meta || []);
                }}
                selectedFiles={uploadMediaFiles}
                metadata={uploadMediaMetadata}
              />
            </div>

            <div className="space-y-2">
              <Label>Vídeos do Google Drive</Label>
              <Card className="p-4 bg-accent/5">
                <ExternalVideoManager
                  videos={uploadExternalVideos}
                  onVideosChange={setUploadExternalVideos}
                />
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadToExistingEvent}
              disabled={uploading || (uploadMediaFiles.length === 0 && uploadExternalVideos.length === 0)}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar {uploadMediaFiles.length + uploadExternalVideos.length} item(s)
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;