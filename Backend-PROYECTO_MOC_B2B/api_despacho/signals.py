from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Soporte, AsesorSoporte, Noticia

@receiver([post_save, post_delete], sender=Soporte)
def notify_soporte_change(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            "global_updates",
            {
                "type": "data_update",
                "model": "soporte",
                "action": "change"
            }
        )

@receiver([post_save, post_delete], sender=AsesorSoporte)
def notify_asesor_change(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            "global_updates",
            {
                "type": "data_update",
                "model": "asesor",
                "action": "change"
            }
        )

@receiver([post_save, post_delete], sender=Noticia)
def notify_noticia_change(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            "global_updates",
            {
                "type": "data_update",
                "model": "noticia",
                "action": "change"
            }
        )
