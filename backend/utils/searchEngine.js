const axios = require('axios');

/**
 * Zylron Search Intelligence Engine
 * Integrates real-time web intelligence using the Tavily API protocol.
 * Provides live context for Gemini to answer time-sensitive queries.
 */
const searchWeb = async (query) => {
    try {
        const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
        
        if (!TAVILY_API_KEY) {
            console.warn("Zylron Search Engine: TAVILY_API_KEY missing. Falling back to simulation mode.");
            return `[SIMULATED SEARCH RESULTS FOR: ${query}]\n- Real-time search is currently in simulation mode. Please provide a Tavily API key in the backend .env for live results.`;
        }

        console.log(`Zylron Search Engine: Querying web for "${query}"...`);
        
        const isNews = /news|latest|today|now|recent/i.test(query);
        const payload = {
            api_key: TAVILY_API_KEY,
            query: query + ` (Current Date: ${new Date().toDateString()})`,
            search_depth: "basic",
            include_answer: true,
            max_results: 5
        };

        if (isNews) {
            payload.topic = "news";
            payload.days = 3;
        }

        const response = await axios.post('https://api.tavily.com/search', payload);

        if (response.data && response.data.results) {
            const results = response.data.results.map((r, i) => 
                `[Source ${i+1}: ${r.title}]\nURL: ${r.url}\nContent: ${r.content}\n`
            ).join('\n');
            
            return `[REAL-TIME SEARCH RESULTS FOR: ${query}]\n\n${results}`;
        }

        return "No relevant search results found.";
    } catch (error) {
        console.error("Zylron Search Engine Error:", error.message);
        return `Search failed: ${error.message}`;
    }
};

module.exports = { searchWeb };
