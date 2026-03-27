from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Soporte, AsesorSoporte, Funcionario, ChatMessage, Noticia, AuditLog
from .serializers import SoporteSerializer, AsesorSoporteSerializer, FuncionarioSerializer, ChatMessageSerializer, NoticiaSerializer, AuditLogSerializer


def log_action(request, action_text):
    usuario = request.data.get('admin_user') or request.query_params.get('admin_user') or 'SISTEMA'
    AuditLog.objects.create(usuario=usuario, accion=action_text)

class SoporteViewSet(viewsets.ModelViewSet):
    queryset = Soporte.objects.all()
    serializer_class = SoporteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        soporte = serializer.save()
        
        from .models import SoporteEvidencia
        for key in request.FILES:
            if key.startswith('evidencia_'):
                SoporteEvidencia.objects.create(
                    soporte=soporte,
                    archivo=request.FILES[key]
                )
        
        log_action(request, f"Creó gestión (ID: {soporte.id}) para {soporte.nombre} - INC: {soporte.incidente}")
                
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request, f"Actualizó gestión (ID: {instance.id}) - Estado: {instance.estado}")

class AsesorSoporteViewSet(viewsets.ModelViewSet):
    queryset = AsesorSoporte.objects.all().order_by("id")
    serializer_class = AsesorSoporteSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request, f"Actualizó asesor {instance.nombre_asesor} - Perfil: {instance.perfil}, Estado: {instance.estado}")

    @action(detail=True, methods=['post'])
    def clear_history(self, request, pk=None):
        asesor = self.get_object()
        from .models import HistorialEstadoAsesor
        count = HistorialEstadoAsesor.objects.filter(asesor=asesor).count()
        HistorialEstadoAsesor.objects.filter(asesor=asesor).delete()
        log_action(request, f"Eliminó {count} registros de historial del asesor {asesor.nombre_asesor}")
        return Response({'status': 'historial eliminado'})

class FuncionarioViewSet(viewsets.ModelViewSet):
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request, f"Registró nuevo funcionario: {instance.nombre_funcionario}")

    @action(detail=False, methods=['post'])
    def login(self, request):
        cedula = request.data.get('cedula')
        password = request.data.get('password')

        if not cedula or not password:
            return Response({'error': 'Faltan credenciales'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            funcionario = Funcionario.objects.get(cedula=cedula)
            if funcionario.password == password or funcionario.cedula == password:
                serializer = self.get_serializer(funcionario)
                return Response(serializer.data)
            else:
                return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)
        except Funcionario.DoesNotExist:
            return Response({'error': 'Cédula no registrada'}, status=status.HTTP_401_UNAUTHORIZED)

class ChatViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        queryset = ChatMessage.objects.all()
        soporte_id = self.request.query_params.get('soporte_id')
        if soporte_id:
            queryset = queryset.filter(soporte_id=soporte_id)
        return queryset

class NoticiaViewSet(viewsets.ModelViewSet):
    queryset = Noticia.objects.all()
    serializer_class = NoticiaSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request, f"Publicó nueva noticia: {instance.contenido[:50]}...")

    def perform_destroy(self, instance):
        content = instance.contenido[:50]
        instance.delete()
        log_action(self.request, f"Eliminó noticia: {content}...")

from rest_framework.permissions import IsAuthenticated

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = AuditLog.objects.all().order_by("-fecha_hora")
    serializer_class = AuditLogSerializer