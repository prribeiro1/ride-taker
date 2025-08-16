import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, BarChart3, Calendar, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { getMonthlyReport, getAttendance, getChildren } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export function ReportsTab() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const { toast } = useToast();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const reportData = getMonthlyReport(selectedYear, selectedMonth);

  // Get detailed attendance for calendar view
  const getDetailedAttendance = (childId: string) => {
    const monthStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    const attendance = getAttendance().filter(a => 
      a.childId === childId && a.date.startsWith(monthStr)
    );
    
    // Get days in month
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthStr}-${day.toString().padStart(2, '0')}`;
      const dayAttendance = attendance.find(a => a.date === dateStr);
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = date.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push({
          date: dateStr,
          day: day,
          dayOfWeek: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek],
          present: dayAttendance?.present,
          hasRecord: !!dayAttendance
        });
      }
    }
    
    return days;
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive"
      });
      return;
    }

    const headers = ["Criança", "Responsável", "Presença", "Falta", "Total"];
    const rows = reportData.map(item => [
      item.child.name,
      item.child.responsible,
      item.present.toString(),
      item.absent.toString(),
      item.total.toString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso"
    });
  };

  const totalPresent = reportData.reduce((sum, item) => sum + item.present, 0);
  const totalAbsent = reportData.reduce((sum, item) => sum + item.absent, 0);
  const totalRecords = totalPresent + totalAbsent;

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Relatórios</h1>
        <p className="text-muted-foreground">Acompanhe a frequência mensal</p>
      </div>

      {/* Period Selection */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Período do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mês</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={exportToCSV}
            disabled={reportData.length === 0}
            className="w-full bg-gradient-primary"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalRecords}</div>
              <div className="text-xs text-muted-foreground">Total Registros</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{totalPresent}</div>
              <div className="text-xs text-muted-foreground">Presenças</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{totalAbsent}</div>
              <div className="text-xs text-muted-foreground">Faltas</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {monthNames[selectedMonth - 1]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum dado encontrado</h3>
              <p className="text-muted-foreground">
                Não há registros para o período selecionado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportData.map((item) => (
                <Card key={item.child.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{item.child.name}</h4>
                        {item.child.responsible && (
                          <p className="text-sm text-muted-foreground">
                            Responsável: {item.child.responsible}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-success text-lg">{item.present}</div>
                            <div className="text-xs text-muted-foreground">Presente</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-destructive text-lg">{item.absent}</div>
                            <div className="text-xs text-muted-foreground">Falta</div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDetails(showDetails === item.child.id ? null : item.child.id)}
                          className="h-8 w-8 p-0"
                        >
                          {showDetails === item.child.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Detailed calendar view */}
                    {showDetails === item.child.id && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="font-medium text-sm mb-3 text-muted-foreground">
                          Detalhes do mês - Dias da semana (Segunda a Sexta)
                        </h5>
                        <div className="grid grid-cols-5 gap-2">
                          {getDetailedAttendance(item.child.id).map((day) => (
                            <div
                              key={day.date}
                              className={`
                                p-2 rounded-lg text-center text-xs border
                                ${!day.hasRecord 
                                  ? 'bg-muted border-muted text-muted-foreground' 
                                  : day.present 
                                    ? 'bg-success/10 border-success text-success' 
                                    : 'bg-destructive/10 border-destructive text-destructive'
                                }
                              `}
                            >
                              <div className="font-medium">{day.day}</div>
                              <div className="text-xs opacity-70">{day.dayOfWeek}</div>
                              <div className="mt-1">
                                {!day.hasRecord ? (
                                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30 mx-auto"></div>
                                ) : day.present ? (
                                  <CheckCircle className="w-3 h-3 mx-auto" />
                                ) : (
                                  <XCircle className="w-3 h-3 mx-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-success" />
                            Presente
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-destructive" />
                            Falta
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-muted-foreground/30"></div>
                            Sem registro
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}