import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, Edit, Trash2, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { addPoint, addMultiplePoints, getPoints, updatePoint, deletePoint, getRoutes, type Point, type Route } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export function PointsTab() {
  const [points, setPoints] = useState<Point[]>(getPoints());
  const [routes, setRoutes] = useState<Route[]>(getRoutes());
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openRoutes, setOpenRoutes] = useState<Set<string>>(new Set(routes.map(r => r.id)));
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    routeId: "",
    names: "",
    address: ""
  });

  const resetForm = () => {
    setFormData({ routeId: "", names: "", address: "" });
    setEditingPoint(null);
  };

  const toggleRoute = (routeId: string) => {
    setOpenRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const getRouteName = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    return route?.name || "Rota desconhecida";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.routeId) {
      toast({
        title: "Erro",
        description: "Selecione uma rota",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.names.trim()) {
      toast({
        title: "Erro",
        description: "Nome do ponto é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingPoint) {
        updatePoint(editingPoint.id, { name: formData.names, address: formData.address, routeId: formData.routeId });
        toast({
          title: "Sucesso",
          description: "Ponto atualizado com sucesso"
        });
      } else {
        // Parse multiple names
        const names = formData.names
          .split(/[,\n]+/)
          .map(name => name.trim())
          .filter(name => name.length > 0);
        
        if (names.length === 1) {
          addPoint({ routeId: formData.routeId, name: names[0], address: formData.address });
        } else {
          const pointsData = names.map(name => ({
            routeId: formData.routeId,
            name,
            address: formData.address
          }));
          addMultiplePoints(pointsData);
        }
        
        toast({
          title: "Sucesso", 
          description: `${names.length} ponto(s) cadastrado(s) com sucesso`
        });
      }
      
      setPoints(getPoints());
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar ponto",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (point: Point) => {
    setEditingPoint(point);
    setFormData({
      routeId: point.routeId,
      names: point.name,
      address: point.address || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = (point: Point) => {
    if (confirm("Tem certeza que deseja excluir este ponto?")) {
      try {
        deletePoint(point.id);
        setPoints(getPoints());
        toast({
          title: "Sucesso",
          description: "Ponto excluído com sucesso"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir ponto",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pontos de Embarque</h1>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-medium">
              <Plus className="h-4 w-4 mr-2" />
              Novo Ponto
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPoint ? "Editar Ponto" : "Novo Ponto"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="routeId">Rota *</Label>
                <Select
                  value={formData.routeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, routeId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma rota" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.length === 0 ? (
                      <SelectItem value="none" disabled>Nenhuma rota cadastrada</SelectItem>
                    ) : (
                      routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="names">
                  {editingPoint ? "Nome do Ponto *" : "Nome(s) do(s) Ponto(s) *"}
                </Label>
                {editingPoint ? (
                  <Input
                    id="names"
                    value={formData.names}
                    onChange={(e) => setFormData(prev => ({ ...prev, names: e.target.value }))}
                    placeholder="Ex: Escola Municipal João Silva"
                    className="mt-1"
                  />
                ) : (
                  <Textarea
                    id="names"
                    value={formData.names}
                    onChange={(e) => setFormData(prev => ({ ...prev, names: e.target.value }))}
                    placeholder="Ex: Praça Central, Escola Municipal, Terminal Rodoviário (separar por vírgula ou quebra de linha)"
                    className="mt-1 min-h-[80px]"
                  />
                )}
              </div>
              
              <div>
                <Label htmlFor="address">
                  Endereço (opcional){!editingPoint && " - compartilhado para múltiplos pontos"}
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-gradient-primary">
                  {editingPoint ? "Atualizar" : "Cadastrar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {points.length === 0 ? (
          <Card glass className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gradient-accent rounded-2xl shadow-medium mb-4">
                <MapPin className="h-12 w-12 text-accent-foreground" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-foreground">Nenhum ponto cadastrado</h3>
              <p className="text-muted-foreground">
                Comece cadastrando um ponto de embarque
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 stagger-children">
            {routes.map(route => {
              const routePoints = points.filter(p => p.routeId === route.id);
              if (routePoints.length === 0) return null;
              
              return (
                <Collapsible
                  key={route.id}
                  open={openRoutes.has(route.id)}
                  onOpenChange={() => toggleRoute(route.id)}
                  className="space-y-3"
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 p-4 glass rounded-xl cursor-pointer hover:shadow-medium transition-all group">
                      <div className="p-2 bg-gradient-primary rounded-lg shadow-medium group-hover:scale-110 transition-transform">
                        <MapPin className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-wide flex-1 text-left">
                        {route.name}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({routePoints.length} {routePoints.length === 1 ? 'ponto' : 'pontos'})
                        </span>
                      </h2>
                      <ChevronDown 
                        className={`h-6 w-6 text-muted-foreground transition-transform duration-300 ${
                          openRoutes.has(route.id) ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-3 pl-2">
                    {routePoints.map((point) => (
                      <Card key={point.id} glass className="hover:shadow-hover transition-all group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 flex items-start gap-3">
                              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                                <MapPin className="h-5 w-5 text-accent" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg text-foreground">
                                  {point.name}
                                </CardTitle>
                                {point.address && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {point.address}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(point)}
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(point)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}