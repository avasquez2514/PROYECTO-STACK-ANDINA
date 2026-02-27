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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        
        if not is_new:
            try:
                # FECTH OLD STATUS BEFORE SUPER().SAVE()
                old_instance = AsesorSoporte.objects.filter(pk=self.pk).values('estado').first()
                if old_instance:
                    old_status = old_instance['estado']
            except Exception:
                pass

        super().save(*args, **kwargs)

        # Si el estado cambió o es un registro nuevo
        if is_new or old_status != self.estado:
            from django.utils import timezone
            now = timezone.now()

            # Cerrar el historial anterior si existe
            if not is_new:
                ultimo_historial = HistorialEstadoAsesor.objects.filter(asesor=self, fecha_fin__isnull=True).first()
                if ultimo_historial:
                    ultimo_historial.fecha_fin = now
                    delta = now - ultimo_historial.fecha_inicio
                    ultimo_historial.duracion_segundos = int(delta.total_seconds())
                    ultimo_historial.save()

            # Crear nuevo historial
            HistorialEstadoAsesor.objects.create(
                asesor=self,
                estado=self.estado,
                fecha_inicio=now
            )

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

# 🔹 Nueva tabla para el historial de estados de asesores
class HistorialEstadoAsesor(models.Model):
    asesor = models.ForeignKey(AsesorSoporte, on_delete=models.CASCADE, related_name="historial_estados")
    estado = models.CharField(max_length=50)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_segundos = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "historial_estado_asesor"
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"{self.asesor.login} - {self.estado} ({self.fecha_inicio})"