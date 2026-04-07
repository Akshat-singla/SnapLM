# import ollama
# from config import settings, DEVICE_URLS
# import asyncio
# import logging

# class LLMService:
#     def _get_client(self, model_name: str) -> ollama.Client:
#         """Return an Ollama client pointed at the correct device URL for this model."""
#         url = DEVICE_URLS.get(model_name, settings.ollama_device_a_url)
#         return ollama.Client(host=url)

#     async def call(self, model_name: str, system_prompt: str, user_content: str) -> str:
#         """
#         Generic Ollama call. All agents go through here.
#         """
#         client = self._get_client(model_name)
#         messages = [
#             {"role": "system", "content": system_prompt},
#             {"role": "user", "content": user_content}
#         ]
#         # ollama.Client.chat is synchronous — run in executor
#         loop = asyncio.get_event_loop()
#         try:
#             response = await loop.run_in_executor(
#                 None,
#                 lambda: client.chat(model=model_name, messages=messages)
#             )
#             return response["message"]["content"]
#         except Exception as e:
#             logging.error(f"LLM Call failed for {model_name}: {e}")
#             raise e

#     async def vision_chat(self, image_bytes: bytes, user_prompt: str, system_prompt: str = "") -> str:
#         """Send an image + prompt to moondream via Ollama."""
#         client = ollama.Client(host=settings.ollama_device_a_url)
#         loop = asyncio.get_event_loop()
#         messages = []
#         if system_prompt:
#             messages.append({"role": "system", "content": system_prompt})
#         messages.append({
#             "role": "user",
#             "content": user_prompt,
#             "images": [image_bytes]
#         })
#         try:
#             response = await loop.run_in_executor(
#                 None,
#                 lambda: client.chat(model="moondream", messages=messages)
#             )
#             return response["message"]["content"]
#         except Exception as e:
#             logging.error(f"Vision call failed: {e}")
#             raise e

#     async def chat(self, system_prompt: str, user_content: str) -> str:
#         return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

#     async def summarize(self, system_prompt: str, user_content: str) -> str:
#         return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

#     async def merge(self, system_prompt: str, user_content: str) -> str:
#         return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

#     async def extract_graph(self, system_prompt: str, user_content: str) -> str:
#         """Calls graph-builder on Device B. Caller must catch exceptions."""
#         return await self.call(settings.MODEL_GRAPH_BUILDER, system_prompt, user_content)

#     async def exploration_chat(self, system_prompt: str, user_content: str) -> tuple[str, str | None]:
#         """
#         Exploration stub. Attempts exploration model. Falls back to main-reasoner.
#         Returns (response_text, fallback_from).
#         """
#         try:
#             # Future: call a 3B exploration model on Device B
#             raise NotImplementedError("Exploration model not yet configured")
#         except Exception:
#             logging.warning("Exploration model not configured or unreachable. Falling back to main-reasoner.")
#             response = await self.chat(system_prompt, user_content)
#             return response, "exploration"

# llm_service = LLMService()


import ollama
from config import settings, DEVICE_URLS
import asyncio
import logging
import requests
import aiohttp

def is_ollama_available(url: str) -> bool:
    try:
        r = requests.get(f"{url}/api/tags", timeout=2)
        return r.status_code == 200
    except:return False

class CloudflareClient:
    def __init__(self, account_id: str, api_token: str, model: str):
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    async def chat(self, messages):
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.base_url,
                headers=self.headers,
                json={"messages": messages}
            ) as resp:
                data = await resp.json()
                return data["result"]["response"]

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

llm_service = LLMService()