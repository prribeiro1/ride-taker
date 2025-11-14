import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Users, Check, X, ChevronDown } from "lucide-react";
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
  const [openRoutes, setOpenRoutes] = useState<Set<string>>(new Set());
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
    const loadedRoutes = getRoutes();
    setRoutes(loadedRoutes);
    setTodayAttendance(getTodayAttendance());
    // Open all routes by default on first load
    setOpenRoutes(new Set(loadedRoutes.map(r => r.id)));
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
        <Card glass className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-medium mb-4">
              <Users className="h-12 w-12 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-foreground">Nenhuma criança cadastrada</h3>
            <p className="text-muted-foreground">
              Cadastre pontos e crianças primeiro para fazer a chamada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 stagger-children">
          {dataByRoute.map(({ route, points: routePoints }) => (
            <Collapsible
              key={route.id}
              open={openRoutes.has(route.id)}
              onOpenChange={() => toggleRoute(route.id)}
              className="space-y-3"
            >
              {/* Route Header - Clickable with counters */}
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-3 p-4 glass rounded-xl cursor-pointer hover:shadow-medium transition-all group">
                  <div className="p-2 bg-gradient-primary rounded-lg shadow-medium group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-wide flex items-center gap-2 flex-1">
                    {route.name}
                    {(() => {
                      const routeChildrenIds = routePoints.flatMap(p => p.children.map(c => c.id));
                      const routePresent = todayAttendance.filter(a => 
                        routeChildrenIds.includes(a.childId) && a.present
                      ).length;
                      const routeAbsent = todayAttendance.filter(a => 
                        routeChildrenIds.includes(a.childId) && !a.present
                      ).length;
                      return (
                        <span className="text-sm font-normal text-foreground">
                          (<span className="text-success font-semibold">{routePresent}</span>/
                          <span className="text-destructive font-semibold">{routeAbsent}</span>)
                        </span>
                      );
                    })()}
                  </h2>
                  <ChevronDown 
                    className={`h-6 w-6 text-muted-foreground transition-transform duration-300 ${
                      openRoutes.has(route.id) ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
              </CollapsibleTrigger>

              {/* Points in this Route */}
              <CollapsibleContent className="space-y-3 pl-2">
                {routePoints.map(({ point, children: pointChildren }) => (
                <Card key={point.id} glass>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{point.name}</span>
                      <Badge variant="secondary" className="ml-auto bg-accent/10 text-accent font-semibold">
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
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}