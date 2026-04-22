import json
import base64
import uuid
from django.core.files.base import ContentFile
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, Soporte

class ChatConsumer(AsyncWebsocketConsumer):
    """
    Gestiona la comunicación bidireccional en tiempo real para el Chat.
    
    Permite el envío de mensajes de texto e imágenes procesadas como Base64,
    los cuales se persisten en la base de datos y se retransmiten a todos
    los participantes suscritos a la sala (room) del ticket.
    """
    async def connect(self):
        self.soporte_id = self.scope['url_route']['kwargs']['soporte_id']
        self.room_group_name = f'chat_{self.soporte_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')
        remitente = data.get('remitente', 'SISTEMA')
        rol = data.get('rol') 
        imagen_b64 = data.get('imagen') # BASE64 string

        # Save message to database and get the instance
        chat_msg = await self.save_message(self.soporte_id, remitente, message, rol, imagen_b64)
        
        # Get the URL of the saved image if it exists
        imagen_url = chat_msg.imagen.url if chat_msg.imagen else None

        # Send message to room group (Now with URL instead of B64)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'remitente': remitente,
                'rol': rol,
                'imagen_url': imagen_url
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'remitente': event['remitente'],
            'rol': event.get('rol'),
            'imagen': event.get('imagen_url') # Enviar la URL al frontend
        }))

    @database_sync_to_async
    def save_message(self, soporte_id, remitente, message, rol, imagen=None):
        soporte = Soporte.objects.get(id=soporte_id)
        
        # Marcar como no visto solo para los receptores necesarios
        if rol == "SOPORTE":
            soporte.chat_visto_tecnico = False
            soporte.save(update_fields=['chat_visto_tecnico'])
        elif rol == "DESPACHO":
            pass 
        elif rol == "TECNICO":
            soporte.chat_visto_soporte = False
            soporte.save(update_fields=['chat_visto_soporte'])
            
        file_obj = None
        if imagen and isinstance(imagen, str) and imagen.startswith('data:image'):
            try:
                format, imgstr = imagen.split(';base64,')
                ext = format.split('/')[-1]
                filename = f"chat_{soporte_id}_{uuid.uuid4().hex[:8]}.{ext}"
                file_obj = ContentFile(base64.b64decode(imgstr), name=filename)
            except Exception as e:
                print(f"Error decoding image: {e}")

        return ChatMessage.objects.create(
            soporte=soporte,
            remitente=remitente,
            mensaje=message,
            imagen=file_obj
        )

class DataUpdateConsumer(AsyncWebsocketConsumer):
    """
    Transmisor global de actualizaciones de datos.
    
    Escucha cambios en los modelos de Django (vía signals) y notifica al 
    Frontend para que refresque las tablas o KPIs de forma instantánea
    sin necesidad de recargar la página.
    """
    async def connect(self):
        await self.channel_layer.group_add("global_updates", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("global_updates", self.channel_name)

    async def data_update(self, event):
        # Event structure: {"type": "data_update", "model": "...", "action": "..."}
        await self.send(text_data=json.dumps({
            'model': event.get('model'),
            'action': event.get('action'),
            'data': event.get('data')
        }))
