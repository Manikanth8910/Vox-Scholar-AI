"""
OpenAI service for AI-powered features.
Supports fallback logic: Ollama -> OpenAI -> Groq.
"""
from typing import Optional, List, Dict, Any
import json
from openai import AsyncOpenAI
from groq import AsyncGroq

from app.core.config import settings


class OpenAIService:
    """Service for AI interactions with fallback logic."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        
        # Initialize Groq client
        self.groq_client = AsyncGroq(api_key=settings.groq_api_key)
        self.groq_model = settings.groq_model
        
        # Initialize Ollama client (using OpenAI-compatible endpoint)
        self.ollama_client = AsyncOpenAI(
            api_key="ollama",
            base_url=settings.ollama_base_url,
            timeout=180.0
        )
        self.ollama_model = settings.ollama_model
        
        # Make OpenRouter client optional if they want it
        if settings.openrouter_api_key:
            self.openrouter_client = AsyncOpenAI(
                api_key=settings.openrouter_api_key,
                base_url="https://openrouter.ai/api/v1",
            )
            self.openrouter_model = settings.openrouter_model
        else:
            self.openrouter_client = None
    
    async def _call_ai_service(self, messages: List[Dict[str, str]], max_tokens: int, temperature: float) -> str:
        """Helper to call AI service with priority: OpenRouter -> Ollama -> OpenAI -> Groq."""
        # Optional: Priority to OpenRouter if configured and we are trying to use it
        if self.openrouter_client and settings.openrouter_api_key:
            try:
                response = await self.openrouter_client.chat.completions.create(
                    model=self.openrouter_model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenRouter error: {e}, falling through...")

        # 1. Try Ollama (Local)
        try:
            response = await self.ollama_client.chat.completions.create(
                model=self.ollama_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Ollama not available or error, trying OpenAI: {e}")

        # 2. Try OpenAI
        is_openai_valid = (
            settings.openai_api_key 
            and settings.openai_api_key != "sk-your-openai-api-key"
            and not settings.openai_api_key.startswith("sk-your-")
        )

        if is_openai_valid:
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI error, falling back to Groq: {e}")
        
        # 3. Fallback to Groq
        try:
            response = await self.groq_client.chat.completions.create(
                model=self.groq_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq fallback error: {e}")
            raise e

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
        
        return await self._call_ai_service(
            messages=[
                {"role": "system", "content": "You are an expert research assistant specialized in summarizing academic papers."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.3
        )
    
    async def extract_topics(self, text: str) -> List[str]:
        """Extract key topics from paper text."""
        prompt = f"""Extract 5-8 key topics from this academic paper. Return as a JSON array of strings.
        
        Paper text:
        {text[:4000]}
        
        Topics:"""
        
        messages=[
                {"role": "system", "content": "You are an expert at identifying research topics. Return only valid JSON arrays."},
                {"role": "user", "content": prompt}
        ]
        
        response_content = await self._call_ai_service(
            messages=messages,
            max_tokens=300,
            temperature=0.3
        )
        
        try:
            content = response_content.strip()
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
            
            topics = json.loads(content)
            return topics if isinstance(topics, list) else []
        except:
            return []
    
    async def extract_key_findings(self, text: str) -> List[str]:
        """Extract key findings from paper text."""
        prompt = f"""Extract 3-5 key findings from this academic paper. Return as a JSON array of strings.
        
        Paper text:
        {text[:4000]}
        
        Key Findings:"""
        
        messages=[
                {"role": "system", "content": "You are an expert at analyzing research findings. Return only valid JSON arrays."},
                {"role": "user", "content": prompt}
        ]
        
        response_content = await self._call_ai_service(
            messages=messages,
            max_tokens=500,
            temperature=0.3
        )
        
        try:
            content = response_content.strip()
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
                
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
        
        return await self._call_ai_service(
            messages=[
                {"role": "system", "content": "You are an expert at explaining research methodologies."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.3
        )
    
    async def chat(
        self,
        message: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> tuple[str, int]:
        """Answer a question about the paper using RAG."""
        system_prompt = f"""You are VoxScholar AI, an expert and friendly research assistant.
        Answer questions about research papers based ONLY on the provided context.
        If the answer is not in the context, say so clearly.
        Be precise, helpful, and cite specific parts when possible.

        Context from paper:
        {context[:6000]}

        FORMATTING RULES — follow these strictly:
        - Use clean Markdown. Use ## for section headers, - or 1. for lists.
        - Use **bold** ONLY for genuinely important key terms, not for decoration.
        - Never use *** or excessive asterisks.
        - For comparisons or multi-part answers, use a structured layout with headers.
        - Keep paragraphs short (2-4 sentences). Use line breaks between sections.
        - Prefer bullet points over long run-on paragraphs.
        - End with a short 1-line summary or actionable takeaway if relevant.
        - Use simple language for complex concepts unless asked for technical depth.

        CRITICAL GUIDELINES:
        1. STRICT ADHERENCE: You must ONLY answer questions that are directly or indirectly related to the provided research paper context.
        2. REFUSE OUT-OF-CONTEXT QUESTIONS: If the user asks a question that is NOT related to the paper (e.g., general knowledge like "Who is Narendra Modi?", personal advice, or pop culture), you must politely but firmly decline. 
           Use this exact phrasing (or something very similar): "I'm sorry, but this question is not related to the research paper you uploaded. I am designed to focus specifically on analyzing and explaining your research data."
        3. BE DETAILED: When answering relevant research questions, provide comprehensive and structured explanations using the findings from the paper.
        4. STRUCTURE: Use markdown (bullet points, bold text, numbered lists) to make complex information digestible.
        5. ENGAGEMENT: At the end of every relevant research answer, suggest 2-3 deep follow-up questions specifically based on the paper's content.
        6. STYLE: Maintain a professional, academic, and focused tone.
        
        Context from Research Paper:
        {context[:12000]}
        
        Current User Request: {message}
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        if chat_history:
            for msg in chat_history[-10:]:
                messages.append(msg)
        
        messages.append({"role": "user", "content": message})
        
        content = await self._call_ai_service(
            messages=messages,
            max_tokens=1500,
            temperature=0.5
        )
        
        content = content or ""
        tokens_used = len(content.split()) + len(message.split()) + 500 

        content = self._clean_chat_response(content)

        return content, tokens_used

    def _clean_chat_response(self, text: str) -> str:
        """Strip stray asterisks and clean up AI chat output for consistent display."""
        import re
        text = re.sub(r'\*{3,}', '', text)
        text = re.sub(r'^\*\*(.+?)\*\*$', r'\1', text, flags=re.MULTILINE)
        text = re.sub(r'(?<![\w\*])\*(?![\w\*])', '', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    async def generate_podcast_script(
        self,
        paper_title: str,
        summary: str,
        key_findings: List[str],
        style: str = "educational",
        voice_male_name: str = "Prabhat",
        voice_female_name: str = "Neerja",
        persona_male_style: Optional[str] = None,
        persona_female_style: Optional[str] = None,
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
        elif style == "storytelling":
            system_prompt = """Generate a storytelling-style podcast script about a research paper.
            Follow the narrative arc: Problem → Challenge → Solution → Impact.
            Two speakers tell the story of the research as if it's a gripping journey.
            Use vivid language, a narrative flow, and emotional resonance.
            Make it engaging, memorable, and inspiring.
            Avoid dry recitation of facts; instead weave insights into a compelling story."""
        elif style in ("real-life", "real_life"):
            system_prompt = """Generate a real-life examples podcast script about a research paper.
            Two speakers connect every key concept and finding to everyday situations and relatable analogies.
            Use comparisons from daily life (cooking, sports, traffic, social media, etc.) to explain technical ideas.
            Keep it practical, visual, and easy to understand.
            Include: real-world applications, tangible impacts, and memorable comparisons."""
        else:
            system_prompt = """Generate an educational podcast script about a research paper.
            Two speakers discuss the paper in an engaging, easy-to-understand way.
            Include: introduction, background, key concepts, findings, and conclusion."""

        persona_instructions = ""
        if persona_male_style or persona_female_style:
            persona_instructions = f"""

        CUSTOM PERSONAS — write the script to authentically reflect these character personalities:
        - Speaker A ({voice_male_name}): {persona_male_style or 'knowledgeable and engaging'}
          Their dialogue should sound like someone who is {persona_male_style or 'curious and informative'}.
        - Speaker B ({voice_female_name}): {persona_female_style or 'enthusiastic and curious'}
          Their dialogue should sound like someone who is {persona_female_style or 'keen to learn and ask sharp questions'}.
        Let these personalities shape HOW they speak — word choice, sentence structure, tone, and level of formality.
        """

        findings_text = "\n".join([f"- {f}" for f in key_findings])

        prompt = f"""{system_prompt}{persona_instructions}

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
        
        response_content = await self._call_ai_service(
            messages=[
                {"role": "system", "content": "You are a professional podcast script writer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.7
        )
        
        try:
            content = response_content.strip()
            
            # Find the first '[' and last ']' to extract the JSON array robustly
            start_idx = content.find('[')
            end_idx = content.rfind(']')
            
            if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
                json_str = content[start_idx:end_idx+1]
                script = json.loads(json_str)
                return script if isinstance(script, list) else []
            return []
        except Exception as e:
            print("ERROR PARSING JSON:", e, flush=True)
            return []
    
    async def simplify_equation(self, equation: str, context: str) -> str:
        """Simplify a complex equation."""
        prompt = f"""Explain this equation in simple terms:

        Equation: {equation}

        Context: {context}

        Provide a clear explanation that a non-expert can understand."""
        
        return await self._call_ai_service(
            messages=[
                {"role": "system", "content": "You are an expert at explaining mathematical concepts simply."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.3
        )
    
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
        
        return await self._call_ai_service(
            messages=[
                {"role": "system", "content": "You are an expert at creating study materials."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.3
        )

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

        response_content = await self._call_ai_service(
            messages=[
                {"role": "system", "content": "You output strict JSON arrays only."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.2,
        )

        content = response_content or "[]"
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
