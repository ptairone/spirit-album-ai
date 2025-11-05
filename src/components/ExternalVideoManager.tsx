import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { convertGoogleDriveLink } from "@/lib/utils";

export interface ExternalVideo {
  id: string;
  name: string;
  driveLink: string;
  description?: string;
}

interface ExternalVideoManagerProps {
  videos: ExternalVideo[];
  onVideosChange: (videos: ExternalVideo[]) => void;
}

export const ExternalVideoManager = ({
  videos,
  onVideosChange,
}: ExternalVideoManagerProps) => {
  const [name, setName] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [description, setDescription] = useState("");

  const validateDriveLink = (link: string): boolean => {
    return link.includes("drive.google.com");
  };

  const handleAddVideo = () => {
    if (!name.trim()) {
      toast.error("Por favor, adicione o nome da pessoa");
      return;
    }

    if (!driveLink.trim()) {
      toast.error("Por favor, adicione o link do Google Drive");
      return;
    }

    if (!validateDriveLink(driveLink)) {
      toast.error("Link inválido. Use um link do Google Drive");
      return;
    }

    const newVideo: ExternalVideo = {
      id: crypto.randomUUID(),
      name: name.trim(),
      driveLink: convertGoogleDriveLink(driveLink.trim()),
      description: description.trim() || undefined,
    };

    onVideosChange([...videos, newVideo]);
    setName("");
    setDriveLink("");
    setDescription("");
    toast.success("Vídeo adicionado!");
  };

  const handleRemoveVideo = (id: string) => {
    onVideosChange(videos.filter((v) => v.id !== id));
    toast.success("Vídeo removido");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="person-name">Nome da Pessoa *</Label>
          <Input
            id="person-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João Silva"
          />
        </div>

        <div>
          <Label htmlFor="drive-link">Link do Google Drive *</Label>
          <Input
            id="drive-link"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
          />
        </div>

        <div>
          <Label htmlFor="video-description">Descrição (Opcional)</Label>
          <Textarea
            id="video-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Informações adicionais sobre o vídeo..."
            rows={2}
          />
        </div>

        <Button onClick={handleAddVideo} className="w-full">
          Adicionar Vídeo
        </Button>
      </div>

      {videos.length > 0 && (
        <div className="space-y-2">
          <Label>Vídeos Adicionados ({videos.length})</Label>
          {videos.map((video) => (
            <Card key={video.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{video.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">
                      {video.driveLink}
                    </p>
                    {video.description && (
                      <p className="text-sm text-muted-foreground">
                        {video.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVideo(video.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
