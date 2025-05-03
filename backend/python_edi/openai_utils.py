import requests
import json
import os
import tempfile
import subprocess
from django.conf import settings
import re
import time

def execute_python_code(code, test_input=None):
    """
    Execute Python code via subprocess.
    Wraps process_code_locally for backward compatibility.
    """
    try:
        # Handle list inputs by joining with commas
        if isinstance(test_input, list):
            test_input = ', '.join(map(str, test_input))
        
        # Call the implementation function
        return process_code_locally(code, test_input)
    except Exception as e:
        print(f"Error executing code: {str(e)}")
        return {
            "success": False,
            "output": None,
            "error": f"Error executing code: {str(e)}"
        }

def process_code_locally(code, test_input=None):
    """
    Execute Python code by saving it to a temporary file and running it as a subprocess.
    This is safer and more realistic than using exec.
    """
    try:
        # Pre-process code to ensure proper output
        processed_code = code

        # Check if code includes a main function but doesn't call it
        if "def main(" in code and "main(" not in code.split("def main(")[1]:
            processed_code += "\n\n# Auto-added by the system\ninput_value = input()\nprint(main(input_value))\n"
        elif "def main():" in code and "main()" not in code.split("def main():")[1]:
            processed_code += "\n\n# Auto-added by the system\nprint(main())\n"
        elif "def solution(" in code and "solution(" not in code.split("def solution(")[1]:
            processed_code += "\n\n# Auto-added by the system\ninput_value = input()\nresult = solution(input_value)\nprint(result)\n"

        # Create a temporary file to store the code
        with tempfile.NamedTemporaryFile(suffix='.py', delete=False, mode='w') as temp_file:
            temp_file_path = temp_file.name
            temp_file.write(processed_code)
        
        try:
            # Prepare input data (add newline for proper stdin handling)
            input_data = f"{test_input}\n" if test_input else ""
            
            # Run the Python interpreter as a subprocess
            process = subprocess.run(
                ["python", temp_file_path],
                input=input_data,
                capture_output=True,
                text=True,
                timeout=3  # 3 second timeout
            )
            
            # Get the output and errors
            output = process.stdout.strip() if process.stdout else ""
            error = process.stderr.strip() if process.stderr else None
            
            # Check for errors
            if process.returncode != 0:
                return {
                    "success": False,
                    "output": None,
                    "error": f"Execution error: {error or 'Unknown error'}"
                }
            
            print(f"Execution successful, output: {output}")
            return {
                "success": True,
                "output": output,
                "error": None
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": None,
                "error": "Code execution timed out after 3 seconds"
            }
        except Exception as e:
            import traceback
            print(f"Execution error: {str(e)}")
            print(traceback.format_exc())
            return {
                "success": False,
                "output": None,
                "error": f"Error executing code: {str(e)}"
            }
        finally:
            # Clean up the temporary file
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print(f"Warning: Could not delete temporary file {temp_file_path}: {e}")
                
    except Exception as e:
        return {
            "success": False,
            "output": None,
            "error": f"Error in local execution: {str(e)}"
        }

def get_ai_assistance(code, error_message, task_description):
    """
    Get AI assistance for debugging Python code.
    """
    # Check for syntax errors
    if "Syntax Error" in error_message or "invalid token" in error_message.lower() or "unexpected token" in error_message.lower():
        return """I see you're getting a syntax error. This usually means there's a problem with the structure of your code. Here are some common issues to check:

1. **Mismatched quotes**: Make sure all your quotes (', ", ''') are properly opened and closed.
   Example: `print('Hello)` is missing the closing quote.

2. **Mismatched brackets**: Check that all parentheses (), square brackets [], and curly braces {} are balanced.
   Example: `if (x > 5:` is missing the closing parenthesis.

3. **Special characters**: Sometimes copy-pasting code from websites brings special invisible characters.
   Try deleting the line with the error and retyping it manually.

4. **Invalid indentation**: Python requires consistent indentation (spaces or tabs).
   Make sure all your lines are properly indented.

5. **Unicode characters**: Ensure you're not using special Unicode characters like "smart quotes" (", ") instead of regular quotes.

Look closely at the line where the error occurs and the character position mentioned in the error message."""
    
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        # Return generic assistance if API key is not available
        print("Warning: OpenAI API key not set. Using generic assistance.")
        return """I'll help you solve this problem! Here are some tips:

1. Make sure you've understood the problem requirements correctly.
2. Check that your function names match exactly what's asked in the problem.
3. Test your solution with the provided examples.
4. Make sure you're returning the correct values, not just printing them.
5. Pay attention to the data types (integers, strings, lists, etc.).

If you're getting an error, carefully read the error message - it often tells you exactly what's wrong.

Feel free to ask specific questions about your code!"""
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    prompt = f"""
    I'm trying to solve this Python task:
    
    {task_description}
    
    Here's my code:
    ```python
    {code}
    ```
    
    Error message: {error_message}
    
    Can you help me understand what's wrong and how to fix it?
    """
    
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"]
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error in AI assistance: {http_err}")
        try:
            error_detail = response.json()
            print(f"API error details: {error_detail}")
            return f"I couldn't provide assistance at this time. API error: {http_err}"
        except:
            print("Could not parse error response")
            return f"I couldn't provide assistance at this time. Error: {http_err}"
    except Exception as e:
        print(f"Error getting AI assistance: {e}")
        return f"Sorry, I couldn't provide assistance at this time. Error: {str(e)}"

