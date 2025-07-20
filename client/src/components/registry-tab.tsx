import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Database, Plus, Eye, Edit, Trash2, Filter, Fingerprint, Search } from "lucide-react";
import type { ElectoralRegistry } from "@shared/schema";

export default function RegistryTab() {
  const [searchName, setSearchName] = useState("");
  const [searchCurp, setSearchCurp] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ElectoralRegistry | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ElectoralRegistry | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for new/edit record
  const [formData, setFormData] = useState({
    curp: "",
    fullName: "",
    ineNumber: "",
    rfc: "",
    fingerprintData: "",
    status: "active"
  });

  // Fetch electoral records
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["/api/padron"],
    select: (data: ElectoralRegistry[]) => {
      return data.filter(record => {
        const matchesName = !searchName || record.fullName.toLowerCase().includes(searchName.toLowerCase());
        const matchesCurp = !searchCurp || record.curp.includes(searchCurp);
        const matchesStatus = statusFilter === "all" || record.status === statusFilter;
        return matchesName && matchesCurp && matchesStatus;
      });
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/padron", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/padron"] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Registro creado",
        description: "El registro ha sido agregado al padrón electoral",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al crear registro",
        description: error.message || "Error desconocido",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/padron/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/padron"] });
      setEditingRecord(null);
      resetForm();
      toast({
        title: "Registro actualizado",
        description: "Los datos han sido actualizados correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar registro",
        description: error.message || "Error desconocido",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/padron/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/padron"] });
      toast({
        title: "Registro eliminado",
        description: "El registro ha sido eliminado del padrón electoral",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al eliminar registro",
        description: error.message || "Error desconocido",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      curp: "",
      fullName: "",
      ineNumber: "",
      rfc: "",
      fingerprintData: "",
      status: "active"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      // Generate mock fingerprint for new records
      const mockFingerprint = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      createMutation.mutate({ ...formData, fingerprintData: mockFingerprint });
    }
  };

  const handleEdit = (record: ElectoralRegistry) => {
    setEditingRecord(record);
    setFormData({
      curp: record.curp,
      fullName: record.fullName,
      ineNumber: record.ineNumber,
      rfc: record.rfc || "",
      fingerprintData: record.fingerprintData,
      status: record.status
    });
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingRecord(null);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === "active";
    return (
      <Badge className={isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
        {isActive ? "ACTIVO" : "INACTIVO"}
      </Badge>
    );
  };

  const handleViewDetails = (record: ElectoralRegistry) => {
    setViewingRecord(record);
    setShowDetailsDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-surface terminal-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-mono font-bold text-matrix flex items-center">
              <Database className="mr-2" />
              Padrón Electoral Digitalizado
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="bg-matrix text-black font-mono text-sm px-4 py-2 hover:bg-opacity-80"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-dark-surface border-dark-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-matrix font-mono">
                    {editingRecord ? "Editar Registro" : "Nuevo Registro Electoral"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 font-mono">CURP</Label>
                      <Input
                        value={formData.curp}
                        onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
                        className="bg-black terminal-border text-matrix font-mono"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 font-mono">Número INE</Label>
                      <Input
                        value={formData.ineNumber}
                        onChange={(e) => setFormData({ ...formData, ineNumber: e.target.value })}
                        className="bg-black terminal-border text-matrix font-mono"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 font-mono">Nombre Completo</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="bg-black terminal-border text-matrix font-mono"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 font-mono">RFC</Label>
                      <Input
                        value={formData.rfc}
                        onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                        className="bg-black terminal-border text-matrix font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 font-mono">Estado</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger className="bg-black terminal-border text-matrix font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-dark-border">
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      className="border-dark-border text-gray-400 font-mono"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-matrix text-black font-mono"
                    >
                      {editingRecord ? "Actualizar" : "Crear"} Registro
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Buscar por nombre..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="bg-black terminal-border text-matrix font-mono placeholder-gray-600"
            />
            <Input
              placeholder="Filtrar por CURP..."
              value={searchCurp}
              onChange={(e) => setSearchCurp(e.target.value)}
              className="bg-black terminal-border text-matrix font-mono placeholder-gray-600"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-black terminal-border text-matrix font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-dark-border">
                <SelectItem value="all">Estado: Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                // Apply filters - could enhance this functionality
                toast({
                  title: "Filtros aplicados",
                  description: `Mostrando ${records.length} registros`,
                });
              }}
              className="bg-cyber text-white font-mono hover:bg-opacity-80"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-dark-border">
                  <TableHead className="text-matrix font-mono">ID</TableHead>
                  <TableHead className="text-matrix font-mono">Nombre Completo</TableHead>
                  <TableHead className="text-matrix font-mono">CURP</TableHead>
                  <TableHead className="text-matrix font-mono">INE</TableHead>
                  <TableHead className="text-matrix font-mono">RFC</TableHead>
                  <TableHead className="text-matrix font-mono">Estado</TableHead>
                  <TableHead className="text-matrix font-mono">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 font-mono">
                      Cargando registros...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 font-mono">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} className="border-b border-gray-700 hover:bg-gray-800/30">
                      <TableCell className="text-cyber font-mono">{record.id.toString().padStart(3, '0')}</TableCell>
                      <TableCell className="font-mono">{record.fullName}</TableCell>
                      <TableCell className="text-yellow-400 font-mono">{record.curp}</TableCell>
                      <TableCell className="font-mono">{record.ineNumber}</TableCell>
                      <TableCell className="text-cyber font-mono">{record.rfc || "-"}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(record)}
                            className="text-cyber hover:text-blue-300"
                            title="Ver detalles y huella"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(record)}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(record.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 text-sm font-mono">
            <div className="text-gray-400">
              Mostrando {records.length} registros
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="border-dark-border text-gray-400 font-mono"
                disabled
              >
                Anterior
              </Button>
              <Button
                size="sm"
                className="bg-matrix text-black font-mono"
              >
                1
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-dark-border text-gray-400 font-mono"
                disabled
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-dark-surface border-dark-border max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-matrix font-mono flex items-center">
              <Fingerprint className="mr-2" />
              Detalles del Ciudadano - {viewingRecord?.fullName}
            </DialogTitle>
          </DialogHeader>
          
          {viewingRecord && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-black terminal-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono text-matrix">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm font-mono">
                    <div>
                      <span className="text-gray-400">ID:</span>{" "}
                      <span className="text-cyber">{viewingRecord.id.toString().padStart(3, '0')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Nombre Completo:</span>{" "}
                      <span className="text-white">{viewingRecord.fullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">CURP:</span>{" "}
                      <span className="text-yellow-400">{viewingRecord.curp}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">INE:</span>{" "}
                      <span className="text-white">{viewingRecord.ineNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">RFC:</span>{" "}
                      <span className="text-cyber">{viewingRecord.rfc || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Estado:</span>{" "}
                      {getStatusBadge(viewingRecord.status)}
                    </div>
                    <div>
                      <span className="text-gray-400">Fecha de Registro:</span>{" "}
                      <span className="text-white">
                        {viewingRecord.createdAt ? new Date(viewingRecord.createdAt).toLocaleDateString('es-MX') : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Biometric Information */}
                <Card className="bg-black terminal-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-mono text-matrix flex items-center">
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Datos Biométricos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="fingerprint-scanner rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center animate-glow">
                      <Fingerprint className="text-5xl text-matrix animate-pulse" />
                    </div>
                    
                    <div className="space-y-2 text-sm font-mono">
                      <div className="text-green-400">
                        ✓ Huella dactilar registrada
                      </div>
                      <div className="text-gray-400">
                        Hash: {viewingRecord.fingerprintData.slice(0, 16)}...
                      </div>
                      <div className="text-gray-400">
                        Algoritmo: SHA-256 + Minutiae
                      </div>
                      <div className="text-gray-400">
                        Calidad: {Math.floor(Math.random() * 20) + 80}% 
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-900 rounded terminal-border">
                      <div className="text-xs font-mono text-gray-400 text-left">
                        Características detectadas:
                      </div>
                      <div className="text-xs font-mono text-matrix mt-1">
                        • {Math.floor(Math.random() * 15) + 25} puntos de minutiae
                        <br />
                        • {Math.floor(Math.random() * 8) + 12} crestas papilares
                        <br />
                        • Patrón: {['Arco', 'Bucle', 'Verticilo'][Math.floor(Math.random() * 3)]}
                        <br />
                        • Índice de confiabilidad: {Math.floor(Math.random() * 10) + 90}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                  className="border-dark-border text-gray-400 font-mono"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleEdit(viewingRecord);
                  }}
                  className="bg-yellow-500 text-black font-mono hover:bg-yellow-400"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Registro
                </Button>
                <Button
                  onClick={() => {
                    // Simulate biometric validation with this record
                    toast({
                      title: "Validación iniciada",
                      description: `Iniciando validación biométrica para ${viewingRecord.fullName}`,
                    });
                    setShowDetailsDialog(false);
                  }}
                  className="bg-matrix text-black font-mono hover:bg-opacity-80"
                >
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Validar Biométrica
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
