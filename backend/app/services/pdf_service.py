"""
PDF processing service for extracting text from research papers.
"""
import re
from typing import Dict, Any, Optional
import fitz  # PyMuPDF
from pathlib import Path


class PDFService:
    """Service for PDF text extraction and processing."""
    
    def __init__(self, upload_dir: str = "./uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    async def extract_text(self, file_path: str) -> str:
        """Extract text from a PDF file."""
        text_content = []
        
        try:
            doc = fitz.open(file_path)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                
                # Clean up the text
                text = self._clean_text(text)
                text_content.append(text)
            
            doc.close()
            
            return "\n\n".join(text_content)
        
        except Exception as e:
            raise Exception(f"Error extracting PDF text: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text."""
        # Remove excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Remove page numbers (common patterns)
        text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
        
        # Remove header/footer patterns (common in academic papers)
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Skip very short lines that are likely page numbers
            if len(line.strip()) < 3 and line.strip().isdigit():
                continue
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    async def extract_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract metadata from PDF."""
        try:
            doc = fitz.open(file_path)
            metadata = doc.metadata
            
            result = {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "page_count": len(doc),
            }
            
            # Try to extract from first page if not in metadata
            if not result["title"] or not result["author"]:
                first_page_text = doc[0].get_text()
                result.update(self._extract_from_first_page(first_page_text))
            
            doc.close()
            return result
        
        except Exception as e:
            return {"error": str(e)}
    
    def _extract_from_first_page(self, text: str) -> Dict[str, Any]:
        """Attempt to extract title/author from first page."""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        result = {"title": "", "author": ""}
        
        # Title is usually one of the first few non-empty lines
        for line in lines[:5]:
            # Skip lines that look like journal names or dates
            if any(skip in line.lower() for skip in ["abstract", "introduction", "doi", "journal", "volume"]):
                continue
            if len(line) > 10 and not line.isupper():
                result["title"] = line
                break
        
        # Author usually follows title
        if result["title"]:
            title_idx = lines.index(result["title"]) if result["title"] in lines else 0
            for line in lines[title_idx+1:title_idx+5]:
                if len(line) > 3 and len(line) < 100:
                    result["author"] = line
                    break
        
        return result
    
    def save_uploaded_file(self, file_content: bytes, filename: str, user_id: int) -> str:
        """Save an uploaded file and return the path."""
        # Create user directory
        user_dir = self.upload_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        import uuid
        safe_filename = f"{uuid.uuid4()}_{filename}"
        file_path = user_dir / safe_filename
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return str(file_path)
    
    def delete_file(self, file_path: str) -> bool:
        """Delete an uploaded file."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception:
            return False
    
    def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes."""
        try:
            return Path(file_path).stat().st_size
        except Exception:
            return 0


# Singleton instance
pdf_service = PDFService()

