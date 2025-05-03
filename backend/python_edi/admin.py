from django.contrib import admin
from .models import PythonTask, Submission, ChatMessage

class PythonTaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'created_at')
    list_filter = ('difficulty', 'created_at')
    search_fields = ('title', 'description')
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'difficulty')
        }),
        ('Test Cases', {
            'fields': ('test_cases',),
            'description': ('Enter test cases as a list of dictionaries with "input" and "expected_output" keys. '
                           'Example: [{"input": "85,90,95,88,92", "expected_output": "90"}, '
                           '{"input": "75,80,85,90,95", "expected_output": "85"}]')
        }),
    )

class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'is_successful', 'submitted_at')
    list_filter = ('is_successful', 'submitted_at')
    search_fields = ('user__username', 'task__title')
    readonly_fields = ('user', 'task', 'code', 'is_successful', 'error_message', 'output', 'submitted_at')

class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'is_from_user', 'created_at')
    list_filter = ('is_from_user', 'created_at')
    search_fields = ('user__username', 'task__title', 'message')
    readonly_fields = ('user', 'task', 'message', 'is_from_user', 'created_at')

admin.site.register(PythonTask, PythonTaskAdmin)
admin.site.register(Submission, SubmissionAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)
