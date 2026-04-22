from django.contrib import admin
from .models import AsesorSoporte, Funcionario, Soporte


@admin.register(AsesorSoporte)
class AsesorSoporteAdmin(admin.ModelAdmin):
    """
    Configuración para visualizar y editar asesores desde el panel /admin de Django.
    """
    list_display = ("id", "nombre_asesor", "login", "perfil", "estado", "ultimo_cambio_estado")
    search_fields = ("nombre_asesor", "cedula", "login")
    list_filter = ("perfil", "estado")
    readonly_fields = ("ultimo_cambio_estado",)

@admin.register(Funcionario)
class FuncionarioAdmin(admin.ModelAdmin):
    """
    Configuración para la gestión de técnicos de campo desde el panel administrativo.
    """
    list_display = ("id", "nombre_funcionario", "cedula", "celular")
    search_fields = ("nombre_funcionario", "cedula")

@admin.register(Soporte)
class SoporteAdmin(admin.ModelAdmin):
    """
    Panel de control avanzado para supervisar todos los tickets de soporte del sistema.
    """
    list_display = ("id", "fecha_hora", "nombre", "gestion", "incidente", "estado", "login_n1")
    search_fields = ("nombre", "incidente", "login_n1", "torre")
    list_filter = ("gestion", "estado", "en_sitio", "tipo_servicio")
    date_hierarchy = "fecha_hora"