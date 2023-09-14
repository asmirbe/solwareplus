// constants.js
export const PI = 3.14159265359;

// utils.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// MyClass.js
import { PI } from "./constants";
import { add, subtract } from "./utils";

export default class MyClass {
  constructor(radius) {
    this.radius = radius;
  }

  // Class Method
  circleArea() {
    return PI * Math.pow(this.radius, 2);
  }

  // Static Method
  static staticMethod() {
    console.log("This is a static method.");
  }

  // Using Array methods
  getUniqueNumbers(arr) {
    return [...new Set(arr)];
  }

  // Using String methods
  reverseString(str) {
    return str.split("").reverse().join("");
  }

  // Using utility functions
  sum(a, b) {
    return add(a, b);
  }

  difference(a, b) {
    return subtract(a, b);
  }
}

// index.js
import MyClass from "./MyClass";

// Using constants
console.log(`Value of PI: ${PI}`);

// Using utility functions
console.log(`Sum: ${add(5, 3)}`);
console.log(`Difference: ${subtract(5, 3)}`);

// Instantiate class
const myClassInstance = new MyClass(5);

// Using class methods
console.log(`Circle Area: ${myClassInstance.circleArea()}`);

// Using static methods
MyClass.staticMethod();

// Using array methods via class
console.log(
  `Unique Numbers: ${myClassInstance.getUniqueNumbers([1, 2, 2, 3, 4, 3])}`,
);

// Using string methods via class
console.log(`Reversed String: ${myClassInstance.reverseString("hello")}`);

// Using utility methods via class
console.log(`Sum via class: ${myClassInstance.sum(5, 3)}`);
console.log(`Difference via class: ${myClassInstance.difference(5, 3)}`);
