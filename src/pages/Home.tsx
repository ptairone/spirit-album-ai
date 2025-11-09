import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Home = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Galeria de Batismos
            </h1>
            <p className="text-lg text-muted-foreground">
              Ministério Sede do Espírito Santo
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando eventos...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
              {events.map((event) => (
                <Link key={event.id} to={`/eventos/${event.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {event.cover_image_url && (
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={event.cover_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                      <div className="flex items-center text-muted-foreground text-sm mb-3">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(event.event_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      {event.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum evento disponível no momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;