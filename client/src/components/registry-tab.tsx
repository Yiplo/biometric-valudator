import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserSearch, Fingerprint, Hand, TrendingUp, Eye, User, Database, Calendar } from "lucide-react";
import type { ElectoralRegistry } from "@shared/schema";

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

export default function RegistryTab() {
  const [identifierType, setIdentifierType] = useState<"curp" | "rfc">("curp");
  const [identifier, setIdentifier] = useState("");
  const [fingerprintData, setFingerprintData] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [searchResults, setSearchResults] = useState<ElectoralRegistry[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ElectoralRegistry | null>(null);
  const [showRecordDetail, setShowRecordDetail] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current date
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

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

  // Fetch all electoral records for searching
  const { data: allRecords = [], isLoading: isLoadingRecords } = useQuery<ElectoralRegistry[]>({
    queryKey: ["/api/padron"],
  });

  // Search function
  const performSearch = () => {
    if (!identifier.trim()) {
      toast({
        variant: "destructive",
        title: "Campo requerido",
        description: "Ingresa un RFC o CURP para buscar",
      });
      return;
    }

    const searchTerm = identifier.trim().toUpperCase();
    const results = allRecords.filter(record => {
      if (identifierType === "curp") {
        return record.curp.includes(searchTerm);
      } else {
        return record.rfc?.includes(searchTerm);
      }
    });

    setSearchResults(results);
    setShowSearchResults(true);
    setValidationResult(null);

    toast({
      title: "Búsqueda completada",
      description: `Se encontraron ${results.length} resultado(s)`,
    });
  };

  // Select a record from search results
  const selectRecord = (record: ElectoralRegistry) => {
    setSelectedRecord(record);
    setShowRecordDetail(true);
    setShowSearchResults(false);
  };

  // Individual record validation mutation
  const validateRecordMutation = useMutation({
    mutationFn: async (record: ElectoralRegistry) => {
      if (!fingerprintData) {
        throw new Error("Primero captura una huella dactilar");
      }

      const response = await apiRequest("POST", "/api/biometria/validar", {
        curp: record.curp,
        fingerprintData
      });
      return response.json();
    },
    onSuccess: (data, record) => {
      setValidationResult({
        matchingPercentage: data.matchingPercentage || 0,
        status: data.status || "failed",
        threshold: data.threshold || 85,
        record: record
      });
      
      toast({
        title: data.status === "success" ? "Validación exitosa" : "Validación fallida",
        description: `Coincidencia: ${data.matchingPercentage}%`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error en validación",
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
      {/* Header with Date */}
      <Card className="bg-dark-surface terminal-border">
        <CardHeader>
          <CardTitle className="text-xl font-mono font-bold text-matrix flex items-center justify-between">
            <div className="flex items-center">
              <Database className="mr-2" />
              Padrón Electoral Digitalizado 2025
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="mr-2 h-4 w-4" />
              {currentDate}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-mono text-gray-400">
            Sistema Nacional de Identificación Biométrica • Registro Electoral Mexicano
          </div>
          <div className="text-xs font-mono text-cyan-400 mt-2">
            Total de registros activos: {allRecords.filter(r => r.status === "active").length} ciudadanos
          </div>
        </CardContent>
      </Card>

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
                  "Ej: LOSM920715M87"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                className="w-full bg-black terminal-border text-matrix font-mono placeholder-gray-600"
              />
              <div className="text-xs text-gray-500 font-mono mt-1">
                {identifierType === "curp" && "Busca parcial o completa. Ej: LOSM920715MDFPPR08, MARC880523HDFTRR05"}
                {identifierType === "rfc" && "Busca parcial o completa. Ej: LOSM920715M87, MARC880523H76"}
              </div>
            </div>

            <Button
              onClick={performSearch}
              disabled={isLoadingRecords || !identifier}
              className="w-full bg-cyber text-white font-mono font-bold py-3 px-4 hover:bg-opacity-80 transition-all"
            >
              <UserSearch className="mr-2 h-4 w-4" />
              {isLoadingRecords ? "CARGANDO..." : "BUSCAR EN PADRÓN"}
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

      {/* Search Results Panel */}
      {showSearchResults && (
        <Card className="bg-dark-surface terminal-border">
          <CardHeader>
            <CardTitle className="text-lg font-mono font-bold text-matrix flex items-center justify-between">
              <div className="flex items-center">
                <UserSearch className="mr-2" />
                Resultados de Búsqueda
              </div>
              <Badge className="bg-cyber text-black font-mono">
                {searchResults.length} encontrado(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <div className="text-center py-8">
                <UserSearch className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <div className="text-gray-400 font-mono">No se encontraron resultados</div>
                <div className="text-sm text-gray-500 font-mono mt-2">
                  Intenta con otro {identifierType === "curp" ? "CURP" : "RFC"}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {searchResults.map((record, index) => (
                  <div
                    key={record.curp}
                    className="bg-black rounded terminal-border p-4 hover:bg-gray-900 cursor-pointer transition-all group"
                    onClick={() => selectRecord(record)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-matrix to-cyber rounded-full flex items-center justify-center">
                          <User className="text-black h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-matrix group-hover:text-cyber transition-colors">
                            {record.fullName}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            CURP: {record.curp}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs mb-2 ${getStatusColor(record.status)}`}>
                          {record.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                        <div className="text-xs text-gray-500 font-mono">
                          INE: {record.ineNumber}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                      <div>
                        <span className="text-gray-400">RFC:</span>{" "}
                        <span className="text-cyber">{record.rfc || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Estado:</span>{" "}
                        <span className={record.status === "active" ? "text-green-400" : "text-red-400"}>
                          {record.status === "active" ? "Verificado" : "Sin verificar"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Fingerprint className="h-4 w-4 text-matrix" />
                        <span className="text-xs font-mono text-gray-400">
                          Biometría disponible
                        </span>
                      </div>
                      <div className="text-xs font-mono text-matrix group-hover:text-cyber transition-colors">
                        Click para ver detalles →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Record View Modal */}
      <Dialog open={showRecordDetail} onOpenChange={setShowRecordDetail}>
        <DialogContent className="bg-dark-surface terminal-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-mono font-bold text-matrix flex items-center">
              <Eye className="mr-2" />
              Perfil Biométrico Completo
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Identity Header */}
              <div className="bg-black rounded terminal-border p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-matrix to-cyber rounded-full flex items-center justify-center">
                    <User className="text-black h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-mono font-bold text-matrix">{selectedRecord.fullName}</h2>
                    <div className="text-sm text-gray-400 font-mono">
                      Registro electoral verificado
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Badge className={`${getStatusColor(selectedRecord.status)} text-sm`}>
                      {selectedRecord.status === "active" ? "ACTIVO ✓" : "INACTIVO"}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm font-mono">
                  <div className="bg-gray-900 rounded p-3">
                    <div className="text-gray-400 mb-1">CURP</div>
                    <div className="text-yellow-400 font-bold">{selectedRecord.curp}</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3">
                    <div className="text-gray-400 mb-1">INE</div>
                    <div className="text-matrix font-bold">{selectedRecord.ineNumber}</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3">
                    <div className="text-gray-400 mb-1">RFC</div>
                    <div className="text-cyber font-bold">{selectedRecord.rfc || "No disponible"}</div>
                  </div>
                </div>
              </div>

              {/* Biometric Data Visualization */}
              <div className="bg-black rounded terminal-border p-4">
                <h3 className="font-mono font-bold text-matrix mb-4 flex items-center">
                  <Fingerprint className="mr-2" />
                  Datos Biométricos Registrados
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Hand */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-mono text-gray-400 border-b border-gray-700 pb-2">
                      MANO IZQUIERDA
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {["Pulgar", "Índice", "Medio", "Anular", "Meñique"].map((finger, index) => (
                        <div key={`left-${index}`} className="bg-gray-900 rounded p-3 text-center">
                          <div className="fingerprint-scanner w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                            <Fingerprint className="text-2xl text-matrix animate-pulse" />
                          </div>
                          <div className="text-xs font-mono text-gray-400">{finger} Izq.</div>
                          <div className="text-xs font-mono text-green-400 mt-1">✓ Registrado</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Hand */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-mono text-gray-400 border-b border-gray-700 pb-2">
                      MANO DERECHA
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {["Pulgar", "Índice", "Medio", "Anular", "Meñique"].map((finger, index) => (
                        <div key={`right-${index}`} className="bg-gray-900 rounded p-3 text-center">
                          <div className="fingerprint-scanner w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                            <Fingerprint className="text-2xl text-matrix animate-pulse" />
                          </div>
                          <div className="text-xs font-mono text-gray-400">{finger} Der.</div>
                          <div className="text-xs font-mono text-green-400 mt-1">✓ Registrado</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Biometric Quality Indicators */}
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-900 rounded p-3 text-center">
                    <div className="text-green-400 font-mono font-bold text-lg">98.5%</div>
                    <div className="text-xs text-gray-400 font-mono">Calidad de Captura</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center">
                    <div className="text-cyan-400 font-mono font-bold text-lg">512x512</div>
                    <div className="text-xs text-gray-400 font-mono">Resolución (DPI)</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center">
                    <div className="text-yellow-400 font-mono font-bold text-lg">ISO/IEC</div>
                    <div className="text-xs text-gray-400 font-mono">Estándar</div>
                  </div>
                </div>
              </div>

              {/* Validation Actions */}
              <div className="bg-black rounded terminal-border p-4">
                <h3 className="font-mono font-bold text-matrix mb-4 flex items-center">
                  <TrendingUp className="mr-2" />
                  Acciones de Validación
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      setShowRecordDetail(false);
                      validateRecordMutation.mutate(selectedRecord);
                    }}
                    disabled={!fingerprintData || validateRecordMutation.isPending}
                    className="bg-gradient-to-r from-matrix to-cyber text-black font-mono font-bold py-3 px-4 hover:opacity-80 transition-all"
                  >
                    <Fingerprint className="mr-2 h-4 w-4" />
                    {validateRecordMutation.isPending ? "VALIDANDO..." : "VALIDAR BIOMETRÍA"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowRecordDetail(false)}
                    className="terminal-border text-matrix font-mono font-bold py-3 px-4 hover:bg-gray-900"
                  >
                    Cerrar Vista Detallada
                  </Button>
                </div>

                {!fingerprintData && (
                  <div className="mt-3 text-xs font-mono text-yellow-400 text-center">
                    ⚠️ Primero captura una huella dactilar para validar
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}