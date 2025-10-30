import google.generativeai as genai
import os

# --- Configure your API key ---
# Make sure to replace "YOUR_API_KEY" with your actual key
# (Or load it from your .env file)
genai.configure(api_key="AIzaSyCg6K6PDuxatA_RwvH508TBMIwCywdexgk") 

# --- List all available models ---
print("Available models:")
for model in genai.list_models():
    print(f"- {model.name}")

# --- Filter for models that support 'generateContent' ---
print("\nModels supporting 'generateContent':")
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"- {model.name}")