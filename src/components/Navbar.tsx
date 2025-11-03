import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Menu, X, LogOut, User as UserIcon, Home, Calendar, Shield } from "lucide-react";
import { toast } from "sonner";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Saiu com sucesso");
      navigate("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center text-white font-bold shadow-glow">
              M
            </div>
            <span className="font-semibold text-lg hidden sm:block">Ministério Sede</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2 text-sm font-medium transition-smooth hover:text-primary">
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>
            <Link to="/eventos" className="flex items-center space-x-2 text-sm font-medium transition-smooth hover:text-primary">
              <Calendar className="h-4 w-4" />
              <span>Eventos</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center space-x-2 text-sm font-medium transition-smooth hover:text-primary">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="shadow-soft">
                <Link to="/auth">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-fade-in">
            <Link
              to="/"
              className="flex items-center space-x-2 py-2 text-sm font-medium transition-smooth hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>
            <Link
              to="/eventos"
              className="flex items-center space-x-2 py-2 text-sm font-medium transition-smooth hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar className="h-4 w-4" />
              <span>Eventos</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-2 py-2 text-sm font-medium transition-smooth hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
            <div className="pt-2 border-t border-border">
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              ) : (
                <Button asChild size="sm" className="w-full">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;