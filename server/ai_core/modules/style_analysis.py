import google.generativeai as genai
import os
import json

async def analyze_style_with_gemini(image_path: str) -> dict:
    """
    Analyze image and return JSON: Prompt, Tutorial (3 steps), Keywords.
    (English Version)
    """
    
    # 1. API Configuration
    try:
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    except KeyError:
        print("Error: GEMINI_API_KEY not found.")
        return _get_fallback_data()

    # 2. Select Model
    model_name = 'gemini-2.5-flash' 
    try:
        model = genai.GenerativeModel(model_name)
    except Exception:
        model = genai.GenerativeModel('gemini-pro')

    # 3. Upload Image
    try:
        style_file = genai.upload_file(image_path)
    except Exception as e:
        print(f"Error uploading image: {e}")
        return _get_fallback_data()
    
    # 4. NEW ENGLISH PROMPT
    # prompt_cho_gemini = (
    #     "You are a professional makeup artist. Analyze this image and return the result as raw JSON (no markdown formatting). "
    #     "The JSON structure must contain exactly these 3 fields:\n"
    #     "1. 'generation_prompt': A detailed English prompt describing the makeup style (eyeshadow, lipstick, blush, etc.) suitable for AI image generation.\n"
    #     "2. 'tutorial_steps': A list (array) in ENGLISH containing EXACTLY 3 short sentences (under 15 words/sentence), focusing on 3 key areas in this order: \n"
    #     "   - Step 1: Instructions for Skin/Base (e.g., 'Matte foundation, soft peach blush').\n"
    #     "   - Step 2: Instructions for Eyes (e.g., 'Brown smokey eyes, sharp winged eyeliner').\n"
    #     "   - Step 3: Instructions for Lips (e.g., 'Deep red matte lipstick, defined lip line').\n"
    #     "3. 'keywords': A list (array) of English keywords related to this style.\n"
    # )

    prompt_cho_gemini = (
        "You are a professional makeup artist. Analyze this image and return raw JSON.\n"
        "JSON structure:\n"
        "1. 'generation_prompt': Detailed English prompt for AI image generation.\n"
        "2. 'tutorial_steps': Array of 3 English sentences (Skin, Eyes, Lips).\n"
        "3. 'keywords': An array of tags based on the makeup style. "
        "IMPORTANT: You MUST prioritize categorizing the style into one or more of these 3 groups if applicable:\n"
        "   - Group A (Latte): 'Latte Makeup', 'Monochromatic', 'Bronze', 'Brown Tones', 'Sun-Kissed'\n"
        "   - Group B (Clean Girl): 'Clean Girl', 'Dewy Skin', 'Fluffy Brows', 'Minimalism', 'Skincare Prep'\n"
        "   - Group C (Douyin): 'Douyin Makeup', 'Viral Trends', 'Eyeliner', 'Gradient Lips', 'Glass Skin'\n"
        "If the image matches any of these vibes, include those EXACT tags in the keywords array.\n"
    )
    
    try:
        # 5. Call API
        response = await model.generate_content_async([prompt_cho_gemini, style_file])
        
        # 6. Process Result
        text_response = response.text
        # Clean up markdown if present
        if "```json" in text_response:
            text_response = text_response.split("```json")[1].split("```")[0]
        elif "```" in text_response:
            text_response = text_response.replace("```", "")
            
        text_response = text_response.strip()
        data = json.loads(text_response)
        return data

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return _get_fallback_data()

def _get_fallback_data():
    """Fallback data in English"""
    return {
        "generation_prompt": "photorealistic makeup, high quality",
        "tutorial_steps": [
            "Skin: Apply a natural, lightweight foundation.",
            "Eyes: Apply mascara and thin eyeliner.",
            "Lips: Apply lipstick matching your skin tone."
        ],
        "keywords": ["makeup", "beauty", "natural"]
    }