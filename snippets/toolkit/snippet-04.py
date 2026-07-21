from glean.agent_toolkit import tool_spec
from pydantic import BaseModel
import requests

class WeatherResponse(BaseModel):
    temperature: float
    condition: str
    city: str

@tool_spec(
    name="get_current_weather",
    description="Get current weather information for a specified city",
    output_model=WeatherResponse
)
def get_weather(city: str, units: str = "celsius") -> WeatherResponse:
    """Fetch current weather for a city."""
    return WeatherResponse(
        temperature=22.5,
        condition="sunny",
        city=city
    )

# Use across all supported frameworks
openai_weather = get_weather.as_openai_tool()
langchain_weather = get_weather.as_langchain_tool()
crewai_weather = get_weather.as_crewai_tool()
