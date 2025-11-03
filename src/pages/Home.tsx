import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Image, Video, Search } from "lucide-react";
import Navbar from "@/components/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Galeria de Batismos
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Ministério Sede do Espírito Santo
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Reviva os momentos especiais dos batismos. Explore fotos e vídeos em alta qualidade, 
              busque por reconhecimento facial e baixe suas memórias.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="shadow-medium hover:shadow-glow transition-smooth">
                <Link to="/eventos">
                  <Calendar className="mr-2 h-5 w-5" />
                  Ver Eventos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-lg bg-card shadow-soft hover:shadow-medium transition-smooth animate-fade-in">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Image className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Fotos em Alta Qualidade</h3>
              <p className="text-muted-foreground">
                Visualize e baixe fotos dos batismos em resolução máxima
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg bg-card shadow-soft hover:shadow-medium transition-smooth animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Vídeos Especiais</h3>
              <p className="text-muted-foreground">
                Assista aos momentos mais emocionantes em vídeo
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg bg-card shadow-soft hover:shadow-medium transition-smooth animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Busca Inteligente</h3>
              <p className="text-muted-foreground">
                Encontre suas fotos usando reconhecimento facial com IA
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para explorar?
            </h2>
            <p className="text-lg text-muted-foreground">
              Navegue pelos eventos e descubra todos os momentos especiais
            </p>
            <Button asChild size="lg" className="shadow-medium">
              <Link to="/eventos">
                <Calendar className="mr-2 h-5 w-5" />
                Ver Todos os Eventos
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;