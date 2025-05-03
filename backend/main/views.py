from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Task, UserSubmission
from .serializers import TaskSerializer, UserSubmissionSerializer, UserSerializer
from python_edi.models import PythonTask, Submission

def home(request):
    return render(request, 'main/home.html')


def history(request):
    """
    Display all the tasks that the user has attempted.
    """
    context = {
        'python_tasks': []
    }
    
    # If user is authenticated, fetch their submissions
    if request.user.is_authenticated:
        # Get all Python EDI tasks that the user has attempted
        user_submissions = Submission.objects.filter(user=request.user).select_related('task')
        
        # Group submissions by task to avoid duplicates
        task_submissions = {}
        for submission in user_submissions:
            task_id = submission.task.id
            if task_id not in task_submissions or submission.submitted_at > task_submissions[task_id]['submitted_at']:
                task_submissions[task_id] = {
                    'task': submission.task,
                    'is_successful': submission.is_successful,
                    'submitted_at': submission.submitted_at,
                    'code': submission.code
                }
        
        # Convert dictionary to list for template
        context['python_tasks'] = [
            {
                'id': task_id,
                'title': data['task'].title,
                'description': data['task'].description,
                'difficulty': data['task'].difficulty,
                'is_successful': data['is_successful'],
                'submitted_at': data['submitted_at'],
                'code': data['code']
            }
            for task_id, data in task_submissions.items()
        ]
        
        # Sort by most recent submissions first
        context['python_tasks'].sort(key=lambda x: x['submitted_at'], reverse=True)
    
    return render(request, 'main/history.html', context)
