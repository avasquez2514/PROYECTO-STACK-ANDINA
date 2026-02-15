from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SoporteViewSet, AsesorSoporteViewSet, FuncionarioViewSet

router = DefaultRouter()
router.register(r'soporte', SoporteViewSet)
router.register(r'asesores', AsesorSoporteViewSet)
router.register(r'funcionarios', FuncionarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
