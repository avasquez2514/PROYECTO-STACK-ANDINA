from rest_framework import serializers
from .models import Soporte, AsesorSoporte, Funcionario, HistorialEstadoAsesor, ChatMessage, Noticia, SoporteEvidencia


class SoporteEvidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoporteEvidencia
        fields = '__all__'


class SoporteSerializer(serializers.ModelSerializer):
    nombre_n1_completo = serializers.SerializerMethodField()

    class Meta:
        model = Soporte
        fields = '__all__'

    def get_nombre_n1_completo(self, obj):
        if obj.login_n1 and obj.login_n1 != "POR_ASIGNAR":
            # Realizamos un pequeño cache o búsqueda rápida
            from .models import AsesorSoporte
            asesor = AsesorSoporte.objects.filter(login=obj.login_n1).first()
            return asesor.nombre_asesor if asesor else obj.login_n1
        return "PENDIENTE"

    evidencias_files = SoporteEvidenciaSerializer(many=True, read_only=True)


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
        
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'

class NoticiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticia
        fields = '__all__'