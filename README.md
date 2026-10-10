# Basic Calculator in C

## 📌 Description
This is a simple basic calculator written in C.  
It takes an arithmetic operator (+, -, *, /) and two numbers as input, then prints the result.  
Great for beginners learning C programming.

🌐 **Live Interactive Web & Terminal Simulator**: [https://mrharshalbane.github.io/basic-calculator-c/](https://mrharshalbane.github.io/basic-calculator-c/)


## 🚀 Features
- Addition
- Subtraction
- Multiplication
- Division
- Invalid operator handling

## 🧾 Code

```c
#include <stdio.h>

int main() {
    char op;
    double a, b, result;

    printf("Enter operator (+ - * /): ");
    scanf("%c", &op);

    printf("Enter two numbers: ");
    scanf("%lf %lf", &a, &b);

    if (op == '+')
        result = a + b;
    else if (op == '-')
        result = a - b;
    else if (op == '*')
        result = a * b;
    else if (op == '/')
        result = a / b;
    else {
        printf("Invalid operator");
        return 0;
    }

    printf("Result: %.2lf", result);
    return 0;
}
