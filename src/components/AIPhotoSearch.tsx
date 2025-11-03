import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIPhotoSearchProps {
  eventId: string;
  onSearchResults: (mediaIds: string[]) => void;
}

const AIPhotoSearch = ({ eventId, onSearchResults }: AIPhotoSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleSearch = async () => {
    if (!searchQuery && !uploadedImage) {
      toast.error("Digite uma descrição ou faça upload de uma foto");
      return;
    }

    setIsSearching(true);
    try {
      let imageBase64 = null;
      if (uploadedImage) {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(uploadedImage);
        });
      }

      const { data, error } = await supabase.functions.invoke('search-photos', {
        body: {
          eventId,
          query: searchQuery,
          image: imageBase64
        }
      });

      if (error) throw error;

      if (data?.mediaIds && data.mediaIds.length > 0) {
        onSearchResults(data.mediaIds);
        toast.success(`${data.mediaIds.length} foto(s) encontrada(s)!`);
      } else {
        toast.info("Nenhuma foto encontrada com essa busca");
        onSearchResults([]);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error("Erro ao buscar fotos. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="p-6 mb-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Buscar Fotos com IA</h3>
        </div>
        
        <div className="space-y-3">
          <Input
            placeholder="Descreva o que você procura... (ex: 'pessoa com camisa azul')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSearching}
          />
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="search-image" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth">
                  <Upload className="h-4 w-4" />
                  <span>Ou faça upload de uma foto similar</span>
                </div>
                <input
                  id="search-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isSearching}
                />
              </label>
            </div>
            
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded border-2 border-border"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-smooth"
                  disabled={isSearching}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          onClick={handleSearch} 
          className="w-full"
          disabled={isSearching || (!searchQuery && !uploadedImage)}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Buscar com IA
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default AIPhotoSearch;
