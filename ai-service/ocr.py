from fastapi import APIRouter, UploadFile, File, HTTPException
import pytesseract
from PIL import Image
import io

router = APIRouter()

@router.post("/extract")
async def extract_text_from_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        # Perform OCR
        extracted_text = pytesseract.image_to_string(image)
        return {"success": True, "text": extracted_text.strip(), "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
