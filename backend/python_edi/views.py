from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import PythonTask, Submission, ChatMessage
from .serializers import PythonTaskSerializer, SubmissionSerializer, ChatMessageSerializer
from .openai_utils import execute_python_code, get_ai_assistance, get_task_template, generate_python_task
import json
from rest_framework import permissions
import random
import re

def editor_view(request):
    """
    Render the Python EDI editor interface.
    If a task_id is provided in the query string, pass it to the template context.
    """
    context = {}
    
    # Check if a task_id is provided in the query string
    task_id = request.GET.get('task_id')
    if task_id:
        try:
            task = PythonTask.objects.get(pk=task_id)
            # Add task_id to context to initialize the editor with this task
            context['task_id'] = task_id
            context['task_title'] = task.title
        except PythonTask.DoesNotExist:
            # If task doesn't exist, we'll just ignore the task_id
            pass
    
    return render(request, 'python_edi/editor.html', context)

class PythonTaskViewSet(viewsets.ModelViewSet):
    queryset = PythonTask.objects.all()
    serializer_class = PythonTaskSerializer
    permission_classes = [permissions.AllowAny]  # Allow any requests for testing
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Add a template to help students get started
        data['template'] = get_task_template(
            instance.title, 
            task_description=instance.description,
            test_cases=instance.test_cases
        )
        
        return Response(data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def generate_task(request):
    """
    Generate a new Python task using OpenAI API and save it to the database.
    The task will have multiple test cases with integer output.
    """
    try:
        difficulty = request.data.get('difficulty', 'easy')
        
        # Generate task using OpenAI
        task_data = generate_python_task(difficulty)
        
        # Create a new task instance and save to database
        task = PythonTask.objects.create(
            title=task_data.get('title'),
            description=task_data.get('description'),
            difficulty=difficulty,
            test_cases=task_data.get('test_cases', []),
            hints=task_data.get('hints', [])  # Save hints if provided
        )
        
        serializer = PythonTaskSerializer(task)
        return Response(serializer.data)
    except ValueError as e:
        # This handles specific ValueErrors raised by generate_python_task
        import traceback
        print(f"OpenAI API error in generate_task: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        import traceback
        print(f"Error in generate_task: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def random_task(request):
    """
    Get a random Python task from the database based on difficulty.
    """
    try:
        difficulty = request.query_params.get('difficulty', 'easy')
        
        # Filter tasks by difficulty
        tasks = PythonTask.objects.filter(difficulty=difficulty)
        
        if not tasks.exists():
            # If no tasks with the specified difficulty, get all tasks
            tasks = PythonTask.objects.all()
            
        if not tasks.exists():
            return Response(
                {"error": "No tasks available in the database"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Select a random task
        random_task = random.choice(tasks)
        
        serializer = PythonTaskSerializer(random_task)
        return Response(serializer.data)
    except Exception as e:
        import traceback
        print(f"Error in random_task: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_solution(request):
    """
    Submit a solution for a Python task.
    This endpoint checks the solution correctness on all test cases.
    Authentication is disabled for testing
    """
    try:
        task = request.data.get('task')

    except PythonTask.DoesNotExist:
        return Response(
            {"error": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    code = request.data.get('code')
    
    if not code:
        return Response(
            {"error": "Code is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    # Check if task has test cases
    if not task.get('testCases') or len(task.get('testCases', [])) == 0:
        return Response(
            {"error": "No test cases found for this task"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Preprocess the code to handle return statements in main function
    if "def main(" in code and "return" in code:
        # Find main function and replace return statements with print statements
        lines = code.split('\n')
        in_main_func = False
        main_indent = ""
        
        for i in range(len(lines)):
            if re.match(r'^\s*def\s+main\s*\(', lines[i]):
                in_main_func = True
                # Get the indentation level
                main_indent = re.match(r'^(\s*)', lines[i]).group(1)
            elif in_main_func and lines[i].strip() and not lines[i].startswith(main_indent + " "):
                # End of main function
                in_main_func = False
            
            # Replace return with print in the main function
            if in_main_func and "return" in lines[i]:
                # Extract the returned value
                return_match = re.search(r'return\s+(.*?)(\s*#.*)?$', lines[i])
                if return_match:
                    returned_value = return_match.group(1).strip()
                    # Replace with print statement
                    indent = re.match(r'^(\s*)', lines[i]).group(1)
                    lines[i] = f"{indent}print(str({returned_value}))  # Auto-converted return"
        
        code = '\n'.join(lines)
    
    # Test the solution against all test cases
    test_results = []
    all_passed = True
    execution_error = None
    
    for i, test_case in enumerate(task.get('testCases')):
        test_input = test_case.get('input', None)
        expected_output = test_case.get('expectedOutput', None)

        if test_input is None:
            print("Test input is None")

        if expected_output is None:
            print("Expected output is None")
        
        # Ensure code is automatically run with the test input
        processed_code = code
        if "def main(" in processed_code and "main(" not in processed_code.split("def main(")[1]:
            processed_code += "\n\n# Auto-added by the system\ninput_value = input()\nmain(input_value)\n"
        
        # Run the code with test input
        result = execute_python_code(processed_code, test_input)
        
        if not result['success']:
            # Code execution failed
            execution_error = result.get('error', 'Code execution failed')
            return Response({
                'success': False,
                'error': execution_error,
                'submission_id': None
            })
        
        # Check if output matches expected output
        actual_output = str(result.get('output', '')).strip()
        is_correct = actual_output == expected_output
        
        if not is_correct:
            all_passed = False
        
        test_results.append({
            "test_case_index": i,
            "input": test_input,
            "expected_output": expected_output,
            "actual_output": actual_output,
            "passed": is_correct
        })
    
    # Create submission record for authenticated users
    submission_id = None
    if request.user.is_authenticated:
        submission = Submission.objects.create(
            user=request.user,
            task=task,
            code=code,
            is_successful=all_passed,
            error_message=execution_error if execution_error else None if all_passed else "One or more test cases failed",
            output=json.dumps(test_results)
        )
        submission_id = submission.id
    
    # Return detailed result information
    return Response({
        'submission_id': submission_id,
        'success': all_passed,
        'results': test_results,
        'message': 'All test cases passed!' if all_passed else 'One or more test cases failed'
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def get_assistance(request, task_id):
    """
    Get AI assistance for a Python task.
    Authentication is disabled for testing
    """
    try:
        try:
            task = PythonTask.objects.get(pk=task_id)
        except PythonTask.DoesNotExist:
            return Response(
                {"error": "Task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        code = request.data.get('code', '')
        error_message = request.data.get('error_message', '')
        user_message = request.data.get('message', '')
        
        # Get user (handle anonymous users for demonstration)
        user = request.user if request.user.is_authenticated else None
        
        # Save user message if user is authenticated
        if user:
            chat_message = ChatMessage.objects.create(
                user=user,
                task=task,
                message=user_message,
                is_from_user=True
            )
        
        # Get assistance from OpenAI
        combined_message = f"{user_message}\n\nCode:\n{code}\n\nError: {error_message}"
        ai_response = get_ai_assistance(code, error_message, task.description)
        
        # Save AI response if user is authenticated
        if user:
            ai_chat_message = ChatMessage.objects.create(
                user=user,
                task=task,
                message=ai_response,
                is_from_user=False
            )
        
        return Response({
            'message': ai_response
        })
    except Exception as e:
        import traceback
        print(f"Error in get_assistance: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'message': f"I'm sorry, I couldn't provide assistance due to a server error: {str(e)}"
        })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_chat_history(request, task_id):
    """
    Get chat history for a specific task.
    Authentication is disabled for testing
    """
    try:
        task = PythonTask.objects.get(pk=task_id)
    except PythonTask.DoesNotExist:
        return Response(
            {"error": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle anonymous users
    if not request.user.is_authenticated:
        return Response([])
    
    messages = ChatMessage.objects.filter(
        task=task,
        user=request.user
    ).order_by('created_at')
    
    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def run_code(request):
    """
    Run Python code and return the output (for client-side testing).
    """
    # Authentication is disabled for testing
    try:
        code = request.data.get('code')
        if not code:
            return Response(
                {"error": "Code is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional input data
        input_data = request.data.get('input', '')
        
        # Preprocess the code to handle return statements in main function
        if "def main(" in code and "return" in code:
            # Find main function and replace return statements with print statements
            lines = code.split('\n')
            in_main_func = False
            main_indent = ""
            
            for i in range(len(lines)):
                if re.match(r'^\s*def\s+main\s*\(', lines[i]):
                    in_main_func = True
                    # Get the indentation level
                    main_indent = re.match(r'^(\s*)', lines[i]).group(1)
                elif in_main_func and lines[i].strip() and not lines[i].startswith(main_indent + " "):
                    # End of main function
                    in_main_func = False
                
                # Replace return with print in the main function
                if in_main_func and "return" in lines[i]:
                    # Extract the returned value
                    return_match = re.search(r'return\s+(.*?)(\s*#.*)?$', lines[i])
                    if return_match:
                        returned_value = return_match.group(1).strip()
                        # Replace with print statement
                        indent = re.match(r'^(\s*)', lines[i]).group(1)
                        lines[i] = f"{indent}print(str({returned_value}))  # Auto-converted return"
            
            code = '\n'.join(lines)
        
        # Ensure code is automatically run even if there's no explicit call
        # Check if code includes a main function but doesn't call it
        if "def main(" in code and "main(" not in code.split("def main(")[1]:
            code += "\n\n# Auto-added by the system\ninput_value = input()\nmain(input_value)\n"
        elif "def main():" in code and "main()" not in code.split("def main():")[1]:
            code += "\n\n# Auto-added by the system\nmain()\n"
        
        # Execute the code
        result = execute_python_code(code, input_data)
        
        if result['success']:
            return Response({
                'output': str(result['output'])
            })
        else:
            return Response({
                'error': str(result['error'])
            })
    except Exception as e:
        import traceback
        print(f"Error in run_code: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_task_hints(request, task_id):
    """
    Get hints for a specific task.
    Authentication is disabled for testing.
    The request can specify hint_index to get a specific hint.
    If no hint_index is provided, returns all hints.
    """
    try:
        try:
            task = PythonTask.objects.get(pk=task_id)
        except PythonTask.DoesNotExist:
            return Response(
                {"error": "Task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        hint_index = request.query_params.get('hint_index')
        
        # If the task has no hints, generate some generic ones
        if not task.hints or len(task.hints) == 0:
            generic_hints = [
                "Start by understanding what the problem is asking for and the expected input/output format.",
                "Break down the problem into smaller steps and tackle each one separately.",
                "Don't forget to handle edge cases in your solution."
            ]
            task.hints = generic_hints
            task.save()
        
        # If hint_index is provided, return that specific hint
        if hint_index is not None:
            try:
                index = int(hint_index)
                if 0 <= index < len(task.hints):
                    return Response({
                        'hint': task.hints[index],
                        'hint_index': index,
                        'total_hints': len(task.hints)
                    })
                else:
                    return Response(
                        {"error": f"Hint index out of range. Available hints: 0-{len(task.hints) - 1}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {"error": "Invalid hint index. Must be an integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Otherwise return all hints
        return Response({
            'hints': task.hints,
            'total_hints': len(task.hints)
        })
    except Exception as e:
        import traceback
        print(f"Error in get_task_hints: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': f"Server error: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
