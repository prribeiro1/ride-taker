import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Route as RouteIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addRoute, getRoutes, updateRoute, deleteRoute, type Route } from "@/lib/storage";

export function RoutesTab() {
  const [routes, setRoutes] = useState<Route[]>(getRoutes());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    setRoutes(getRoutes());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da rota é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (editingRoute) {
      updateRoute(editingRoute.id, formData);
      toast({
        title: "Sucesso",
        description: "Rota atualizada com sucesso",
      });
    } else {
      addRoute(formData);
      toast({
        title: "Sucesso",
        description: "Rota adicionada com sucesso",
      });
    }

    setRoutes(getRoutes());
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({ name: route.name, description: route.description || "" });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta rota? Todos os pontos e crianças associados também serão excluídos.")) {
      deleteRoute(id);
      setRoutes(getRoutes());
      toast({
        title: "Sucesso",
        description: "Rota excluída com sucesso",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingRoute(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Rotas
          </h2>
          <p className="text-muted-foreground mt-1">Gerencie as rotas de transporte</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Rota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoute ? "Editar Rota" : "Nova Rota"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Rota *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Rota A"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Zona Norte"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingRoute ? "Atualizar" : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
        {routes.length === 0 ? (
          <Card glass className="col-span-full p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-primary rounded-2xl shadow-medium">
                <RouteIcon className="h-12 w-12 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">Nenhuma rota cadastrada ainda</p>
            </div>
          </Card>
        ) : (
          routes.map((route) => (
            <Card key={route.id} glass className="group">
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-3 bg-gradient-primary rounded-xl shadow-medium group-hover:scale-110 transition-transform">
                      <RouteIcon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-foreground">{route.name}</h3>
                      {route.description && (
                        <p className="text-sm text-muted-foreground mt-1">{route.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(route)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(route.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
