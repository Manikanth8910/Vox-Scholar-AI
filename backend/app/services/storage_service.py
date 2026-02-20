"""
Storage service for uploading audio files to cloud storage.
"""
import os
from pathlib import Path
from typing import Optional

from app.core.config import settings


class StorageService:
    """Service for storing audio files locally or in cloud."""
    
    def __init__(self):
        self.use_cloudinary = bool(
            settings.cloudinary_cloud_name and 
            settings.cloudinary_api_key and 
            settings.cloudinary_api_secret
        )
        
        if self.use_cloudinary:
            try:
                import cloudinary
                import cloudinary.uploader
                cloudinary.config(
                    cloud_name=settings.cloudinary_cloud_name,
                    api_key=settings.cloudinary_api_key,
                    api_secret=settings.cloudinary_api_secret
                )
                self.cloudinary = cloudinary
            except ImportError:
                print("Cloudinary not installed. Using local storage.")
                self.use_cloudinary = False
    
    async def upload_audio(
        self,
        audio_bytes: bytes,
        filename: str,
        folder: str = "podcasts"
    ) -> tuple[str, str]:
        """
        Upload audio file to storage.
        Returns (url, local_path) tuple.
        """
        if self.use_cloudinary:
            return await self._upload_to_cloudinary(audio_bytes, filename, folder)
        else:
            return await self._upload_to_local(audio_bytes, filename, folder)
    
    async def _upload_to_cloudinary(
        self,
        audio_bytes: bytes,
        filename: str,
        folder: str
    ) -> tuple[str, str]:
        """Upload to Cloudinary."""
        try:
            # Save temporarily
            temp_path = Path(settings.upload_dir) / "temp" / filename
            temp_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(temp_path, "wb") as f:
                f.write(audio_bytes)
            
            # Upload to Cloudinary
            result = self.cloudinary.uploader.upload(
                str(temp_path),
                resource_type="video",  # audio files use video resource type
                folder=folder,
                public_id=Path(filename).stem
            )
            
            # Clean up temp file
            temp_path.unlink()
            
            # Also save locally as backup
            local_path = Path(settings.upload_dir) / folder / filename
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(audio_bytes)
            
            return result["secure_url"], str(local_path)
        
        except Exception as e:
            print(f"Cloudinary upload failed: {e}. Falling back to local storage.")
            return await self._upload_to_local(audio_bytes, filename, folder)
    
    async def _upload_to_local(
        self,
        audio_bytes: bytes,
        filename: str,
        folder: str
    ) -> tuple[str, str]:
        """Upload to local storage."""
        local_path = Path(settings.upload_dir) / folder / filename
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(local_path, "wb") as f:
            f.write(audio_bytes)
        
        # Return relative URL for API
        url = f"/api/podcasts/audio/{filename}"
        return url, str(local_path)
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file from local storage."""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception:
            return False


# Singleton instance
storage_service = StorageService()
