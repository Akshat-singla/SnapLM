import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        r = await client.get("http://127.0.0.1:11434/api/tags")
        print(r.json())

asyncio.run(test())