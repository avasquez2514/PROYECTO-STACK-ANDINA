from django.db import models


# 🔹 Tabla soporte (ya existe en la BD, no la modificamos)
class Soporte(models.Model):
    id = models.AutoField(primary_key=True)
    fecha_hora = models.DateTimeField()
    en_sitio = models.BooleanField()
    nombre = models.CharField(max_length=255)
    celular = models.CharField(max_length=20)
    torre = models.CharField(max_length=255)
    incidente = models.CharField(max_length=255)

    # La columna en tu BD ya se llama "gestion"
    GESTIONES = [
        ("SOPORTE", "Soporte"),
        ("ASESORIA", "Asesoría"),
        ("CIERRE", "Cierre"),
        ("ENRUTAR", "Enrutar"),
    ]
    gestion = models.CharField(max_length=50, choices=GESTIONES)

    observaciones = models.TextField()
    plantilla = models.TextField()
    login_n1 = models.CharField(max_length=255)
    tipo_servicio = models.CharField(max_length=255)
    estado = models.CharField(max_length=255)
    observaciones_ultima = models.TextField()

    class Meta:
        db_table = "soporte"

    def __str__(self):
        return f"{self.nombre} - {self.gestion}"


# 🔹 Nueva tabla para asesores
class AsesorSoporte(models.Model):
    PERFILES = [
        ("EN_CIERRES", "En Cierres"),
        ("SOLO_SOPORTES", "Solo Soportes"),
        ("TODO", "Todo tipo de gestión"),
    ]
    
    ESTADOS = [
        ("NO_DISPONIBLE", "No disponible"),
        ("EN_GESTION", "En gestión"),
        ("EN_DESCANSO", "En descanso"),
        ("CASO_COMPLEJO", "Caso complejo"),
    ]

    id = models.AutoField(primary_key=True)
    nombre_asesor = models.CharField(max_length=255)
    cedula = models.CharField(max_length=20, unique=True)
    login = models.CharField(max_length=100, unique=True)
    
    # Nuevos campos para Administrador
    perfil = models.CharField(max_length=20, choices=PERFILES, default="TODO")
    estado = models.CharField(max_length=20, choices=ESTADOS, default="NO_DISPONIBLE")
    ultimo_cambio_estado = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "asesor_soporte"

    def __str__(self):
        return f"{self.nombre_asesor} ({self.login}) - {self.perfil}"

# 🔹 Nueva tabla para funcionarios
class Funcionario(models.Model):
    id = models.AutoField(primary_key=True)
    nombre_funcionario = models.CharField(max_length=255, unique=True)
    cedula = models.CharField(max_length=20, unique=True)
    celular = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "funcionarios"

    def __str__(self):
        return self.nombre_funcionario