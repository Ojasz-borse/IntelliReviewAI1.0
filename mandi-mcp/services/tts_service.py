from gtts import gTTS
import base64
import os
import io

async def generate_marathi_speech(text: str, api_key: str) -> str:
    """
    Generates audio from text using gTTS (Google Text-to-Speech).
    Returns base64 encoded audio string.
    Note: api_key is unused for gTTS but kept for interface consistency.
    """
    if not text:
        return ""

    try:
        # Create a BytesIO buffer
        mp3_fp = io.BytesIO()
        
        # Generate speech (lang='mr' for Marathi)
        tts = gTTS(text=text, lang='mr')
        
        # Write to buffer
        tts.write_to_fp(mp3_fp)
        
        # Get bytes and encode to base64
        mp3_fp.seek(0)
        audio_bytes = mp3_fp.read()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return audio_base64

    except Exception as e:
        print(f"TTS Error: {e}")
        return ""
