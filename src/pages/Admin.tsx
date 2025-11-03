import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Upload, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Event form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Upload media files
      if (mediaFiles.length > 0) {
        toast.info(`Enviando ${mediaFiles.length} arquivo(s)...`);
        
        for (const file of mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${event.id}/${Date.now()}-${file.name}`;
          
          const { data: fileData, error: uploadError } = await supabase.storage
            .from('event-media')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('event-media')
            .getPublicUrl(fileData.path);

          const fileType = file.type.startsWith('video/') ? 'video' : 'photo';

          await supabase
            .from('media')
            .insert({
              event_id: event.id,
              file_url: publicUrl,
              file_type: fileType,
              file_size: file.size,
              uploaded_by: session.user.id
            });
        }
      }

      toast.success("Evento criado com sucesso!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setEventDate("");
      setCoverImage(null);
      setMediaFiles([]);
      
      // Navigate to the event
      navigate(`/eventos/${event.id}`);
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
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Administração</h1>
          <p className="text-muted-foreground">
            Crie eventos e faça upload de fotos e vídeos
          </p>
        </div>

        <Card className="shadow-medium animate-fade-in">
          <CardHeader>
            <CardTitle>Criar Novo Evento</CardTitle>
            <CardDescription>
              Preencha os dados do evento de batismo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="mediaFiles">Fotos e Vídeos</Label>
                <Input
                  id="mediaFiles"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaFilesChange}
                />
                {mediaFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {mediaFiles.length} arquivo(s) selecionado(s)
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Criar Evento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;