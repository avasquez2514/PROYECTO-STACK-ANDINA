from django.apps import AppConfig


class ApiDespachoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api_despacho'

    def ready(self):
        import api_despacho.signals
