from rest_framework import serializers
from .models import PythonTask, Submission, ChatMessage

class PythonTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = PythonTask
        fields = '__all__'

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['is_successful', 'error_message', 'output']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['is_from_user'] 