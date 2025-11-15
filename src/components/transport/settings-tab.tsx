import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, User, Edit, Trash2, Phone, ChevronDown, MapPin } from "lucide-react";
import { 
  addChild,
  addMultipleChildren,
  getChildren, 
  getPoints, 
  getRoutes,
  updateChild, 
  deleteChild,
  type Child,
  type Point,
  type Route
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SettingsTab() {
  const [children, setChildren] = useState<Child[]>(getChildren());
  const [points, setPoints] = useState<Point[]>(getPoints());
  const [routes, setRoutes] = useState<Route[]>(getRoutes());
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openPoints, setOpenPoints] = useState<Set<string>>(new Set(points.map(p => p.id)));
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    names: "",
    responsible: "",
    contact: "",
    pointId: ""
  });

  const resetForm = () => {
    setFormData({ names: "", responsible: "", contact: "", pointId: "" });
    setEditingChild(null);
  };

  const togglePoint = (pointId: string) => {
    setOpenPoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pointId)) {
        newSet.delete(pointId);
      } else {
        newSet.add(pointId);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.names.trim() || !formData.pointId) {
      toast({
        title: "Erro",
        description: "Nome(s) da(s) criança(s) e ponto de embarque são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingChild) {
        updateChild(editingChild.id, { 
          name: formData.names, 
          responsible: formData.responsible, 
          contact: formData.contact, 
          pointId: formData.pointId 
        });
        toast({
          title: "Sucesso",
          description: "Criança atualizada com sucesso"
        });
      } else {
        // Split names by comma or line break and create multiple children
        const names = formData.names
          .split(/[,\n]/)
          .map(n => n.trim())
          .filter(n => n.length > 0);
        
        if (names.length === 1) {
          addChild({ 
            name: names[0], 
            responsible: formData.responsible, 
            contact: formData.contact, 
            pointId: formData.pointId 
          });
          toast({
            title: "Sucesso",
            description: "Criança cadastrada com sucesso"
          });
        } else {
          const childrenToAdd = names.map(name => ({
            name,
            responsible: formData.responsible,
            contact: formData.contact,
            pointId: formData.pointId
          }));
          addMultipleChildren(childrenToAdd);
          toast({
            title: "Sucesso",
            description: `${names.length} crianças cadastradas com sucesso`
          });
        }
      }
      
      setChildren(getChildren());
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar criança(s)",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({
      names: child.name,
      responsible: child.responsible || "",
      contact: child.contact || "",
      pointId: child.pointId
    });
    setDialogOpen(true);
  };

  const handleDelete = (child: Child) => {
    if (confirm("Tem certeza que deseja excluir esta criança?")) {
      try {
        deleteChild(child.id);
        setChildren(getChildren());
        toast({
          title: "Sucesso",
          description: "Criança excluída com sucesso"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir criança",
          variant: "destructive"
        });
      }
    }
  };

  const getPointName = (pointId: string): string => {
    const point = points.find(p => p.id === pointId);
    return point?.name || "Ponto não encontrado";
  };

  const getRouteName = (pointId: string): string => {
    const point = points.find(p => p.id === pointId);
    if (!point) return "Rota desconhecida";
    const route = routes.find(r => r.id === point.routeId);
    return route?.name || "Rota desconhecida";
  };

  const groupedPoints = routes.map(route => ({
    route,
    points: points.filter(p => p.routeId === route.id)
  }));

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Crianças</h1>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-primary shadow-medium"
              size="sm"
              disabled={points.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Criança
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChild ? "Editar Criança" : "Nova Criança"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="names">
                  {editingChild ? "Nome da Criança *" : "Nome(s) da(s) Criança(s) *"}
                </Label>
                {editingChild ? (
                  <Input
                    id="names"
                    value={formData.names}
                    onChange={(e) => setFormData(prev => ({ ...prev, names: e.target.value }))}
                    placeholder="Ex: Maria Silva"
                    className="mt-1"
                  />
                ) : (
                  <>
                    <textarea
                      id="names"
                      value={formData.names}
                      onChange={(e) => setFormData(prev => ({ ...prev, names: e.target.value }))}
                      placeholder="Ex: Maria Silva, João Silva, Ana Costa&#10;Ou uma por linha"
                      className="mt-1 w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Separe múltiplos nomes por vírgula ou quebra de linha
                    </p>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="pointId">Ponto de Embarque *</Label>
                <Select
                  value={formData.pointId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pointId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um ponto" />
                  </SelectTrigger>
                  <SelectContent>
                    {points.length === 0 ? (
                      <SelectItem value="none" disabled>Nenhum ponto cadastrado</SelectItem>
                    ) : (
                      groupedPoints.map(({ route, points: routePoints }) => (
                        routePoints.length > 0 && (
                          <div key={route.id}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              {route.name}
                            </div>
                            {routePoints.map((point) => (
                              <SelectItem key={point.id} value={point.id} className="pl-6">
                                {point.name}
                              </SelectItem>
                            ))}
                          </div>
                        )
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="responsible">
                  Responsável {!editingChild && "(compartilhado para todas)"}
                </Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                  placeholder="Ex: João Silva (opcional)"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="contact">
                  Telefone de Contato {!editingChild && "(compartilhado para todas)"}
                </Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="Ex: (11) 99999-9999"
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-gradient-primary">
                  {editingChild ? "Atualizar" : "Cadastrar"}
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

      {points.length === 0 && (
        <Card glass className="shadow-soft border-warning/50">
          <CardContent className="p-6">
            <p className="text-warning text-center">
              ⚠️ Nenhum ponto de embarque cadastrado. Configure pontos primeiro para cadastrar crianças.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {children.length === 0 ? (
          <Card glass className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gradient-primary rounded-2xl shadow-medium mb-4">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-foreground">Nenhuma criança cadastrada</h3>
              <p className="text-muted-foreground">
                Comece cadastrando as crianças do transporte
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 stagger-children">
            {points.map(point => {
              const pointChildren = children.filter(c => c.pointId === point.id);
              if (pointChildren.length === 0) return null;
              
              return (
                <Collapsible
                  key={point.id}
                  open={openPoints.has(point.id)}
                  onOpenChange={() => togglePoint(point.id)}
                  className="space-y-3"
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 p-4 glass rounded-xl cursor-pointer hover:shadow-medium transition-all group">
                      <div className="p-2 bg-gradient-accent rounded-lg shadow-medium group-hover:scale-110 transition-transform">
                        <MapPin className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {point.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {getRouteName(point.id)} • {pointChildren.length} {pointChildren.length === 1 ? 'criança' : 'crianças'}
                        </p>
                      </div>
                      <ChevronDown 
                        className={`h-6 w-6 text-muted-foreground transition-transform duration-300 ${
                          openPoints.has(point.id) ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-3 pl-2">
                    {pointChildren.map((child) => (
                      <Card key={child.id} glass className="hover:shadow-hover transition-all group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg text-foreground">
                                  {child.name}
                                </CardTitle>
                                {child.responsible && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Responsável: {child.responsible}
                                  </p>
                                )}
                                {child.contact && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">{child.contact}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(child)}
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(child)}
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