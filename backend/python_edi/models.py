from django.db import models
from django.conf import settings

class PythonTask(models.Model):
    """
    Model for Python programming tasks.
    
    Test cases format example:
    [
        {
            "input": "85,90,95,88,92",
            "expected_output": "90"
        },
        {
            "input": "75,80,85,90,95",
            "expected_output": "85"
        }
    ]
    
    For tasks where input is a string of comma-separated values and output is a single value.
    The test runner will automatically parse these inputs when passed to the student's function.
    """
    title = models.CharField(max_length=255)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=[
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    ], default='easy')
    expected_output = models.TextField(blank=True, null=True)
    test_cases = models.JSONField(default=list, help_text="List of dictionaries with 'input' and 'expected_output' keys")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class Submission(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    task = models.ForeignKey(PythonTask, on_delete=models.CASCADE)
    code = models.TextField()
    is_successful = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, null=True)
    output = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.task.title}"

class ChatMessage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    task = models.ForeignKey(PythonTask, on_delete=models.CASCADE)
    message = models.TextField()
    is_from_user = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
