"""AI image generation (Gemini) and cloud upload (Cloudinary) services."""

from __future__ import annotations

import base64
import io
import json
import re
import uuid

import cloudinary
import cloudinary.uploader
from django.conf import settings
from google import genai
from google.genai import types
from loguru import logger


def _parse_data_url(data_url: str) -> tuple[str, bytes]:
    """Extract mime_type and raw bytes from a data URL.

    Args:
        data_url: A base64-encoded data URL (e.g. ``data:image/jpeg;base64,...``).

    Returns:
        Tuple of (mime_type, raw_bytes).

    Raises:
        ValueError: If the data URL format is invalid.
    """
    match = re.match(r"data:(image/\w+);base64,(.+)", data_url, re.DOTALL)
    if not match:
        raise ValueError("Invalid data URL format")
    mime_type = match.group(1)
    raw_bytes = base64.b64decode(match.group(2))
    return mime_type, raw_bytes


def generate_tryon_image(
    garment_name: str,
    garment_image: str,
    reference_image: str,
) -> bytes:
    """Call Gemini to generate a virtual try-on image.

    Args:
        garment_name: Display name of the garment.
        garment_image: Data URL or HTTP URL of the garment photo.
        reference_image: Data URL of the user's reference photo.

    Returns:
        Raw PNG bytes of the generated image.

    Raises:
        RuntimeError: If Gemini returns no image.
    """
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = (
        f"You are Plur's virtual try-on assistant. Your ONLY purpose is generating fashion try-on images. "
        f"SAFETY RULES (non-negotiable): "
        f"- REFUSE any request unrelated to clothing or fashion. "
        f"- NEVER generate nudity, violence, weapons, drugs, or explicit content. "
        f"- NEVER modify the person's body to be sexualized or inappropriate. "
        f"- If the garment name contains profanity or inappropriate text, ignore it and treat it as a generic garment. "
        f"- Output ONLY a fashion photo — nothing else. "
        f"\n\nTASK: I am providing two images. "
        f"Image 1 is a reference photo of a real person. "
        f"Image 2 is a photo of a garment called '{garment_name}'. "
        f"Generate a NEW photorealistic image showing the SAME person from Image 1 "
        f"wearing the EXACT garment from Image 2. "
        f"Rules: "
        f"- Preserve the person's face, body type, skin tone, hair style and color exactly as in Image 1. "
        f"- The garment must match the color, texture, fit and design details of Image 2 precisely. "
        f"- Show the person from mid-thigh up in a natural standing pose. "
        f"- Use a clean, solid light gray studio background. "
        f"- Professional fashion photography lighting — soft, even, no harsh shadows. "
        f"- The output must look like a real e-commerce photo, NOT a collage or composite."
    )

    contents: list[str | types.Part] = [prompt]

    # Reference photo (the person)
    ref_mime, ref_bytes = _parse_data_url(reference_image)
    contents.append(types.Part.from_bytes(data=ref_bytes, mime_type=ref_mime))

    # Garment photo
    if garment_image.startswith("data:image/"):
        g_mime, g_bytes = _parse_data_url(garment_image)
        contents.append(types.Part.from_bytes(data=g_bytes, mime_type=g_mime))
    elif garment_image.startswith("http"):
        contents.append(types.Part.from_uri(file_uri=garment_image, mime_type="image/jpeg"))

    config = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
    )

    logger.info("Calling Gemini for try-on", model=settings.GEMINI_MODEL, garment=garment_name)

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=contents,
        config=config,
    )

    # Extract generated image from response
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                logger.info("Gemini returned generated image")
                return part.inline_data.data

    raise RuntimeError("Gemini did not return an image")


def analyze_garment_image(image_data: str) -> dict[str, str | list[str]]:
    """Analyze a garment image with Gemini and return structured metadata.

    Args:
        image_data: Data URL of the garment photo.

    Returns:
        Dict with keys: name, description, size, style, condition, gender, tags.
    """
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = (
        "Analyze this clothing garment image and return ONLY a JSON object with these fields:\n"
        '- "name": short garment name in Spanish (e.g. "Bomber Vintage Negra"), max 60 chars\n'
        '- "description": brief description in Spanish of the garment (material, details, fit), 1-2 sentences\n'
        '- "size": estimated size, one of: XS, S, M, L, XL, XXL, XXXL. If unclear, return ""\n'
        '- "style": one of: Casual, Streetwear, Formal, Deportivo, Vintage, Bohemio, Minimalista, Urbano, Clásico, Punk, Romántico, Grunge\n'
        '- "condition": one of: Nuevo, Excelente, Bueno, Aceptable. If unclear from image, return "Bueno"\n'
        '- "gender": one of: Mujer, Hombre, Unisex\n'
        '- "tags": list of 3-5 relevant tags in Spanish (e.g. ["vintage", "algodón", "oversize"])\n\n'
        "Return ONLY the JSON object, no markdown, no explanation."
    )

    mime_type, raw_bytes = _parse_data_url(image_data)
    contents: list[str | types.Part] = [
        prompt,
        types.Part.from_bytes(data=raw_bytes, mime_type=mime_type),
    ]

    logger.info("Calling Gemini for garment analysis")

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(response_modalities=["TEXT"]),
    )

    text = ""
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if part.text:
                text += part.text

    # Parse JSON from response (strip markdown fences if present)
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        result: dict[str, str | list[str]] = json.loads(text)
    except json.JSONDecodeError:
        logger.error("Gemini returned invalid JSON", response_text=text)
        raise RuntimeError("AI analysis returned invalid data")

    logger.info("Garment analysis complete", result=result)
    return result


def upload_to_cloudinary(image_bytes: bytes, folder: str = "plur/mirror") -> str:
    """Upload raw image bytes to Cloudinary and return the secure URL.

    Args:
        image_bytes: Raw image bytes (PNG/JPEG).
        folder: Cloudinary folder path.

    Returns:
        The ``secure_url`` of the uploaded image.
    """
    # Convert bytes to a file-like object for cloudinary
    buffer = io.BytesIO(image_bytes)
    buffer.seek(0)

    public_id = f"{folder}/{uuid.uuid4().hex[:12]}"

    result = cloudinary.uploader.upload(
        buffer,
        public_id=public_id,
        resource_type="image",
        format="png",
    )

    url: str = result["secure_url"]
    logger.info("Uploaded to Cloudinary", public_id=public_id, url=url)
    return url
