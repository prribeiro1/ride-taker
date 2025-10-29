import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Check, X } from "lucide-react";
import { 
  getChildren, 
  getPoints, 
  getRoutes,
  getTodayAttendance, 
  markAttendance,
  type Child,
  type Point,
  type Route,
  type Attendance 
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export function AttendanceTab() {
  const [children, setChildren] = useState<Child[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const { toast } = useToast();

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setChildren(getChildren());
    setPoints(getPoints());
    setRoutes(getRoutes());
    setTodayAttendance(getTodayAttendance());
  };

  const handleAttendance = (childId: string, present: boolean) => {
    try {
      markAttendance(childId, present);
      setTodayAttendance(getTodayAttendance());
      
      toast({
        title: "Presença registrada",
        description: present ? "Criança marcada como presente" : "Criança marcada como falta"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar presença",
        variant: "destructive"
      });
    }
  };

  const getChildAttendanceStatus = (childId: string): boolean | null => {
    const attendance = todayAttendance.find(a => a.childId === childId);
    return attendance ? attendance.present : null;
  };

  const getPointName = (pointId: string): string => {
    const point = points.find(p => p.id === pointId);
    return point?.name || "Ponto não encontrado";
  };

  const getRouteName = (routeId: string): string => {
    const route = routes.find(r => r.id === routeId);
    return route?.name || "Rota não encontrada";
  };

  // Group data by Route > Point > Children
  const dataByRoute = routes.map(route => {
    const routePoints = points.filter(p => p.routeId === route.id);
    const pointsWithChildren = routePoints.map(point => {
      const pointChildren = children.filter(c => c.pointId === point.id);
      return {
        point,
        children: pointChildren
      };
    }).filter(p => p.children.length > 0);
    
    return {
      route,
      points: pointsWithChildren
    };
  }).filter(r => r.points.length > 0);

  const totalChildren = children.length;
  const presentToday = todayAttendance.filter(a => a.present).length;
  const absentToday = todayAttendance.filter(a => !a.present).length;

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Chamada Diária</h1>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalChildren}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{presentToday}</div>
            <div className="text-xs text-muted-foreground">Presentes</div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{absentToday}</div>
            <div className="text-xs text-muted-foreground">Faltas</div>
          </CardContent>
        </Card>
      </div>

      {children.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma criança cadastrada</h3>
            <p className="text-muted-foreground">
              Cadastre pontos e crianças primeiro para fazer a chamada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {dataByRoute.map(({ route, points: routePoints }) => (
            <div key={route.id} className="space-y-3">
              {/* Route Header */}
              <div className="flex items-center gap-2 px-2">
                <div className="h-px flex-1 bg-border" />
                <h2 className="text-lg font-bold text-primary uppercase tracking-wide">
                  {route.name}
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Points in this Route */}
              {routePoints.map(({ point, children: pointChildren }) => (
                <Card key={point.id} className="shadow-soft">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {point.name}
                      <Badge variant="secondary" className="ml-auto">
                        {pointChildren.length} {pointChildren.length === 1 ? 'criança' : 'crianças'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {pointChildren.map((child) => {
                      const attendanceStatus = getChildAttendanceStatus(child.id);
                      
                      return (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-3 bg-accent rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{child.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Responsável: {child.responsible}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={attendanceStatus === true ? "default" : "outline"}
                              onClick={() => handleAttendance(child.id, true)}
                              className={
                                attendanceStatus === true 
                                  ? "bg-success hover:bg-success/90 text-success-foreground" 
                                  : "border-success text-success hover:bg-success hover:text-success-foreground"
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant={attendanceStatus === false ? "default" : "outline"}
                              onClick={() => handleAttendance(child.id, false)}
                              className={
                                attendanceStatus === false 
                                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                                  : "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}