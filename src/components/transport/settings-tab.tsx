import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, User, Edit, Trash2, Phone } from "lucide-react";
import { 
  addChild, 
  getChildren, 
  getPoints, 
  updateChild, 
  deleteChild,
  type Child,
  type Point 
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SettingsTab() {
  const [children, setChildren] = useState<Child[]>(getChildren());
  const [points, setPoints] = useState<Point[]>(getPoints());
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    responsible: "",
    contact: "",
    pointId: ""
  });

  const resetForm = () => {
    setFormData({ name: "", responsible: "", contact: "", pointId: "" });
    setEditingChild(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.pointId) {
      toast({
        title: "Erro",
        description: "Nome da criança e ponto de embarque são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingChild) {
        updateChild(editingChild.id, formData);
        toast({
          title: "Sucesso",
          description: "Criança atualizada com sucesso"
        });
      } else {
        addChild(formData);
        toast({
          title: "Sucesso",
          description: "Criança cadastrada com sucesso"
        });
      }
      
      setChildren(getChildren());
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar criança",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({
      name: child.name,
      responsible: child.responsible,
      contact: child.contact,
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
                <Label htmlFor="name">Nome da Criança *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Maria Silva"
                  className="mt-1"
                />
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
                    {points.map((point) => (
                      <SelectItem key={point.id} value={point.id}>
                        {point.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="responsible">Responsável</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                  placeholder="Ex: João Silva (opcional)"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="contact">Telefone de Contato</Label>
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
        <Card className="shadow-soft border-warning">
          <CardContent className="p-4">
            <p className="text-warning text-sm">
              ⚠️ Cadastre pontos de embarque primeiro antes de adicionar crianças
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {children.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhuma criança cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece cadastrando as crianças que usam o transporte
              </p>
            </CardContent>
          </Card>
        ) : (
          children.map((child) => (
            <Card key={child.id} className="shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {child.name}
                    </CardTitle>
                    <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                      {child.responsible && (
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Responsável: {child.responsible}
                        </p>
                      )}
                      {child.contact && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {child.contact}
                        </p>
                      )}
                      <p className="font-medium text-foreground">
                        Ponto: {getPointName(child.pointId)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(child)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(child)}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}