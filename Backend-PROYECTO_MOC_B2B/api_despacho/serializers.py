from rest_framework import serializers
from .models import Soporte, AsesorSoporte, Funcionario, HistorialEstadoAsesor


class SoporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Soporte
        fields = '__all__'


class HistorialEstadoAsesorSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialEstadoAsesor
        fields = '__all__'


class AsesorSoporteSerializer(serializers.ModelSerializer):
    historial_estados = HistorialEstadoAsesorSerializer(many=True, read_only=True)

    class Meta:
        model = AsesorSoporte
        fields = ['id', 'nombre_asesor', 'cedula', 'login', 'perfil', 'estado', 'ultimo_cambio_estado', 'historial_estados']


class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = "__all__"