import google.generativeai as genai
import os
import json

# --- CẤU HÌNH API ---
def _configure_gemini():
    try:
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        return True
    except KeyError:
        print("Error: GEMINI_API_KEY not found.")
        return False

# --- HÀM TƯ VẤN  ---
async def consult_styles_with_gemini(user_request: str) -> list:
    if not _configure_gemini(): return [_get_fallback_data()]

    model = genai.GenerativeModel('gemini-2.5-flash')

    print(f"Gemini Consulting: '{user_request}'...")

    prompt = (
        f"User context: '{user_request}'.\n"
        "As a Professional Makeup Artist, suggest 3 DISTINCT makeup looks.\n"
        "Return a raw JSON LIST (Array) of 3 objects.\n"
        "----------------\n"
        "Structure each object with 2 distinct sections: 'ui_display' (for user) and 'backend_logic' (for AI generation).\n\n"
        
        "FIELDS REQUIRED:\n"
        "1. 'id': 'style_1', etc.\n"
        
        "2. 'ui_display': {\n"
        "   - 'style_name': Creative name.\n"
        "   - 'description': Emotional vibe description.\n"
        "   - 'tags': Array of 3 short tags.\n"
        "   - 'difficulty': 'Easy' / 'Medium' / 'Hard'.\n"
        "}\n"
        
        "3. 'backend_logic': {\n"
        "   - 'generation_prompt': \n"
        "       CRITICAL: This prompt is for an AI Image Generator. \n"
        "       DO NOT use abstract words like 'beautiful', 'stunning', 'wedding style'.\n"
        "       MUST use physical visual descriptions with colors and textures.\n"
        "       EXAMPLE: 'Deep red matte lipstick, smokey charcoal eyeshadow, sharp black eyeliner, peachy blush on cheekbones'.\n"
        "   - 'technical_settings': {\n"
        "       'use_lens': boolean,\n"
        "       'contour_nose': boolean,\n"
        "       'contour_jaw': boolean,\n"
        "       'heavy_blush': boolean,\n"
        "       'skin_finish': 'matte' / 'dewy' / 'satin',\n"
        "       'makeup_intensity': 'high' (Use 'high' for bold looks, 'medium' for daily)\n"
        "   }\n"
        "   - 'tutorial_steps': Array of 3-5 clearly defined steps.\n"
        "   - 'search_keywords': Array of keywords.\n"
        "}\n"
    )

    try:
        response = await model.generate_content_async(prompt)
        result = _parse_json_response(response.text)
        
        if isinstance(result, list): return result
        if isinstance(result, dict) and "styles" in result: return result["styles"]
        return [result] if isinstance(result, dict) else [_get_fallback_data()]
            
    except Exception as e:
        print(f"Lỗi Gemini: {e}")
        return [_get_fallback_data()]

# --- HELPER ---
def _parse_json_response(text_response: str):
    try:
        clean_text = text_response.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0]
        elif "```" in clean_text:
            clean_text = clean_text.replace("```", "")
        return json.loads(clean_text)
    except Exception:
        return _get_fallback_data()

def _get_fallback_data():
    return {
        "id": "fallback_1",
        "ui_display": {
            "style_name": "Natural Glow",
            "description": "A naturally radiant and flawless base",
            "tags": ["Daily", "Korean", "Fresh"],
            "difficulty": "Easy"
        },
        "backend_logic": {
            "generation_prompt": "coral orange glossy lipstick, soft brown eyeliner, champagne shimmer eyeshadow, dewy glass skin texture",
            "technical_settings": {
                "use_lens": False, "contour_nose": False, "contour_jaw": False, 
                "heavy_blush": False, "skin_finish": "dewy", "makeup_intensity": "medium"
            },
            "tutorial_steps": ["Moisturize", "Conceal blemishes", "Lip gloss"],
            "search_keywords": ["Natural Makeup", "Skincare"]
        }
    }