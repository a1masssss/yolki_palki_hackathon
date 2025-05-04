def main(input):
    """
    Counts the number of vowels (a, e, i, o, u) in the input string.
    
    Args:
        input: A string to count vowels in
        
    Returns:
        An integer representing the total count of vowels in the string
    """
    # Ensure input is treated as a string (in case it's a different type)
    input_str = str(input)
    
    # Convert to lowercase to handle both uppercase and lowercase vowels
    input_str = input_str.lower()
    
    # Define vowels
    vowels = "aeiou"
    
    # Count vowels using list comprehension for efficiency
    count = sum(1 for char in input_str if char in vowels)
    
    return count 

if __name__ == "__main__":
    test_input = input()
    print(f"Got input: {repr(test_input)}")
    result = main(test_input)
    print(f"Result: {result}") 