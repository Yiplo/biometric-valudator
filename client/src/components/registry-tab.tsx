import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Database, Calendar, MapPin, User, Fingerprint, Search, Users } from "lucide-react";
import type { ElectoralRegistry } from "@shared/schema";

export default function RegistryTab() {
  const [selectedState, setSelectedState] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ElectoralRegistry | null>(null);
  const [showRecordDetail, setShowRecordDetail] = useState(false);

  // Get current date
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // Fetch all electoral records
  const { data: allRecords = [], isLoading } = useQuery<ElectoralRegistry[]>({
    queryKey: ["/api/padron"],
  });

  // Group records by state
  const recordsByState = allRecords.reduce((acc, record) => {
    if (!acc[record.state]) {
      acc[record.state] = [];
    }
    acc[record.state].push(record);
    return acc;
  }, {} as Record<string, ElectoralRegistry[]>);

  // Get filtered records
  const filteredRecords = allRecords.filter(record => {
    const matchesState = selectedState === "all" || record.state === selectedState;
    const matchesSearch = !searchTerm || 
      record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rfc?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesState && matchesSearch;
  });

  // Get unique states for dropdown
  const availableStates = Object.keys(recordsByState).sort();

  // Select a record to view details
  const selectRecord = (record: ElectoralRegistry) => {
    setSelectedRecord(record);
    setShowRecordDetail(true);
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-matrix font-mono">Cargando padrón electoral...</div>
      </div>
    );
  }

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
          <div className="grid md:grid-cols-3 gap-4 text-sm font-mono">
            <div className="bg-black rounded p-3 terminal-border">
              <div className="text-gray-400 mb-1">Estados Registrados</div>
              <div className="text-2xl font-bold text-cyber">{availableStates.length}</div>
            </div>
            <div className="bg-black rounded p-3 terminal-border">
              <div className="text-gray-400 mb-1">Total Ciudadanos</div>
              <div className="text-2xl font-bold text-matrix">{allRecords.length}</div>
            </div>
            <div className="bg-black rounded p-3 terminal-border">
              <div className="text-gray-400 mb-1">Registros Activos</div>
              <div className="text-2xl font-bold text-green-400">
                {allRecords.filter(r => r.status === "active").length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-dark-surface terminal-border">
        <CardHeader>
          <CardTitle className="text-lg font-mono font-bold text-matrix flex items-center">
            <Search className="mr-2" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Filtrar por Estado:
              </label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="bg-black terminal-border text-matrix font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-dark-border max-h-64">
                  <SelectItem value="all">Todos los Estados ({allRecords.length} registros)</SelectItem>
                  {availableStates.map(state => (
                    <SelectItem key={state} value={state}>
                      {state} ({recordsByState[state].length} registros)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Buscar por Nombre, CURP o RFC:
              </label>
              <Input
                type="text"
                placeholder="Ej: María, LOSM920715, AUTR901015A12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black terminal-border text-matrix font-mono placeholder-gray-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-dark-surface terminal-border">
        <CardHeader>
          <CardTitle className="text-lg font-mono font-bold text-matrix flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2" />
              Resultados
              {selectedState !== "all" && (
                <div className="flex items-center ml-4">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span className="text-cyber">{selectedState}</span>
                </div>
              )}
            </div>
            <Badge className="bg-cyber text-black font-mono">
              {filteredRecords.length} encontrado(s)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-gray-500 mb-4" />
              <div className="text-gray-400 font-mono text-lg">No se encontraron registros</div>
              <div className="text-sm text-gray-500 font-mono mt-2">
                Intenta cambiar los filtros de búsqueda
              </div>
            </div>
          ) : (
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {filteredRecords.map((record) => (
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
                        <div className="text-xs text-cyber font-mono flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {record.state}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-400">Estado:</span>{" "}
                        <span className={record.status === "active" ? "text-green-400" : "text-red-400"}>
                          {record.status === "active" ? "Verificado" : "Sin verificar"}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-matrix group-hover:text-cyber transition-colors">
                        Ver huellas dactilares →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Record View Modal */}
      <Dialog open={showRecordDetail} onOpenChange={setShowRecordDetail}>
        <DialogContent className="bg-dark-surface terminal-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-mono font-bold text-matrix flex items-center">
              <User className="mr-2" />
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
                    <div className="text-sm text-gray-400 font-mono flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedRecord.state} • Registro electoral verificado
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

              {/* Biometric Data Visualization - Only 4 fingers */}
              <div className="bg-black rounded terminal-border p-4">
                <h3 className="font-mono font-bold text-matrix mb-4 flex items-center">
                  <Fingerprint className="mr-2" />
                  Huellas Dactilares Registradas
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Hand - Only Thumb and Index */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-mono text-gray-400 border-b border-gray-700 pb-2">
                      MANO IZQUIERDA
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-900 rounded p-4 text-center">
                        <div className="fingerprint-scanner w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                          <Fingerprint className="text-3xl text-matrix animate-pulse" />
                        </div>
                        <div className="text-sm font-mono text-gray-400">Pulgar Izq.</div>
                        <div className="text-xs font-mono text-green-400 mt-1">✓ Registrado</div>
                        <div className="text-xs font-mono text-gray-500 mt-1">
                          ID: {selectedRecord.fingerprintData.slice(0, 8)}
                        </div>
                      </div>
                      <div className="bg-gray-900 rounded p-4 text-center">
                        <div className="fingerprint-scanner w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                          <Fingerprint className="text-3xl text-matrix animate-pulse" />
                        </div>
                        <div className="text-sm font-mono text-gray-400">Índice Izq.</div>
                        <div className="text-xs font-mono text-green-400 mt-1">✓ Registrado</div>
                        <div className="text-xs font-mono text-gray-500 mt-1">
                          ID: {selectedRecord.fingerprintData.slice(8, 16)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Hand - Only Thumb and Index */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-mono text-gray-400 border-b border-gray-700 pb-2">
                      MANO DERECHA
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-900 rounded p-4 text-center">
                        <div className="fingerprint-scanner w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                          <Fingerprint className="text-3xl text-matrix animate-pulse" />
                        </div>
                        <div className="text-sm font-mono text-gray-400">Pulgar Der.</div>
                        <div className="text-xs font-mono text-green-400 mt-1">✓ Registrado</div>
                        <div className="text-xs font-mono text-gray-500 mt-1">
                          ID: {selectedRecord.fingerprintData.slice(16, 24)}
                        </div>
                      </div>
                      <div className="bg-gray-900 rounded p-4 text-center">
                        <div className="fingerprint-scanner w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                          <Fingerprint className="text-3xl text-matrix animate-pulse" />
                        </div>
                        <div className="text-sm font-mono text-gray-400">Índice Der.</div>
                        <div className="text-xs font-mono text-green-400 mt-1">✓ Registrado</div>
                        <div className="text-xs font-mono text-gray-500 mt-1">
                          ID: {selectedRecord.fingerprintData.slice(24, 32)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biometric Quality Indicators */}
                <div className="mt-6 grid md:grid-cols-4 gap-4">
                  <div className="bg-gray-900 rounded p-3 text-center">
                    <div className="text-green-400 font-mono font-bold text-lg">98.7%</div>
                    <div className="text-xs text-gray-400 font-mono">Calidad</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center">
                    <div className="text-cyan-400 font-mono font-bold text-lg">512x512</div>
                    <div className="text-xs text-gray-400 font-mono">Resolución</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center">
                    <div className="text-yellow-400 font-mono font-bold text-lg">ISO/IEC</div>
                    <div className="text-xs text-gray-400 font-mono">Estándar</div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 text-center">
                    <div className="text-matrix font-mono font-bold text-lg">4</div>
                    <div className="text-xs text-gray-400 font-mono">Huellas</div>
                  </div>
                </div>

                {/* Registration Details */}
                <div className="mt-4 p-4 bg-gray-900 rounded">
                  <div className="text-xs font-mono text-gray-400 mb-2">Detalles del Registro:</div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-gray-500">Fecha de registro:</span>{" "}
                      <span className="text-matrix">
                        {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado de origen:</span>{" "}
                      <span className="text-cyber">{selectedRecord.state}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowRecordDetail(false)}
                  className="bg-gradient-to-r from-matrix to-cyber text-black font-mono font-bold py-3 px-6 hover:opacity-80 transition-all"
                >
                  Cerrar Vista Detallada
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}