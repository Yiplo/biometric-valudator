import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import type { ValidationHistory } from "@shared/schema";

interface Stats {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  successRate: number;
}

export default function HistoryTab() {
  // Fetch validation history
  const { data: history = [], isLoading } = useQuery<ValidationHistory[]>({
    queryKey: ["/api/historial"],
  });

  // Fetch stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const getStatusBadge = (status: string) => {
    const isSuccess = status === "success";
    return (
      <Badge className={isSuccess ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
        {isSuccess ? "SUCCESS" : "FAILED"}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getMatchingColor = (percentage: number) => {
    if (percentage >= 85) return "text-matrix";
    if (percentage >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-surface terminal-border">
        <CardHeader>
          <CardTitle className="text-lg font-mono font-bold text-matrix flex items-center">
            <History className="mr-2" />
            Historial de Validaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-black terminal-border rounded p-4">
              <div className="text-2xl font-mono font-bold text-matrix">
                {stats?.totalValidations.toLocaleString() || "0"}
              </div>
              <div className="text-sm text-gray-400 font-mono">Total Validaciones</div>
            </div>
            <div className="bg-black terminal-border rounded p-4">
              <div className="text-2xl font-mono font-bold text-green-400 flex items-center">
                <CheckCircle className="mr-1 h-5 w-5" />
                {stats?.successfulValidations.toLocaleString() || "0"}
              </div>
              <div className="text-sm text-gray-400 font-mono">Exitosas</div>
            </div>
            <div className="bg-black terminal-border rounded p-4">
              <div className="text-2xl font-mono font-bold text-red-400 flex items-center">
                <XCircle className="mr-1 h-5 w-5" />
                {stats?.failedValidations.toLocaleString() || "0"}
              </div>
              <div className="text-sm text-gray-400 font-mono">Fallidas</div>
            </div>
            <div className="bg-black terminal-border rounded p-4">
              <div className="text-2xl font-mono font-bold text-yellow-400 flex items-center">
                <TrendingUp className="mr-1 h-5 w-5" />
                {stats?.successRate.toFixed(1) || "0.0"}%
              </div>
              <div className="text-sm text-gray-400 font-mono">Tasa de Éxito</div>
            </div>
          </div>

          {/* Recent Validations Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-dark-border">
                  <TableHead className="text-matrix font-mono">Timestamp</TableHead>
                  <TableHead className="text-matrix font-mono">Institución</TableHead>
                  <TableHead className="text-matrix font-mono">CURP</TableHead>
                  <TableHead className="text-matrix font-mono">Matching %</TableHead>
                  <TableHead className="text-matrix font-mono">Estado</TableHead>
                  <TableHead className="text-matrix font-mono">IP Origin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 font-mono">
                      Cargando historial...
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 font-mono">
                      No hay validaciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((record) => (
                    <TableRow key={record.id} className="border-b border-gray-700 hover:bg-gray-800/30">
                      <TableCell className="text-cyber font-mono">
                        {formatTimestamp(record.timestamp!)}
                      </TableCell>
                      <TableCell className="font-mono">{record.institution}</TableCell>
                      <TableCell className="text-yellow-400 font-mono">{record.curp}</TableCell>
                      <TableCell className={`font-mono font-bold ${getMatchingColor(record.matchingPercentage)}`}>
                        {record.matchingPercentage}%
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-gray-400 font-mono">
                        {record.ipAddress || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Recent Activity Summary */}
          {history.length > 0 && (
            <div className="mt-6 bg-black terminal-border rounded p-4">
              <h3 className="font-mono font-bold text-matrix mb-3">Resumen de Actividad Reciente</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm font-mono">
                <div>
                  <span className="text-gray-400">Última validación:</span>{" "}
                  <span className="text-cyan-400">
                    {formatTimestamp(history[0]?.timestamp!)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Institución más activa:</span>{" "}
                  <span className="text-cyan-400">
                    {history.reduce((acc, curr) => {
                      acc[curr.institution] = (acc[curr.institution] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>).constructor === Object 
                      ? Object.entries(history.reduce((acc, curr) => {
                          acc[curr.institution] = (acc[curr.institution] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A"
                      : "N/A"
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Promedio de matching:</span>{" "}
                  <span className="text-cyan-400">
                    {history.length > 0 
                      ? (history.reduce((acc, curr) => acc + curr.matchingPercentage, 0) / history.length).toFixed(1)
                      : "0.0"
                    }%
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
