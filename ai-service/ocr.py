from fastapi import APIRouter, UploadFile, File, HTTPException
import pytesseract
from PIL import Image
import io

router = APIRouter()

@router.post("/extract")
async def extract_text_from_image(file: UploadFile = File(...)):
    # Support both images and PDFs
    is_pdf = file.content_type == "application/pdf"
    if not (file.content_type.startswith("image/") or is_pdf):
        raise HTTPException(status_code=400, detail="File must be an image or PDF.")
    
    try:
        contents = await file.read()
        
        if is_pdf:
            # Note: local PDF OCR requires 'pdf2image' and 'poppler-utils'
            # For now, we return a message or you can install the dependencies
            return {"success": False, "message": "Local PDF OCR requires poppler-utils. Use the Cloud OCR option in the dashboard for PDFs."}

        image = Image.open(io.BytesIO(contents))
        # Perform OCR
        extracted_text = pytesseract.image_to_string(image)
        return {"success": True, "text": extracted_text.strip(), "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
