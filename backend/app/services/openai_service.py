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
        {context[:100000]}

        FORMATTING RULES:
        - Use clean Markdown with structured headers (##).
        - Use **bold** for key terms only.
        - **MATHEMATICAL FORMULAS**: Always present formulas in a clear, distinct list or table. Use **code blocks** (e.g., `E = mc²`) for single formulas and **tables** for lists of definitions.
        - **STYLING**: Make the mathematical definitions look like a professional "Formula Reference" section.
        - Suggest 2-3 deep follow-up questions at the end of every relevant answer.

        CRITICAL GUIDELINE: If the question is UNRELATED to the paper context (e.g., general knowledge, pop culture), 
        politely decline by saying: "I'm sorry, but this question is not related to the research paper you uploaded. I am designed to focus specifically on analyzing and explaining your research data."
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        if chat_history:
            # Only use last 5 rounds of history to save tokens and keep focus
            for msg in chat_history[-10:]:
                messages.append(msg)
        
        messages.append({"role": "user", "content": message})
        
        # Use a reasonable timeout to prevent hanging the whole backend
        try:
            content = await self._call_ai_service(
                messages=messages,
                max_tokens=3000,
                temperature=0.4
            )
        except Exception as e:
            return f"I'm sorry, I encountered an error while processing your request: {str(e)}", 0
        
        content = content or ""
        
        # Handle DeepSeek-R1 thinking tags if present
        if "<think>" in content and "</think>" in content:
            content = content.split("</think>")[-1].strip()
        elif "<think>" in content:
            # Fallback if AI produced unbalanced tags
            content = content.replace("<think>", "").strip()

        content = self._clean_chat_response(content)
        tokens_used = len(content.split()) + len(message.split()) + 800 

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
            system_prompt = """You are producing a high-energy, debate-style podcast script about a complex research paper.
            CONCEPT: Two brilliant speakers fiercely debate the merits, limitations, and real-world implications of the paper. They must have strong, contrasting opinions.
            TONE: Explosive, passionate, slightly confrontational but professionally respectful. Constant interruptions, gasped reactions, and intense back-and-forth.
            MODE-SPECIFIC RULES:
            - Speakers should NOT always agree. They should push back on each other's interpretations.
            - Use phrases like "I strongly disagree," "Wait, that's a huge leap," "How can you defend that methodology?", or "The data simply doesn't support your optimism!"
            - The hook should be the most controversial point of the paper.
            STRUCTURE:
            1. Explosive Introduction: Hook the listener immediately with a shocking claim.
            2. The Core Debate: One speaker aggressively defends the paper, while the other hyper-critically attacks the methodology or data.
            3. Resolution: A conclusion where they agree on the paper's importance, despite their disagreements."""
            
        elif style == "beginner":
            system_prompt = """You are producing an incredibly engaging, wildly entertaining, beginner-friendly podcast script about a complex research paper.
            CONCEPT: Two extremely energetic hosts are explaining a cutting-edge research paper to someone who has zero scientific background.
            TONE: Hype, enthusiastic, fun, and profoundly accessible.
            RULES:
            - Absolutely NO dense jargon without immediately breaking it down into a hilarious or universally relatable analogy. 
            - Use mind-blowing comparisons (e.g., comparing neural networks to a chaotic kitchen).
            STRUCTURE:
            1. High-Energy Hook: Start with a mind-bending question or relatable daily problem.
            2. Concept Breakdown: Simplify the core findings using wildly imaginative metaphors.
            3. "Wow" Conclusion: Explain how this research changes the listener's everyday life right now."""
            
        elif style == "exam":
            system_prompt = """You are producing a fast-paced, high-stakes exam-prep podcast script.
            CONCEPT: Two desperate, highly caffeinated students (or professors) are frantically reviewing the absolute most critical, testable parts of this paper the night before a huge final exam.
            TONE: Urgent, intense, rapid-fire, and extremely focused on what "will be on the test".
            MODE-SPECIFIC RULES:
            - Use language like "Remember this for the MCQ," "This definition is a 5-marker for sure," or "The examiner loves to ask about this specific result."
            - Zero fluff. Every sentence must contribute to passing the exam.
            STRUCTURE:
            1. Punchy Hook: "Wake up! We have minutes to memorize this before the exam starts!"
            2. Core Definitions: Rapidly define only the most important buzzwords.
            3. Testable Findings: Highlight specific statistical results and why they are 'exam-material'.
            4. Pop Quiz Recap: A chaotic 30-second rapid-fire quiz to cement the knowledge."""
            
        elif style == "research":
            system_prompt = """You are producing a brilliant, deep-dive researcher-focused podcast script about a research paper.
            CONCEPT: Two passionate, highly qualified domain experts are excitedly geeking out and critically analyzing the paper at a post-doc level.
            TONE: Academic but intensely enthusiastic, highly analytical, deeply curious. They love data.
            STRUCTURE:
            1. Academic Hook: Introduce the paper's placement in the current state-of-the-art literature.
            2. Methodological Breakdown: A rigorous but passionate critique of the experimental design, sample size, or algorithms used.
            3. Statistical Significance: Deeply analyze the P-values, confidence intervals, or performance metrics.
            4. Future Horizons: Massive, groundbreaking future research directions this paper unlocks."""
            
        elif style == "storytelling":
            system_prompt = """You are producing a cinematic, gripping, true-crime-style storytelling podcast script about a research paper.
            CONCEPT: Two speakers narrate the thrilling story of the researchers' epic journey to discover these findings.
            TONE: Suspenseful, dramatic, vivid, awe-inspiring, and emotionally resonant.
            STRUCTURE:
            1. The Problem: Establish incredibly high stakes. What was the massive mystery or crisis before this paper existed?
            2. The Challenge: Describe the researchers hitting a wall, struggling with methodology, or facing immense academic pressure.
            3. The Breakthrough: The explosive "Aha!" moment where the solution or finding finally crystallized.
            4. Epic Impact: Conclude with the unforgettable, paradigm-shifting impact of this discovery on humanity."""
            
        elif style in ("real-life", "real_life"):
            system_prompt = """You are producing an extremely relatable, real-life examples podcast script about a research paper.
            CONCEPT: Two speakers are laser-focused on connecting incredibly dense scientific concepts to hilarious, messy, relatable everyday situations.
            TONE: Casual, comedic, practical, conversational, and highly visual.
            STRUCTURE:
            1. Relatable Hook: Open with a frustrating, common daily annoyance and promise that this paper solves it or explains it.
            2. The Analogy Machine: For EVERY single piece of data or jargon, immediately map it to brilliant real-world comparisons (cooking disasters, terrible traffic, messy social media feeds, terrible first dates).
            3. Practical Takeaways: How does knowing this finding actually change what the listener does tomorrow morning?"""
            
        else:
            system_prompt = """You are producing a highly energetic, educational masterpiece of a podcast script about a research paper.
            CONCEPT: Two charismatic speakers excitedly break down the paper in a wildly engaging, easy-to-understand way that keeps listeners glued to their seats.
            TONE: Fascinating, inspiring, highly interactive, and immensely educational.
            STRUCTURE:
            1. Explosive Hook: Grasp the listener's attention immediately with a fascinating premise.
            2. Background: Briefly explain the context with high energy.
            3. Jaw-Dropping Concepts: Explain the methodology and key findings with relentless enthusiasm.
            4. Inspiring Conclusion: Leave the listener feeling smarter and deeply inspired by the progress of science."""

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

        # ── Dynamic length scaling based on content volume ──────────────────
        n_findings = len(key_findings)
        summary_words = len(summary.split()) if summary else 0

        if n_findings <= 3 and summary_words < 200:
            # Short paper / single section
            min_segs, max_segs = 8, 12
            duration_min, duration_max = 3, 5
        elif n_findings <= 6 and summary_words < 500:
            # Medium paper
            min_segs, max_segs = 12, 18
            duration_min, duration_max = 5, 8
        elif n_findings <= 12 and summary_words < 1200:
            # Long paper
            min_segs, max_segs = 20, 30
            duration_min, duration_max = 8, 12
        else:
            # Very comprehensive / Academic Unit / Multi-chapter
            min_segs, max_segs = 30, 45
            duration_min, duration_max = 12, 18
        # ────────────────────────────────────────────────────────────────────

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

        CRITICAL INSTRUCTIONS FOR INTERACTIVITY AND TONE:
        1. FOLLOW THE MODE-SPECIFIC TONE ABOVE (e.g. if it's a debate, DISAGREE; if it's exam-prep, BE URGENT).
        2. Make the conversation highly interactive. Speakers MUST interrupt each other and build on ideas naturally.
        3. Zero boring monologues. Keep the back-and-forth dynamic and fast-paced.
        4. Break down complex jargon into analogies that FIT THE MODE (e.g. use student analogies for 'exam-prep').
        5. AUDIO EMPHASIS: Wrap KEY TERMS, crucial findings, and pivotal concepts in **double asterisks** (e.g. "The model achieved **94% accuracy**"). These will be highlighted in the transcript.

        HARD CONTENT RULES — you MUST follow these:
        - MANDATORY: Cover EVERY single key finding listed below. Do NOT skip any finding, even if it seems minor.
        - MANDATORY: Cover the entire scope of the provided summary.
        - Each segment must be SHORT: 2-3 sentences max (15-30 seconds when spoken aloud).
        - CRITICAL: Do NOT read the summary or findings word-for-word. Transform them into natural, punchy conversation.
        - Do NOT pad or repeat points. Stay punchy and information-dense.
        - Target {min_segs} to {max_segs} dialogue segments total to ensure all points are covered thoroughly.
        - Target around {duration_min} to {duration_max} minutes total podcast duration.
        """
        
        response_content = await self._call_ai_service(
            messages=[
                {"role": "system", "content": "You are a world-class, multi-award-winning podcast producer and scriptwriter known for creating viral, highly engaging, and intensely interactive educational content."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000,
            temperature=0.8
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
