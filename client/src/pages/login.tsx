import { useState } from "react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Fingerprint, Lock, Users } from "lucide-react";

const adminUsers = [
  { value: "admin", label: "Administrador Principal" },
  { value: "admin1", label: "Administrador 1" },
  { value: "admin2", label: "Administrador 2" },
  { value: "admin3", label: "Administrador 3" },
  { value: "admin4", label: "Administrador 4" }
];

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await auth.login(username, password);
      auth.setStoredUser(response.user);
      const userLabel = adminUsers.find(admin => admin.value === response.user.username)?.label || response.user.username;
      toast({
        title: "Acceso autorizado",
        description: `Sesión iniciada como ${userLabel}`,
      });
      // Force page reload to trigger router update
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "Credenciales incorrectas",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="bg-dark-surface terminal-border w-full max-w-md mx-4">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="text-matrix text-2xl font-mono font-bold mb-2 flex items-center justify-center">
              <Fingerprint className="mr-2" />
              BiometricAuth Portal
            </div>
            <div className="text-gray-400 text-sm font-mono">
              Sistema de Validación Biométrica v2.1.4
            </div>
          </div>

          {/* Terminal-style login prompt */}
          <div className="bg-black rounded p-4 mb-6 font-mono text-sm">
            <div className="text-matrix mb-2">root@biometric-portal:~$ auth --login</div>
            <div className="text-gray-400 mb-1">Iniciando sesión segura...</div>
            <div className="text-cyber">
              <span className="typing-effect">Seleccione usuario administrativo</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="block text-gray-300 text-sm font-mono mb-2 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Seleccionar Usuario:
              </Label>
              <Select value={username} onValueChange={setUsername}>
                <SelectTrigger className="w-full bg-black terminal-border text-matrix font-mono focus:shadow-lg focus:shadow-matrix/20">
                  <SelectValue placeholder="Selecciona un administrador" />
                </SelectTrigger>
                <SelectContent className="bg-black border-dark-border">
                  {adminUsers.map((admin) => (
                    <SelectItem key={admin.value} value={admin.value} className="text-matrix font-mono hover:bg-gray-800">
                      {admin.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-6">
              <Label className="block text-gray-300 text-sm font-mono mb-2">
                Contraseña:
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black terminal-border text-matrix font-mono focus:shadow-lg focus:shadow-matrix/20"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-matrix to-cyber text-black font-bold py-3 px-4 font-mono hover:shadow-lg hover:shadow-matrix/50 transition-all duration-300"
            >
              <Lock className="mr-2 h-4 w-4" />
              {isLoading ? "AUTENTICANDO..." : "ACCEDER AL SISTEMA"}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  );
}
