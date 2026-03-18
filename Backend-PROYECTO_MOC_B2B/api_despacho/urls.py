from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SoporteViewSet, AsesorSoporteViewSet, FuncionarioViewSet, ChatViewSet

router = DefaultRouter()
router.register(r'soporte', SoporteViewSet)
router.register(r'asesores', AsesorSoporteViewSet)
router.register(r'funcionarios', FuncionarioViewSet)
router.register(r'chat', ChatViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
