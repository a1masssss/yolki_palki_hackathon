from django.db import models

class VideoRecording(models.Model):
    title = models.CharField(max_length=255, default="Screen Recording")
    video = models.FileField(upload_to='videos/')
    upload_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class VideoSummary(models.Model):
    video = models.ForeignKey(VideoRecording, on_delete=models.CASCADE, related_name='summaries')
    timestamp = models.IntegerField() 
    summary_text = models.TextField(blank=True, null=True)
    video_segment = models.BinaryField(blank=True, null=True)
    segment_name = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"Summary at {self.timestamp}s for {self.video.title}"