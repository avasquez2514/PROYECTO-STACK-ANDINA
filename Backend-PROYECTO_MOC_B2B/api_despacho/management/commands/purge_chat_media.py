import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api_despacho.models import ChatMessage

class Command(BaseCommand):
    help = 'Limpia automáticamente los mensajes de chat y archivos de imagen que tengan más de 90 días'

    def handle(self, *args, **options):
        # 1. Definir la fecha límite (ej. 90 días antes de hoy)
        dias_retencion = 90
        fecha_limite = timezone.now() - timedelta(days=dias_retencion)
        
        # 2. Filtrar mensajes antiguos que tengan imagen
        mensajes_con_imagen = ChatMessage.objects.filter(
            fecha_hora__lt=fecha_limite
        ).exclude(imagen__exact='')

        self.stdout.write(self.style.NOTICE(f"--- Iniciando purga de archivos antiguos de chat (> {dias_retencion} días) ---"))
        
        eliminados_archivos = 0
        for msg in mensajes_con_imagen:
            if msg.imagen:
                if os.path.isfile(msg.imagen.path):
                    # Borrar el archivo físico del disco
                    os.remove(msg.imagen.path)
                    eliminados_archivos += 1
        
        # 3. Borrar los registros de la base de datos (mensajes totales antiguos)
        total_mensajes = ChatMessage.objects.filter(fecha_hora__lt=fecha_limite).count()
        ChatMessage.objects.filter(fecha_hora__lt=fecha_limite).delete()

        self.stdout.write(self.style.SUCCESS(
            f"LIMPIEZA COMPLETADA:\n"
            f"- Archivos físicos eliminados del disco: {eliminados_archivos}\n"
            f"- Registros antiguos borrados de la Base de Datos: {total_mensajes}"
        ))
