// 1. First, evaluate the polyfill to secure the global environment
import "./polyfill";

// 2. Then, evaluate the worker which imports transformers.js
import "./rmbg.worker";
