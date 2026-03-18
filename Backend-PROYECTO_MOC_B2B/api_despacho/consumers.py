import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, Soporte

class ChatConsumer(AsyncWebsocketConsumer):
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
        imagen = data.get('imagen') # BASE64 string

        # Save message to database
        await self.save_message(self.soporte_id, remitente, message, rol, imagen)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'remitente': remitente,
                'rol': rol,
                'imagen': imagen
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        remitente = event['remitente']
        rol = event.get('rol')
        imagen = event.get('imagen')

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'remitente': remitente,
            'rol': rol,
            'imagen': imagen
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
            
        return ChatMessage.objects.create(
            soporte=soporte,
            remitente=remitente,
            mensaje=message,
            imagen=imagen
        )
