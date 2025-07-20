import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserSearch, Fingerprint, Hand, TrendingUp } from "lucide-react";

interface ValidationResult {
  matchingPercentage: number;
  status: string;
  threshold: number;
  record?: {
    curp: string;
    fullName: string;
    ineNumber: string;
    rfc: string;
    status: string;
  };
}

export default function ValidationTab() {
  const [identifierType, setIdentifierType] = useState<"curp" | "ine" | "rfc">("curp");
  const [identifier, setIdentifier] = useState("");
  const [fingerprintData, setFingerprintData] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate fingerprint capture
  const simulateCapture = async () => {
    setIsCapturing(true);
    // Simulate capture delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate mock fingerprint data
    const mockFingerprint = `data:image/png;base64,${btoa(Math.random().toString())}`;
    setFingerprintData(mockFingerprint);
    setIsCapturing(false);
    
    toast({
      title: "Captura completa",
      description: "Huella dactilar capturada exitosamente",
    });
  };

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async () => {
      if (!identifier) {
        throw new Error("Identificador requerido");
      }

      const response = await apiRequest("POST", "/api/institucion/verificar-identidad", {
        identifier,
        identifierType,
        fingerprintData: fingerprintData || undefined
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.found) {
        setValidationResult({
          matchingPercentage: data.biometric?.matchingPercentage || 0,
          status: data.biometric?.status || "no_biometric",
          threshold: data.biometric?.threshold || 85,
          record: data.record
        });
        
        toast({
          title: "Búsqueda exitosa",
          description: "Registro encontrado en el padrón electoral",
        });
      } else {
        setValidationResult(null);
        toast({
          variant: "destructive",
          title: "No encontrado",
          description: "El identificador no existe en el padrón electoral",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error en la búsqueda",
        description: error.message || "Error desconocido",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      case "active":
        return "bg-green-500/20 text-green-400";
      case "inactive":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const getConfidenceLevel = (percentage: number) => {
    if (percentage >= 85) return { level: "ALTO", color: "text-green-400" };
    if (percentage >= 70) return { level: "MEDIO", color: "text-yellow-400" };
    return { level: "BAJO", color: "text-red-400" };
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Search Panel */}
        <Card className="bg-dark-surface terminal-border">
          <CardHeader>
            <CardTitle className="text-lg font-mono font-bold text-matrix flex items-center">
              <UserSearch className="mr-2" />
              Búsqueda de Identidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="block text-gray-300 text-sm font-mono mb-2">
                Tipo de Búsqueda:
              </Label>
              <Select value={identifierType} onValueChange={(value: any) => setIdentifierType(value)}>
                <SelectTrigger className="w-full bg-black terminal-border text-matrix font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-dark-border">
                  <SelectItem value="curp">CURP</SelectItem>
                  <SelectItem value="ine">INE</SelectItem>
                  <SelectItem value="rfc">RFC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-gray-300 text-sm font-mono mb-2">
                Número de Identificación:
              </Label>
              <Input
                type="text"
                placeholder={
                  identifierType === "curp" ? "Ej: LOSM920715MDFPPR08" :
                  identifierType === "rfc" ? "Ej: LOSM920715M87" :
                  "Ej: 9876543210987"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                className="w-full bg-black terminal-border text-matrix font-mono placeholder-gray-600"
              />
              <div className="text-xs text-gray-500 font-mono mt-1">
                {identifierType === "curp" && "Formatos válidos: LOSM920715MDFPPR08, MARC880523HDFTRR05, GAHA950612MDFRNN03"}
                {identifierType === "rfc" && "Formatos válidos: LOSM920715M87, MARC880523H76, GAHA950612M54"}
                {identifierType === "ine" && "Formatos válidos: 9876543210987, 5432167890543, 1357924680135"}
              </div>
            </div>

            <Button
              onClick={() => searchMutation.mutate()}
              disabled={searchMutation.isPending || !identifier}
              className="w-full bg-cyber text-white font-mono font-bold py-3 px-4 hover:bg-opacity-80 transition-all"
            >
              <UserSearch className="mr-2 h-4 w-4" />
              {searchMutation.isPending ? "BUSCANDO..." : "BUSCAR EN PADRÓN"}
            </Button>
          </CardContent>
        </Card>

        {/* Biometric Scanner */}
        <Card className="bg-dark-surface terminal-border">
          <CardHeader>
            <CardTitle className="text-lg font-mono font-bold text-matrix flex items-center">
              <Fingerprint className="mr-2" />
              Escáner Biométrico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="fingerprint-scanner rounded-full w-48 h-48 mx-auto mb-4 flex items-center justify-center scan-line">
              <Fingerprint className={`text-6xl text-matrix ${isCapturing ? 'animate-pulse' : ''}`} />
            </div>

            <div className="text-center space-y-3">
              <div className="text-sm font-mono text-gray-400">Estado del escáner</div>
              <div className="text-matrix font-mono font-bold">
                {isCapturing ? "CAPTURANDO..." : fingerprintData ? "CAPTURA COMPLETA" : "LISTO PARA CAPTURA"}
              </div>

              <Button
                onClick={simulateCapture}
                disabled={isCapturing}
                className={`w-full font-mono font-bold py-3 px-4 transition-all ${
                  fingerprintData && !isCapturing
                    ? "bg-green-500 text-white"
                    : "bg-gradient-to-r from-matrix to-cyber text-black"
                }`}
              >
                <Hand className="mr-2 h-4 w-4" />
                {isCapturing ? "CAPTURANDO..." : fingerprintData ? "RECAPTURAR" : "INICIAR CAPTURA"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Panel */}
      {validationResult && (
        <Card className="bg-dark-surface terminal-border">
          <CardHeader>
            <CardTitle className="text-lg font-mono font-bold text-matrix flex items-center">
              <TrendingUp className="mr-2" />
              Resultado de Validación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-black rounded p-4 terminal-border">
                <div className="text-sm font-mono text-gray-400 mb-1">Coincidencia Biométrica</div>
                <div className="text-2xl font-mono font-bold text-matrix">
                  {validationResult.matchingPercentage}%
                </div>
                <Progress 
                  value={validationResult.matchingPercentage} 
                  className="mt-2 bg-gray-700"
                />
              </div>

              <div className="bg-black rounded p-4 terminal-border">
                <div className="text-sm font-mono text-gray-400 mb-1">Estado en Padrón</div>
                <div className="text-lg font-mono font-bold text-matrix">
                  {validationResult.record?.status?.toUpperCase() || "N/A"}
                </div>
                <Badge className={`text-xs mt-1 ${getStatusColor(validationResult.record?.status || '')}`}>
                  {validationResult.record?.status === "active" ? "Verificado ✓" : "Inactivo"}
                </Badge>
              </div>

              <div className="bg-black rounded p-4 terminal-border">
                <div className="text-sm font-mono text-gray-400 mb-1">Nivel de Confianza</div>
                <div className={`text-lg font-mono font-bold ${getConfidenceLevel(validationResult.matchingPercentage).color}`}>
                  {getConfidenceLevel(validationResult.matchingPercentage).level}
                </div>
                <div className="text-xs text-gray-400 mt-1">Threshold: {validationResult.threshold}%+</div>
              </div>
            </div>

            {/* Identity Information */}
            {validationResult.record && (
              <div className="bg-black rounded p-4 terminal-border">
                <h3 className="font-mono font-bold text-matrix mb-3">Información de Identidad</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm font-mono mb-4">
                  <div>
                    <span className="text-gray-400">Nombre:</span>{" "}
                    <span>{validationResult.record.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">CURP:</span>{" "}
                    <span className="text-yellow-400">{validationResult.record.curp}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">INE:</span>{" "}
                    <span>{validationResult.record.ineNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">RFC:</span>{" "}
                    <span className="text-cyber">{validationResult.record.rfc || "N/A"}</span>
                  </div>
                </div>
                
                {/* Fingerprint Visualization */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="font-mono font-bold text-matrix mb-3 flex items-center">
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Huella Dactilar Registrada
                  </h4>
                  <div className="bg-gray-900 rounded p-4 text-center">
                    <div className="fingerprint-scanner rounded w-32 h-32 mx-auto mb-3 flex items-center justify-center">
                      <Fingerprint className="text-4xl text-matrix animate-pulse" />
                    </div>
                    <div className="text-xs font-mono text-gray-400">
                      Datos biométricos: {validationResult.record.curp.slice(-8)}****
                    </div>
                    <div className="text-xs font-mono text-green-400 mt-1">
                      ✓ Huella registrada y verificada
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
