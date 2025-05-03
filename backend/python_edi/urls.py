from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tasks', views.PythonTaskViewSet, basename='python-task')

urlpatterns = [
    path('', views.editor_view, name='python_editor'),
    path('api/', include(router.urls)),
    path('random-task/', views.random_task, name='random-task'),
    path('generate-task/', views.generate_task, name='generate-task'),
    path('tasks/<int:task_id>/submit/', views.submit_solution, name='submit-solution'),
    path('tasks/<int:task_id>/assistance/', views.get_assistance, name='get-assistance'),
    path('tasks/<int:task_id>/hints/', views.get_task_hints, name='get-hints'),
    path('tasks/<int:task_id>/chat-history/', views.get_chat_history, name='chat-history'),
    path('run-code/', views.run_code, name='run-code'),
    path('run-code', views.run_code, name='run-code-no-slash'),
] 