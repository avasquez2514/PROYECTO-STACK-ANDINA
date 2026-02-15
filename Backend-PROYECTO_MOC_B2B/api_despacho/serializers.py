from rest_framework import serializers
from .models import Soporte, AsesorSoporte, Funcionario  # 👈 importa todos los modelos que usas


class SoporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Soporte
        fields = '__all__'


class AsesorSoporteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsesorSoporte
        fields = '__all__'

class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = "__all__"