from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Soporte, AsesorSoporte, Funcionario, ChatMessage, Noticia
from .serializers import SoporteSerializer, AsesorSoporteSerializer, FuncionarioSerializer, ChatMessageSerializer, NoticiaSerializer


class SoporteViewSet(viewsets.ModelViewSet):
    queryset = Soporte.objects.all()
    serializer_class = SoporteSerializer

    def create(self, request, *args, **kwargs):
        # El serializer maneja los campos normales
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        soporte = serializer.save()
        
        # Procesar archivos de evidencia que vengan como archivos reales en el multipart
        # Se esperan llaves como evidencia_0, evidencia_1, etc.
        from .models import SoporteEvidencia
        for key in request.FILES:
            if key.startswith('evidencia_'):
                SoporteEvidencia.objects.create(
                    soporte=soporte,
                    archivo=request.FILES[key]
                )
                
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class AsesorSoporteViewSet(viewsets.ModelViewSet):
    queryset = AsesorSoporte.objects.all().order_by("id")
    serializer_class = AsesorSoporteSerializer

class FuncionarioViewSet(viewsets.ModelViewSet):
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer

    @action(detail=False, methods=['post'])
    def login(self, request):
        cedula = request.data.get('cedula')
        password = request.data.get('password')

        if not cedula or not password:
            return Response({'error': 'Faltan credenciales'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            funcionario = Funcionario.objects.get(cedula=cedula)
            # Validación dual (contraseña nueva o cédula como contraseña antigua)
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