import ollama
from ..config.settings import settings, DEVICE_URLS
import asyncio
import logging


class LLMService:
    def _get_client(self, model_name: str) -> ollama.Client:
        """
        Return an Ollama client pointed at the correct device URL for this model.
        """

        host = DEVICE_URLS.get(model_name)

        if not host:
            raise ValueError(f"No device URL configured for model: {model_name}")

        # Ensure URL has protocol
        if not host.startswith("http"):
            host = f"http://{host}"
        print(f"LLMService: Using host {host} for model {model_name}")
        return ollama.Client(host=host)

    async def call(self, model_name: str, system_prompt: str, user_content: str) -> str:
        """
        Generic Ollama call. All agents go through here.
        """

        client = self._get_client(model_name)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]
        print(model_name)
        try:
            # Modern way (Python 3.9+)
            response = await asyncio.to_thread(
                client.chat,
                model=model_name,
                messages=messages,
            )

            return response["message"]["content"]

        except Exception as e:
            logging.error(f"LLM Call failed for {model_name}: {e}")
            raise

    async def chat(self, system_prompt: str, user_content: str) -> str:
        return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

    async def summarize(self, system_prompt: str, user_content: str) -> str:
        return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

    async def merge(self, system_prompt: str, user_content: str) -> str:
        return await self.call(settings.MODEL_MAIN_REASONER, system_prompt, user_content)

    async def extract_graph(self, system_prompt: str, user_content: str) -> str:
        """
        Calls graph-builder on Device B.
        Caller must catch exceptions.
        """
        return await self.call(settings.MODEL_GRAPH_BUILDER, system_prompt, user_content)

    async def exploration_chat(
        self, system_prompt: str, user_content: str
    ) -> tuple[str, str | None]:
        """
        Exploration stub.
        Attempts exploration model. Falls back to main-reasoner.
        Returns (response_text, fallback_from).
        """
        try:
            raise NotImplementedError("Exploration model not yet configured")
        except Exception:
            logging.warning(
                "Exploration model not configured. Falling back to main-reasoner."
            )
            response = await self.chat(system_prompt, user_content)
            return response, "exploration"


llm_service = LLMService()