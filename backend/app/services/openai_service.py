"""
AI service — all inference runs via Groq (free tier, llama3-70b-8192).
OpenAI client kept as fallback but Groq is the primary engine.
"""
from typing import Optional, List, Dict, Any
import json
from groq import AsyncGroq

from app.core.config import settings


class OpenAIService:
    """Service for AI-powered features using Groq as the primary LLM."""

    def __init__(self):
        # Primary: Groq (free, fast)
        self.groq_client = AsyncGroq(api_key=settings.groq_api_key)
        self.groq_model = settings.groq_model  # llama3-70b-8192

    async def generate_summary(self, text: str, max_tokens: int = 1000) -> str:
        """Generate a summary of the paper text."""
        prompt = f"""You are a research assistant. Summarize the following academic paper in a clear, structured format.
        Include:
        1. Main contribution
        2. Key findings
        3. Methodology
        4. Limitations

        Paper text:
        {text[:8000]}

        Summary:"""

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
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
        prompt = f"""Extract 5-8 key topics from this academic paper. Return ONLY a JSON array of strings, no markdown.

        Paper text:
        {text[:4000]}

        Topics:"""

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=[
                {"role": "system", "content": "You are an expert at identifying research topics. Return only valid JSON arrays."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.3,
        )

        content = response.choices[0].message.content or "[]"
        content = content.strip().strip("```json").strip("```").strip()
        try:
            topics = json.loads(content)
            return topics if isinstance(topics, list) else []
        except:
            return []

    async def extract_key_findings(self, text: str) -> List[str]:
        """Extract key findings from paper text."""
        prompt = f"""Extract 3-5 key findings from this academic paper. Return ONLY a JSON array of strings, no markdown.

        Paper text:
        {text[:4000]}

        Key Findings:"""

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=[
                {"role": "system", "content": "You are an expert at analyzing research findings. Return only valid JSON arrays."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.3,
        )

        content = response.choices[0].message.content or "[]"
        content = content.strip().strip("```json").strip("```").strip()
        try:
            findings = json.loads(content)
            return findings if isinstance(findings, list) else []
        except:
            return []

    async def generate_methodology(self, text: str) -> str:
        """Extract methodology description from paper."""
        prompt = f"""Explain the methodology used in this academic paper in 2-3 paragraphs.

        Paper text:
        {text[:6000]}

        Methodology:"""

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
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

        if chat_history:
            for msg in chat_history[-10:]:
                messages.append(msg)

        messages.append({"role": "user", "content": message})

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
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
        elif style == "beginner":
            system_prompt = """Generate a beginner-friendly podcast script about a research paper.
            Two speakers explain the paper using simple analogies and everyday language. Avoid jargon.
            Include: high-level introduction, real-world analogies for key concepts, simplified findings, and a relatable conclusion."""
        elif style == "exam":
            system_prompt = """Generate an exam-prep podcast script about a research paper.
            Two speakers review the paper with a focus on memorization and testing.
            Include: quick introduction, core definitions, critical methodologies, major testable findings, and a rapid recap/quiz at the end."""
        elif style == "research":
            system_prompt = """Generate a researcher-focused podcast script about a research paper.
            Two experts critically analyze the paper's methodology, data, and broader implications.
            Include: formal introduction, deep-dive into the methodology, statistical significance of findings, and future research directions."""
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

        Return ONLY a JSON array with this structure, no markdown:
        [
          {{"speaker": "A", "name": "Dr. Alex", "text": "Dialogue text", "timestamp": "0:00"}},
          {{"speaker": "B", "name": "Prof. Jamie", "text": "Dialogue text", "timestamp": "0:30"}}
        ]

        Make it engaging, educational, and at least 15-20 dialogue exchanges long. 
        Each turn should be 3-5 sentences to ensure depth.
        Total duration should be around 5-8 minutes when spoken.
        """

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=[
                {"role": "system", "content": "You are a professional podcast script writer. Output only valid JSON arrays."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.7,
        )

        content = response.choices[0].message.content or "[]"
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        try:
            script = json.loads(content.strip())
            return script if isinstance(script, list) else []
        except:
            return []

    async def simplify_equation(self, equation: str, context: str) -> str:
        """Simplify a complex equation."""
        prompt = f"""Explain this equation in simple terms:

        Equation: {equation}

        Context: {context}

        Provide a clear explanation that a non-expert can understand."""

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
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

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=[
                {"role": "system", "content": "You are an expert at creating study materials."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.3,
        )

        return response.choices[0].message.content

    async def generate_flowchart(self, text: str) -> List[Dict[str, str]]:
        """Generate flowchart nodes directly from paper context."""
        prompt = f"""You are a data structurer mapping a methodology/workflow for a complex research paper.
        Analyze the text and output EXACTLY a JSON Array of node objects representing the progression or core ideas.
        Return ONLY valid JSON (an array) starting with '[' and ending with ']'. No markdown, no prefixes.
        Required structure:
        [
          {{ "id": "1", "label": "Short Title", "desc": "1-2 sentence description", "color": "border-primary/40 bg-primary/5", "labelColor": "text-primary" }},
          {{ "id": "2", "label": "Another Phase", "desc": "Explanation...", "color": "border-gold/40 bg-gold/5", "labelColor": "text-gold" }}
        ]

        Text: {text[:6000]}
        """

        response = await self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=[
                {"role": "system", "content": "You output strict JSON arrays only."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.2,
        )

        content = response.choices[0].message.content or "[]"
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:-3]
        if content.startswith('```'):
            content = content[3:-3]

        try:
            nodes = json.loads(content.strip())
            return nodes if isinstance(nodes, list) else []
        except:
            return []


# Singleton instance
openai_service = OpenAIService()