def get_task_template(task_title, task_description=None, test_cases=None):
    """
    Return a code template based on task title and input format.
    This helps students by providing a starting point with proper structure.
    """
    # Default template using main() function instead of solution()
    default_template = """# Write your solution here
def main(input_data):
    # Your code here
    result = 0  # Replace with your solution
    print(str(result))  # Convert result to string before printing

# Do not modify below this line - the system will auto-run your code
"""

    # Try to detect if we have multiple inputs based on test cases or description
    has_multiple_inputs = False
    input_format = None
    
    if test_cases and len(test_cases) > 0:
        sample_input = test_cases[0].get('input', '')
        # Check if input has commas, suggesting multiple values
        if isinstance(sample_input, str) and ',' in sample_input:
            has_multiple_inputs = True
            input_format = 'comma_separated'
        # Add more format detection as needed
    
    if task_description:
        # Look for clues in the description
        if "two numbers" in task_description.lower() or "multiple" in task_description.lower():
            has_multiple_inputs = True
            input_format = input_format or 'comma_separated'
    
    # Special case for common task types
    if "sum" in task_title.lower() or "add" in task_title.lower():
        if has_multiple_inputs:
            return """# Add two numbers
def main(input_data):
    # Parse input (comma-separated values)
    values = [int(x.strip()) for x in input_data.split(',')]
    
    # Calculate the sum
    result = sum(values)  # or values[0] + values[1] for specifically two numbers
    print(str(result))  # Convert result to string before printing

# Do not modify below this line - the system will auto-run your code
"""
    
    if "average" in task_title.lower() or "mean" in task_title.lower():
        return """# Calculate Average
def main(input_data):
    # Parse input (comma-separated values)
    values = [int(x.strip()) for x in input_data.split(',')]
    
    # Calculate the average
    average = sum(values) / len(values)
    
    # Print the result (rounded to nearest integer)
    print(str(round(average)))  # Convert to string before printing

# Do not modify below this line - the system will auto-run your code
"""
    
    if "count" in task_title.lower() and ("vowel" in task_title.lower() or "vowels" in task_title.lower()):
        return """# Count Vowels in a String
def main(input_data):
    # Define the vowels
    vowels = "aeiou"
    
    # Count the vowels
    count = 0
    for char in input_data.lower():
        if char in vowels:
            count += 1
    
    print(str(count))  # Convert to string before printing

# Do not modify below this line - the system will auto-run your code
"""
    
    if "even" in task_title.lower() and "odd" in task_title.lower():
        return """# Even or Odd Number
def main(input_data):
    # Convert input to integer
    num = int(input_data)
    
    # Check if even or odd (1 for even, 0 for odd)
    # Make sure to print a simple integer value
    if num % 2 == 0:
        print("1")
    else:
        print("0")

# Do not modify below this line - the system will auto-run your code
"""
    
    # For other task types, generate a template based on input format
    if has_multiple_inputs:
        return """# {}
def main(input_data):
    # Parse input (comma-separated values)
    values = [int(x.strip()) for x in input_data.split(',')]
    
    # Your solution logic here
    result = 0  # Replace with your solution
    print(str(result))  # Convert to string before printing

# Do not modify below this line - the system will auto-run your code
""".format(task_title)
    
    # Default fallback for any other case
    return """# {}
def main(input_data):
    # Process the input
    # Your code here
    
    # Calculate and print the result
    result = 0  # Replace with your solution
    print(str(result))  # Convert to string before printing

# Do not modify below this line - the system will auto-run your code
""".format(task_title)

