
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function embedAndStore(text, metadata) {
    try {
        const index = pc.index(process.env.PINECONE_INDEX || 'zylron-index');
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        try {
            const result = await model.embedContent(text);
            const embedding = result.embedding.values;

            await index.upsert([{
                id: `zylron_${metadata.sessionId || 'anon'}_${Date.now()}`,
                values: embedding,
                metadata: { ...metadata, text }
            }]);
        } catch (innerError) {
            console.warn("⚠️ Semantic Sync Failed (Bypassing):", innerError.message);
        }
        
        return "✅ Document sync attempted";
    } catch (error) {
        console.error("❌ Pinecone Sync Error (Graceful Bypass):", error);
        return null;
    }
}

async function queryVector(queryText) {
    try {
        const index = pc.index(process.env.PINECONE_INDEX || 'zylron-index');
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        
        const result = await model.embedContent(queryText);
        const embedding = result.embedding.values;

        const queryResponse = await index.query({
            vector: embedding,
            topK: 5,
            includeMetadata: true
        });

        return queryResponse.matches.map(m => m.metadata.text).join('\n---\n');
    } catch (error) {
        return `❌ Query failed: ${error.message}`;
    }
}

module.exports = { embedAndStore, queryVector };
