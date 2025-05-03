from django.urls import path
from .views import upload_video, get_video_summaries

urlpatterns = [
    path('upload', upload_video, name='upload_video'),
    path('summaries/<int:video_id>', get_video_summaries, name='get_video_summaries'),
]
