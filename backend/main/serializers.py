from rest_framework import serializers
from .models import Task, UserSubmission
from users.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'difficulty', 'created_at']

class UserSubmissionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = UserSubmission
        fields = ['id', 'task', 'task_title', 'user_name', 'code', 'is_correct', 'submitted_at']
        read_only_fields = ['is_correct', 'submitted_at'] 