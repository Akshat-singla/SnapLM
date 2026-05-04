import ollama
from config import settings, DEVICE_URLS
import asyncio
import logging
import requests
import aiohttp
import json
import re

def is_ollama_available(url: str) -> bool:
    try:
        r = requests.get(f"{url}/api/tags", timeout=2)
        return r.status_code == 200
    except:
        return False

class CloudflareClient:
    def __init__(self, account_id: str, api_token: str, model: str):
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        self.model = model

    async def chat(self, messages):
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.base_url,
                headers=self.headers,
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": 2048
                }
            ) as resp:
                data = await resp.json()

                # /ai/v1/chat/completions returns OpenAI-compatible format:
                # { "id": "...", "object": "chat.completion", "choices": [...] }
                if "choices" in data and data["choices"]:
                    return data["choices"][0]["message"]["content"]

                # Legacy Workers AI format: { "success": true, "result": { ... } }
                if data.get("success") and data.get("result"):
                    result = data["result"]
                    if "choices" in result:
                        return result["choices"][0]["message"]["content"]
                    return result.get("response") or result.get("text")

                # Neither format matched — raise with details
                error_detail = data.get("errors") or data.get("error") or "Unknown error"
                error_msg = f"Cloudflare API error: {error_detail}"
                logging.error(f"{error_msg}. Full response: {data}")
                raise Exception(error_msg)

class LLMService:
    def __init__(self):
        self.cloudflare_client = CloudflareClient(
            account_id=settings.CF_ACCOUNT_ID,
            api_token=settings.CF_API_TOKEN,
            model=settings.CF_MODEL
        )
    
    def _get_ollama_client(self, model_name: str):
        url = DEVICE_URLS.get(model_name, settings.ollama_device_a_url)

        if is_ollama_available(url):
            return ollama.Client(host=url)

        return None  # fallback trigger
    
    async def call(self, model_name: str, system_prompt: str, user_content: str) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        client = self._get_ollama_client(model_name)

        if client:
            loop = asyncio.get_event_loop()
            try:
                response = await loop.run_in_executor(
                    None,
                    lambda: client.chat(model=model_name, messages=messages)
                )
                return response["message"]["content"]
            except Exception as e:
                logging.warning(f"Ollama failed, falling back: {e}")

        try:
            return await self.cloudflare_client.chat(messages)
        except Exception as e:
            logging.error(f"Cloudflare call failed: {e}")
            raise e

    async def vision_chat(self, image_bytes: bytes, user_prompt: str, system_prompt: str = "") -> str:
        """Send an image + prompt to moondream via Ollama."""
        client = ollama.Client(host=settings.ollama_device_a_url)
        loop = asyncio.get_event_loop()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({
            "role": "user",
            "content": user_prompt,
            "images": [image_bytes]
        })
        try:
            response = await loop.run_in_executor(
                None,
                lambda: client.chat(model="moondream", messages=messages)
            )
            return response["message"]["content"]
        except Exception as e:
            logging.error(f"Vision call failed: {e}")
            raise e

    async def chat(self, system_prompt: str, user_content: str) -> str:
        return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

    async def summarize(self, system_prompt: str, user_content: str) -> str:
        return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

    async def merge(self, system_prompt: str, user_content: str) -> str:
        return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

    async def extract_graph(self, system_prompt: str, user_content: str) -> str:
        """Calls graph-builder on Device B. Caller must catch exceptions."""
        return await self.call(settings.MODEL_GRAPH_BUILDER, system_prompt, user_content)

    async def exploration_chat(self, system_prompt: str, user_content: str) -> tuple[str, str | None]:
        """
        Exploration stub. Attempts exploration model. Falls back to main-reasoner.
        Returns (response_text, fallback_from).
        """
        try:
            # Future: call a 3B exploration model on Device B
            raise NotImplementedError("Exploration model not yet configured")
        except Exception:
            logging.warning("Exploration model not configured or unreachable. Falling back to main-reasoner.")
            response = await self.chat(system_prompt, user_content)
            return response, "exploration"

    async def propose_branches(self, system_prompt: str) -> dict:
        """Brainstorms next steps and returns structured proposals."""
        raw_response = await self.chat(system_prompt, "Please propose the next branches for this project now.")
        try:
            parsed = self._parse_json(raw_response)
            if isinstance(parsed, list):
                return {"proposals": parsed}
            return parsed
        except Exception as e:
            logging.error(f"Failed to parse branch proposals: {e}. Raw: {raw_response[:500]}")
            return {"proposals": []}

    def _parse_json(self, text: str) -> dict:
        """Cleans markdown backticks and parses JSON."""
        # Find json block or the first {
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            cleaned = match.group(1).strip()
        else:
            # Fallback to finding the first { and last }
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                cleaned = text[start:end+1]
            else:
                cleaned = text.strip()
        return json.loads(cleaned)

llm_service = LLMService()