"""
OpenAI service for AI-powered features.
"""
from typing import Optional, List, Dict, Any
import json
from openai import AsyncOpenAI

from app.core.config import settings


class OpenAIService:
    """Service for OpenAI API interactions."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
    
    async def generate_summary(self, text: str, max_tokens: int = 1000) -> str:
        """Generate a summary of the paper text."""
        prompt = f"""You are a research assistant. Summarize the following academic paper in a clear, structured format.
        Include:
        1. Main contribution
        2. Key findings
        3. Methodology
        4. Limitations
        
        Paper text:
        {text[:8000]}  # Limit text length
        
        Summary:"""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert research assistant specialized in summarizing academic papers."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        
        return response.choices[0].message.content
    
    async def extract_topics(self, text: str) -> List[str]:
        """Extract key topics from paper text."""
        prompt = f"""Extract 5-8 key topics from this academic paper. Return as a JSON array of strings.
        
        Paper text:
        {text[:4000]}
        
        Topics:"""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert at identifying research topics."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.3,
        )
        
        try:
            topics = json.loads(response.choices[0].message.content)
            return topics if isinstance(topics, list) else []
        except:
            return []
    
    async def extract_key_findings(self, text: str) -> List[str]:
        """Extract key findings from paper text."""
        prompt = f"""Extract 3-5 key findings from this academic paper. Return as a JSON array of strings.
        
        Paper text:
        {text[:4000]}
        
        Key Findings:"""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert at analyzing research findings."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.3,
        )
        
        try:
            findings = json.loads(response.choices[0].message.content)
            return findings if isinstance(findings, list) else []
        except:
            return []
    
    async def generate_methodology(self, text: str) -> str:
        """Extract methodology description from paper."""
        prompt = f"""Explain the methodology used in this academic paper in 2-3 paragraphs.
        
        Paper text:
        {text[:6000]}
        
        Methodology:"""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert at explaining research methodologies."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.3,
        )
        
        return response.choices[0].message.content
    
    async def chat(
        self,
        message: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> tuple[str, int]:
        """Answer a question about the paper using RAG."""
        system_prompt = f"""You are VoxScholar AI, an expert research assistant. 
        Answer questions about research papers based ONLY on the provided context.
        If the answer is not in the context, say so clearly.
        Be precise, helpful, and cite specific parts when possible.
        
        Context from paper:
        {context[:6000]}
        
        Guidelines:
        - Use simple language for complex concepts
        - Provide examples when helpful
        - If the question is outside the paper's scope, acknowledge it
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add chat history
        if chat_history:
            for msg in chat_history[-10:]:  # Last 10 messages
                messages.append(msg)
        
        messages.append({"role": "user", "content": message})
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=1500,
            temperature=0.5,
        )
        
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else 0
        
        return content, tokens_used
    
    async def generate_podcast_script(
        self,
        paper_title: str,
        summary: str,
        key_findings: List[str],
        style: str = "educational"
    ) -> List[Dict[str, Any]]:
        """Generate a podcast script with two speakers."""
        
        if style == "debate":
            system_prompt = """Generate a debate-style podcast script about a research paper.
            Two speakers debate the merits and limitations of the paper.
            Include: introduction, key points debate, and conclusion."""
        else:
            system_prompt = """Generate an educational podcast script about a research paper.
            Two speakers discuss the paper in an engaging, easy-to-understand way.
            Include: introduction, background, key concepts, findings, and conclusion."""
        
        findings_text = "\n".join([f"- {f}" for f in key_findings])
        
        prompt = f"""{system_prompt}

        Paper: {paper_title}
        Summary: {summary}
        Key Findings:
        {findings_text}

        Return a JSON array with this structure:
        [
          {{"speaker": "A", "name": "Speaker Name", "text": "Dialogue text", "timestamp": "0:00"}},
          {{"speaker": "B", "name": "Speaker Name", "text": "Dialogue text", "timestamp": "0:30"}}
        ]

        Make it engaging and educational. Each segment should be 30-60 seconds when spoken.
        Total duration should be around 4-5 minutes.
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a professional podcast script writer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.7,
        )
        
        try:
            script = json.loads(response.choices[0].message.content)
            return script if isinstance(script, list) else []
        except:
            return []
    
    async def simplify_equation(self, equation: str, context: str) -> str:
        """Simplify a complex equation."""
        prompt = f"""Explain this equation in simple terms:

        Equation: {equation}

        Context: {context}

        Provide a clear explanation that a non-expert can understand."""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert at explaining mathematical concepts simply."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.3,
        )
        
        return response.choices[0].message.content
    
    async def generate_study_notes(self, text: str, title: str) -> str:
        """Generate study notes from paper text."""
        prompt = f"""Generate comprehensive study notes from this research paper.

        Title: {title}

        Paper text:
        {text[:6000]}

        Create well-structured study notes with:
        - Key concepts and definitions
        - Main arguments
        - Important findings
        - Questions for review
        Use markdown format.
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert at creating study materials."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.3,
        )
        
        return response.choices[0].message.content


# Singleton instance
openai_service = OpenAIService()

