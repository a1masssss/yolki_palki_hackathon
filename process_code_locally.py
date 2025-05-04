def main(input_data):
    # Count vowels in the input string
    vowels = "aeiouAEIOU"
    count = 0
    for char in input_data:
        if char in vowels:
            count += 1
    return count

def process_code_locally():
    """
    This function tests the vowel counting solution locally without any server.
    """
    test_cases = [
        {"input": "hello", "expected": 2},
        {"input": "Python Programming", "expected": 4},
        {"input": "aeiou", "expected": 5},
        {"input": "AEIOU", "expected": 5},
        {"input": "XYZ", "expected": 0},
        {"input": "Programming is fun!", "expected": 5}
    ]
    
    all_passed = True
    
    print("Testing vowel counting function locally:")
    print("-" * 40)
    
    for i, test in enumerate(test_cases, 1):
        input_data = test["input"]
        expected = test["expected"]
        result = main(input_data)
        
        if result == expected:
            print(f"✅ Test case {i} PASSED: '{input_data}' → {result}")
        else:
            print(f"❌ Test case {i} FAILED: '{input_data}' → got {result}, expected {expected}")
            all_passed = False
    
    print("-" * 40)
    if all_passed:
        print("✅ All tests passed! Your solution is correct.")
    else:
        print("❌ Some tests failed. Please check your solution.")
    
    return all_passed

if __name__ == "__main__":
    process_code_locally() 