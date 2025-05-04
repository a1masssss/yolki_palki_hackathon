def main(input):
    print(f"Input received: {repr(input)}")
    return len([c for c in input.lower() if c in "aeiou"])

# Testing input processing
if __name__ == "__main__":
    test_input = input()
    print(f"Got input: {repr(test_input)}")
    result = main(test_input)
    print(f"Result: {result}") 