import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { addPoint, getPoints, updatePoint, deletePoint, type Point } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export function PointsTab() {
  const [points, setPoints] = useState<Point[]>(getPoints());
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    address: ""
  });

  const resetForm = () => {
    setFormData({ name: "", address: "" });
    setEditingPoint(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do ponto é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingPoint) {
        updatePoint(editingPoint.id, formData);
        toast({
          title: "Sucesso",
          description: "Ponto atualizado com sucesso"
        });
      } else {
        addPoint(formData);
        toast({
          title: "Sucesso", 
          description: "Ponto cadastrado com sucesso"
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
      name: point.name,
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
                <Label htmlFor="name">Nome do Ponto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Escola Municipal João Silva"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Endereço (opcional)</Label>
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

      <div className="space-y-3">
        {points.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum ponto cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece cadastrando um ponto de embarque
              </p>
            </CardContent>
          </Card>
        ) : (
          points.map((point) => (
            <Card key={point.id} className="shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {point.name}
                    </CardTitle>
                    {point.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {point.address}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(point)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(point)}
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