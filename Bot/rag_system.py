import chromadb
from chromadb.utils import embedding_functions
import os
from typing import List

class LegalRAG:
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = os.getenv("CHROMA_DB_PATH", "./legal_db")
        self.client = chromadb.PersistentClient(path=db_path)
        # Using Gemini API for embeddings to keep image size small
        self.embedding_fn = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
            api_key=os.getenv("GEMINI_API_KEY")
        )
        self.collection = self.client.get_or_create_collection(
            name="bangladesh_laws_v2", # Versioning the collection since embeddings changed
            embedding_function=self.embedding_fn
        )

    def add_law(self, text: str, metadata: dict, doc_id: str):
        """Add a law section to the vector store."""
        self.collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[doc_id]
        )

    def query_laws(self, query_text: str, n_results: int = 3):
        """Retrieve relevant law sections."""
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        return results

if __name__ == "__main__":
    # Sample indexing for demonstration
    rag = LegalRAG()
    
    # Example: Penal Code 1860 Section 420
    rag.add_law(
        text="Section 420: Cheating and dishonestly inducing delivery of property. Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person... shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
        metadata={"law": "Penal Code 1860", "section": "420", "category": "Fraud"},
        doc_id="pc_1860_420"
    )
    
    # Example: Digital Security Act 2018 Section 24
    rag.add_law(
        text="Section 24: Identity Theft. If any person intentionally or knowingly uses the computer, digital device, or digital system to gather, keep, use or sell any identity information of another person without his legal authority... he shall be punished with imprisonment for a term not exceeding 5 years or with fine not exceeding 5 lac Taka or both.",
        metadata={"law": "Digital Security Act 2018", "section": "24", "category": "Cybercrime"},
        doc_id="dsa_2018_24"
    )

    print("Sample laws indexed successfully.")
