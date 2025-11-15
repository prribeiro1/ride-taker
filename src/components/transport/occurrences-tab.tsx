import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, Calendar } from "lucide-react";
import { getChildren, getOccurrences, addOccurrence, deleteOccurrence, getPoints, getRoutes, type Child } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function OccurrencesTab() {
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [occurrenceType, setOccurrenceType] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const { toast } = useToast();

  const children = getChildren();
  const occurrences = getOccurrences();
  const points = getPoints();
  const routes = getRoutes();

  // Sort occurrences by date (most recent first)
  const sortedOccurrences = [...occurrences].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getChildInfo = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (!child) return null;
    
    const point = points.find(p => p.id === child.pointId);
    const route = point ? routes.find(r => r.id === point.routeId) : null;
    
    return { child, point, route };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId) {
      toast({
        title: "Erro",
        description: "Selecione uma criança",
        variant: "destructive"
      });
      return;
    }

    if (!occurrenceType.trim()) {
      toast({
        title: "Erro",
        description: "Digite o tipo de ocorrência",
        variant: "destructive"
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    addOccurrence({
      childId: selectedChildId,
      occurrenceType: occurrenceType.trim(),
      observation: observation.trim() || undefined,
      date: today
    });

    toast({
      title: "Sucesso",
      description: "Ocorrência registrada com sucesso"
    });

    // Reset form
    setSelectedChildId("");
    setOccurrenceType("");
    setObservation("");
  };

  const handleDelete = (id: string) => {
    deleteOccurrence(id);
    toast({
      title: "Removida",
      description: "Ocorrência removida com sucesso"
    });
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Registrar Ocorrência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="child-select">Criança Envolvida</Label>
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger id="child-select">
                  <SelectValue placeholder="Selecione a criança" />
                </SelectTrigger>
                <SelectContent>
                  {children.map(child => {
                    const info = getChildInfo(child.id);
                    return (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name} {info?.point && `- ${info.point.name}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occurrence-type">Tipo de Ocorrência</Label>
              <Input
                id="occurrence-type"
                value={occurrenceType}
                onChange={(e) => setOccurrenceType(e.target.value)}
                placeholder="Ex: Comportamento inadequado, Falta de uniforme, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observation">Observação (Opcional)</Label>
              <Textarea
                id="observation"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Descreva o que aconteceu..."
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full">
              Registrar Ocorrência
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Ocorrências
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedOccurrences.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma ocorrência registrada
            </p>
          ) : (
            <div className="space-y-4">
              {sortedOccurrences.map(occurrence => {
                const info = getChildInfo(occurrence.childId);
                if (!info) return null;

                return (
                  <div
                    key={occurrence.id}
                    className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{info.child.name}</span>
                          {info.route && (
                            <Badge variant="outline" className="text-xs">
                              {info.route.name}
                            </Badge>
                          )}
                          {info.point && (
                            <Badge variant="secondary" className="text-xs">
                              {info.point.name}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(occurrence.date), "dd/MM/yyyy")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(occurrence.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">Tipo: </span>
                        <span>{occurrence.occurrenceType}</span>
                      </div>
                      {occurrence.observation && (
                        <div className="text-sm">
                          <span className="font-medium">Observação: </span>
                          <span className="text-muted-foreground">
                            {occurrence.observation}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
