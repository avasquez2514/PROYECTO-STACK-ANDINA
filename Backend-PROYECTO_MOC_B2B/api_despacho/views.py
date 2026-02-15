from rest_framework import viewsets
from .models import Soporte, AsesorSoporte, Funcionario 
from .serializers import SoporteSerializer, AsesorSoporteSerializer, FuncionarioSerializer


class SoporteViewSet(viewsets.ModelViewSet):
    queryset = Soporte.objects.all()
    serializer_class = SoporteSerializer


class AsesorSoporteViewSet(viewsets.ModelViewSet):
    queryset = AsesorSoporte.objects.all().order_by("id")  # ✅ cambiado a "id"
    serializer_class = AsesorSoporteSerializer

class FuncionarioViewSet(viewsets.ModelViewSet):
    queryset = Funcionario.objects.all()
    serializer_class = FuncionarioSerializer