def generate_python_task(difficulty='easy'):
    """
    Generate a Python programming task using OpenAI API.
    The task will have multiple test cases with integer output.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        print("Error: OpenAI API key not set.")
        raise ValueError("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.")
    
    print(f"Generating {difficulty} task using OpenAI API...")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    prompt = f"""
    Generate a {difficulty} Python programming task for a student to solve.
    
    IMPORTANT: The task MUST result in an integer output only (not a float, not a string, not an array).
    The function should process the input and return a single integer value.
    
    The task should include:
    1. A clear title
    2. A description of the problem that includes what the function should do and what input it takes
    3. THREE test cases with input and expected integer output
    4. THREE hints of increasing helpfulness to guide students when they get stuck
    
    Format the response as a JSON object with the following fields:
    - title: string
    - description: string
    - test_cases: array with THREE objects containing 'input' and 'expected_output' fields
    - hints: array with THREE strings containing hints in order of increasing helpfulness
    
    Example of valid output format:
    {{
        "title": "Sum of Two Numbers",
        "description": "Write a function that takes two numbers as input (comma-separated) and returns their sum.",
        "test_cases": [
            {{
                "input": "5, 7",
                "expected_output": "12"
            }},
            {{
                "input": "10, 20",
                "expected_output": "30"
            }},
            {{
                "input": "3, -4",
                "expected_output": "-1"
            }}
        ],
        "hints": [
            "Remember to split the input string to get the individual numbers",
            "After splitting, convert the string values to integers before adding them",
            "Make sure to handle negative numbers correctly in your addition"
        ]
    }}
    
    Again, ensure that:
    1. There are EXACTLY THREE test cases
    2. The expected_output is ALWAYS an integer
    3. The output is in valid JSON format
    4. The description clearly states what the input format is (e.g., a string of comma-separated values)
    5. There are EXACTLY THREE hints of increasing helpfulness
    """
    
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 800
    }
    
    try:
        print("Sending request to OpenAI API...")
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        # Print information about the response
        print(f"OpenAI API response status: {response.status_code}")
        if response.status_code != 200:
            print(f"OpenAI API error: {response.text}")
            raise Exception(f"OpenAI API returned status code {response.status_code}")
            
        response.raise_for_status()
        
        content = response.json()["choices"][0]["message"]["content"]
        # Extract JSON from the response
        try:
            # Print the received content for debugging
            print(f"Received response content: {content[:100]}...")
            
            task_json = json.loads(content)
            
            # Validate the response format
            if not all(key in task_json for key in ['title', 'description', 'test_cases']):
                print("Invalid response format from OpenAI API")
                raise ValueError("Invalid task format received from OpenAI API: missing required fields")
                
            # Make sure there are at least one test case
            if not task_json.get('test_cases'):
                print("No test cases from OpenAI API")
                raise ValueError("Invalid task format: no test cases provided")
            
            # Ensure we have at least one test case, but not more than three
            test_cases = task_json.get('test_cases', [])
            if len(test_cases) > 3:
                test_cases = test_cases[:3]
            
            # Validate each test case format and ensure expected_output is an integer
            for i, test_case in enumerate(test_cases):
                if not all(key in test_case for key in ['input', 'expected_output']):
                    print(f"Invalid test case format in case {i+1}")
                    raise ValueError(f"Invalid test case format in case {i+1}: missing required fields")
                
                # Ensure expected_output is an integer
                try:
                    test_case['expected_output'] = str(int(float(test_case['expected_output'])))
                except (ValueError, TypeError):
                    print(f"Expected output is not an integer in test case {i+1}")
                    raise ValueError(f"Invalid test case format: expected output must be an integer")
            
            # Check for hints
            if 'hints' not in task_json or not isinstance(task_json['hints'], list):
                task_json['hints'] = []
                print("No hints provided in the response")
            
            # Update the task with the validated test cases
            task_json['test_cases'] = test_cases
            
            print(f"Successfully generated task: {task_json['title']} with {len(test_cases)} test cases")
            return task_json
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON from OpenAI: {e}")
            # Try to extract JSON from markdown code blocks
            import re
            json_matches = re.findall(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
            if json_matches:
                print("Attempting to parse JSON from code blocks...")
                try:
                    task_json = json.loads(json_matches[0])
                    print(f"Successfully extracted task from code block: {task_json['title']}")
                    return task_json
                except Exception as e:
                    print(f"Failed to parse JSON from code blocks: {e}")
            
            raise ValueError(f"Failed to parse task JSON from OpenAI API response: {e}")
            
    except Exception as e:
        print(f"Error generating task: {str(e)}")
        raise ValueError(f"Failed to generate task: {str(e)}") 